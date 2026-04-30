import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getAnthropicClient,
  callClaude,
  getJSTDateRange,
  logActivity,
} from '../../../lib/pdca-utils'
import { classifyTaskByUnit } from '../../../lib/business-units'
import { sendLINEBroadcast } from '../../../lib/line-notify'
import { employeePrompts, getEmployeePromptsByDepartment } from '../../../lib/employee-prompts'
import { shouldAutoExecute } from '../../../lib/business-rules'

export const runtime = 'nodejs'
export const maxDuration = 120

// タスク自動実行エンジン
// 10分ごとに実行: highタスクを最大2件ピックアップ → AI社員が実行 → 結果を保存
// これにより「タスクが積まれるだけ」→「タスクが自動で消化される」に変わる
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 1. 実行対象タスクをピックアップ
    // 優先順位: high > normal、期限が近い順、古い順
    const { data: tasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true }) // high=先
      .order('due_date', { ascending: true, nullsFirst: false }) // 期限近い順
      .order('created_at', { ascending: true }) // 古い順
      .limit(2) // 1回あたり最大2件（API負荷対策）

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No pending tasks to execute' })
    }

    const results: Array<{
      id: string
      title: string
      department: string
      status: string
      summary?: string
      error?: string
    }> = []

    for (const task of tasks) {
      // 事業ルールで自動実行を許可されているか確認
      // 許可されていない事業のタスクはスキップ（陽平さんの作業負荷を守るため）
      if (!shouldAutoExecute(task.department || '', task.title || '')) {
        results.push({
          id: task.id,
          title: task.title,
          department: task.department || '',
          status: 'skipped',
          summary: '事業ルールで自動実行が無効。陽平さんの判断待ち',
        })
        continue
      }

      // 2. タスクをin_progressに更新
      await supabase
        .from('vo_tasks')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      // 3. 担当AI社員を特定（名前・部署・タスク内容からスキルマッチ）
      const assignedEmployee = findEmployee(task.employee_name, task.department, task.title, task.description)
      const employeeName = assignedEmployee?.name || task.employee_name || '汎用AI'
      const department = assignedEmployee?.department || task.department || '全社'

      // 活動ログ: タスク着手
      await logActivity(employeeName, department, 'タスク着手',
        `[${task.priority}] ${task.title}`)

      try {
        // 4. 関連する患者の声を取得（AI生成の素材）
        const relevantVoices = await fetchRelevantVoices(supabase, task)

        // 5. AI社員のシステムプロンプトでタスクを実行（声を埋め込む）
        const systemPrompt = buildTaskSystemPrompt(assignedEmployee, task, relevantVoices)
        const userMessage = buildTaskUserMessage(task)

        // コンテンツ系タスクはトークン多め（投稿・記事・提案書等）
        const contentKeywords = ['投稿', '記事', 'コピー', '文章', 'lp', '提案書', 'ブログ', 'sns', 'facebook', 'line', '原稿', 'セールス', '台本', 'チラシ', 'マニュアル']
        const taskText = `${task.title} ${task.description || ''}`.toLowerCase()
        const isContentTask = contentKeywords.some(kw => taskText.includes(kw))
        const tokenLimit = isContentTask ? 6000 : 3000

        const result = await callClaude(client, systemPrompt, userMessage, tokenLimit)

        // 5. 実行サマリーを抽出
        const summaryBlock = extractExecutionSummary(result)

        // 6. タスクを完了に更新（完了時刻・詳細内容を記録）
        // completion_noteに全結果を保存（最大5000文字）
        const completionNote = [
          `【${employeeName}が自動実行】`,
          '',
          summaryBlock.summary,
          '',
          '--- 成果物 ---',
          summaryBlock.deliverable.substring(0, 4000),
        ].join('\n').substring(0, 5000)

        await supabase
          .from('vo_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completion_note: completionNote,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        // 7. 実行結果をcommands形式で保存（他の部分から参照可能に）
        await supabase.from('commands').insert({
          instruction: `【タスク自動実行】${task.title}\n${task.description || ''}`,
          status: 'completed',
          result: result.substring(0, 10000),
          assigned_department: department,
          assigned_employee: employeeName,
          source: 'auto',
          completed_at: new Date().toISOString(),
        })

        // 使った患者の声をマーク（used_count++）
        if (relevantVoices.length > 0) {
          await markVoicesUsed(supabase, relevantVoices.map(v => v.id))
        }

        // 8. 活動ログ: 完了
        await logActivity(employeeName, department, 'タスク完了',
          `${task.title}\n${summaryBlock.summary.substring(0, 300)}`)

        results.push({
          id: task.id,
          title: task.title,
          department,
          status: 'completed',
          summary: summaryBlock.summary,
        })

        // 9. 連鎖タスクの検知
        // タスク結果の中に他部署への依頼が含まれていれば自動生成
        await detectFollowUpTasks(supabase, task, result, today)

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)

        // 失敗時はpendingに戻す（次回再挑戦）
        await supabase
          .from('vo_tasks')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        await logActivity(employeeName, department, 'タスク実行エラー',
          `${task.title}: ${errMsg}`)

        results.push({
          id: task.id,
          title: task.title,
          department,
          status: 'error',
          error: errMsg,
        })
      }
    }

    // LINE自動完了報告を送信（実行結果がある場合のみ）
    if (results.length > 0) {
      const completed = results.filter(r => r.status === 'completed')
      const errors = results.filter(r => r.status === 'error')

      let lineReport = `🤖 自動完了報告\n`

      for (const r of completed) {
        const unit = classifyTaskByUnit(r.department, r.title)
        lineReport += `\n✅ 【${unit}】${r.title}\n`
        // サマリーの箇条書き部分を追加（LINEは5000文字制限あるので簡潔に）
        if (r.summary) {
          lineReport += `━━━━━━━━━━━\n`
          // サマリーから最大300文字抽出
          const briefSummary = r.summary.substring(0, 300)
          lineReport += `${briefSummary}\n`
        }
      }

      for (const r of errors) {
        const unit = classifyTaskByUnit(r.department, r.title)
        lineReport += `\n⚠️ 【${unit}】${r.title}\nエラー発生→確認が必要です\n`
      }

      lineReport += `\n完了：${completed.length}件`
      if (errors.length > 0) {
        lineReport += ` / エラー：${errors.length}件`
      }

      // LINE文字数制限対策（5000文字超は切り詰め）
      if (lineReport.length > 4900) {
        lineReport = lineReport.substring(0, 4900) + '\n...(省略)'
      }

      await sendLINEBroadcast(lineReport, 'task-engine')
    }

    return NextResponse.json({
      success: true,
      date: today,
      executed: results.filter(r => r.status === 'completed').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// 社員名 or 部署名 or タスク内容からAI社員を特定
function findEmployee(employeeName?: string | null, department?: string | null, taskTitle?: string, taskDescription?: string) {
  // 1. 名前で検索（最優先）
  if (employeeName) {
    const found = Object.values(employeePrompts).find(
      ep => ep.name === employeeName
    )
    if (found) return found
  }

  // 2. タスク内容からスキルマッチ
  const text = `${taskTitle || ''} ${taskDescription || ''}`.toLowerCase()
  const skillMatch: Record<string, string> = {
    // 経営層
    '戦略': 'reia', '方針': 'reia', 'ビジョン': 'reia',
    '進捗': 'sorato', 'ボトルネック': 'sorato', '執行': 'sorato', '部署間': 'sorato',
    'タスク': 'miko', 'スケジュール': 'miko', '日報': 'miko', '優先順位': 'miko',
    'マニュアル': 'ruka', 'sop': 'ruka', '手順書': 'ruka', '仕組み': 'ruka', 'テンプレート': 'ruka',
    // 財務部
    '売上': 'misa', '収益': 'misa', 'kpi': 'misa', '財務': 'misa', '集計': 'misa', '請求': 'misa', 'コスト': 'misa',
    // 整体院事業部
    'meo': 'haru', '広告': 'haru', '集客': 'haru', 'gbp': 'haru', 'キーワード': 'haru',
    '予約': 'nagi', '顧客管理': 'nagi', '問診': 'nagi', '検査アプリ運用': 'nagi', '物販': 'nagi', '在庫': 'nagi',
    'コピー': 'fumi', '文章': 'fumi', '記事': 'fumi', 'line': 'fumi',
    // 訪問鍼灸事業部
    '訪問': 'aki', 'ケアマネ': 'aki', '訪問営業': 'aki', '居宅': 'aki',
    'レセプト': 'yuki', '労務': 'yuki', 'シフト': 'yuki', '勤怠': 'yuki', '給与': 'yuki',
    '営業リスト': 'saku', '事業所リスト': 'saku',
    // AI開発部
    'アプリ': 'tetsu', 'saas': 'tetsu', 'プロダクト設計': 'tetsu',
    '開発': 'kou', 'バグ': 'kou', '修正': 'kou', 'プロンプト': 'kou',
    'マルチテナント': 'riku', 'stripe': 'riku', '課金': 'riku', '認証': 'riku', 'rls': 'riku',
    'デプロイ': 'taku', 'インフラ': 'taku', 'vercel': 'taku', 'supabase': 'taku',
    // メディア部
    'youtube': 'tsuki', 'ヒーリング': 'tsuki', 'チャンネル': 'tsuki',
    '動画分析': 'luna', 'コンテンツ分析': 'luna', '再生数': 'luna', 'サムネイル': 'luna',
    // LP・Web制作部
    'lp': 'maya', 'ランディング': 'maya', 'ワイヤーフレーム': 'maya',
    'seo': 'rin', 'faq': 'rin', 'hp': 'rin', 'ホームページ': 'rin', '症状ページ': 'rin',
    '回数券': 'noa', '高額': 'noa', 'セールスページ': 'noa', 'プレミアム': 'noa',
    // BtoB営業部
    'btob': 'jin', '営業': 'jin', '提案': 'jin', 'モニター': 'jin', '提案書': 'jin',
    'リサーチ': 'sena', '競合': 'sena', '調査': 'sena', '市場': 'sena',
    'ローンチ': 'rio', 'facebook': 'rio', 'オープンチャット': 'rio', '告知': 'rio',
    // 動画・デザイン制作部
    '動画編集': 'hika', '映像': 'hika', 'shorts': 'hika', 'デモ動画': 'hika',
    'チラシ': 'sui', 'pop': 'sui', 'バナー': 'sui', 'デザイン': 'sui', 'フライヤー': 'sui',
    // プロダクト管理部
    'pm': 'kana', '要件': 'kana', 'ロードマップ': 'kana',
    'ux': 'mio', 'ui': 'mio', '使いやすさ': 'mio', '操作性': 'mio',
    'テスト': 'ren', 'qa': 'ren', '品質': 'ren', 'バグレポート': 'ren',
    // カスタマーサクセス部
    '導入': 'aoi', 'オンボーディング': 'aoi', '定着': 'aoi', '解約': 'aoi',
    'マーケティング': 'shou', 'ファネル': 'shou', 'リード': 'shou', 'セミナー': 'shou',
    // 汎用（後方一致で拾う）
    '投稿': 'fumi', 'sns': 'saku', '動画': 'hika',
  }

  for (const [keyword, empId] of Object.entries(skillMatch)) {
    if (text.includes(keyword) && employeePrompts[empId]) {
      return employeePrompts[empId]
    }
  }

  // 3. 部署で検索（部長を優先的に返す）
  if (department) {
    const deptEmployees = getEmployeePromptsByDepartment(department)
    if (deptEmployees.length > 0) return deptEmployees[0]
  }

  // デフォルト: レイア
  return employeePrompts['reia'] || null
}

interface VoiceForPrompt {
  id: string
  raw_text: string
  normalized_quote: string | null
  symptom_tags: string[]
  emotion_tags: string[]
  scene_tags: string[]
  repeat_status: string
}

// タスクの内容から関連する患者の声を取得
async function fetchRelevantVoices(
  supabase: ReturnType<typeof getSupabase>,
  task: { title: string; description?: string; department?: string }
): Promise<VoiceForPrompt[]> {
  try {
    // 事業を判定
    const text = `${task.title} ${task.description || ''} ${task.department || ''}`.toLowerCase()
    const isHoumon = text.includes('訪問') || text.includes('鍼灸') || text.includes('晴陽')
    const businessUnit = isHoumon ? '晴陽鍼灸院' : '大口神経整体院'

    // 主要な症状キーワードを抽出
    const symptomKeywords = ['肩こり', '腰痛', '頭痛', '痺れ', '不眠', '坐骨', '神経痛', '膝', '首', '自律神経', '冷え', 'むくみ']
    const matchedSymptoms = symptomKeywords.filter((kw) => text.includes(kw.toLowerCase()))

    let query = supabase
      .from('vo_patient_voices')
      .select('id,raw_text,normalized_quote,symptom_tags,emotion_tags,scene_tags,repeat_status')
      .eq('business_unit', businessUnit)
      .order('used_count', { ascending: true }) // あまり使われていない声を優先
      .order('captured_at', { ascending: false, nullsFirst: false })
      .limit(8)

    if (matchedSymptoms.length > 0) {
      // overlapsで複数症状にマッチ
      query = query.overlaps('symptom_tags', matchedSymptoms)
    }

    const { data } = await query
    if (data && data.length > 0) return data as VoiceForPrompt[]

    // フォールバック: 事業内からランダムに取得
    const { data: fallback } = await supabase
      .from('vo_patient_voices')
      .select('id,raw_text,normalized_quote,symptom_tags,emotion_tags,scene_tags,repeat_status')
      .eq('business_unit', businessUnit)
      .order('used_count', { ascending: true })
      .limit(5)
    return (fallback as VoiceForPrompt[]) ?? []
  } catch (e) {
    console.error('fetchRelevantVoices error:', e)
    return []
  }
}

// 使った声のused_countをインクリメント
async function markVoicesUsed(
  supabase: ReturnType<typeof getSupabase>,
  ids: string[]
) {
  if (ids.length === 0) return
  try {
    // PostgreSQLの式更新は直接できないので、各IDをフェッチ→+1→update
    const { data } = await supabase
      .from('vo_patient_voices')
      .select('id,used_count')
      .in('id', ids)
    if (!data) return
    const now = new Date().toISOString()
    for (const row of data) {
      await supabase
        .from('vo_patient_voices')
        .update({ used_count: (row.used_count ?? 0) + 1, last_used_at: now })
        .eq('id', row.id)
    }
  } catch (e) {
    console.error('markVoicesUsed error:', e)
  }
}

// タスク実行用のシステムプロンプト
function buildTaskSystemPrompt(
  employee: { name: string; department: string; role: string; systemPrompt: string } | null,
  task: { department?: string; priority?: string },
  voices: VoiceForPrompt[] = []
) {
  const base = employee?.systemPrompt || `あなたは大口ヘルスケアグループのAI社員です。与えられたタスクを確実に実行してください。`

  // 患者の声を整形
  const voicesBlock = voices.length > 0
    ? `\n【現場の声（必ず1つ以上を成果物に組み込む・引用または下敷きに）】\n` +
      voices.map((v, i) => {
        const quote = v.normalized_quote || v.raw_text
        const symp = v.symptom_tags.length > 0 ? ` [症状:${v.symptom_tags.join('/')}]` : ''
        const emo = v.emotion_tags.length > 0 ? ` [感情:${v.emotion_tags.join('/')}]` : ''
        return `${i + 1}. 「${quote}」${symp}${emo}`
      }).join('\n')
    : `\n【現場の声】まだ患者発言DBに該当データがありません。今回は哲学に従って一般化を避け、「ガッチガチ」「夜中に目が覚める」など現場で使われる生っぽい表現を入れて補ってください。`

  return `あなたはAI Solutionsのバーチャル社員です。以下の行動指針に従って動いてください。
- Facebook投稿タスクはアプリ事業のみ
- MEO勝ち上げ君はモニター中のため運用タスク不要
- タスクtitleは25文字以内
- 実態のないタスクは生成しない
- CCがやること（自動）と大口さんがやること（確認）を明確に分ける
- YouTube完了報告は日報にまとめる

【全社共通：マーケ哲学（必ず踏まえて生成すること）】
■ アウトフロー思考
常に与える側でいる。相手が求める価値を理解した上で、それを上回る価値を渡す。出したアウトフローの価値が高ければ、良いインフロー（売上・信頼・口コミ）が返ってくる。

■ 独占ポジション（ピーター・ティール）
競争はせず独占を作る。0→1の発想（既存の改良ではない）。10倍の改善で誰も乗り換えない状態を作る。
- 大口神経整体院の独占ポジション = 「他の病院や治療院でも原因がわからない・変化が出ない重症慢性痛・神経痛」専門
- 訪問鍼灸の独占 = 「人生のパフォーマンスを上げるリハビリ」（トイレ自立・家事復帰も含む）

■ LTV最大化
CPAを抑えてLTVを伸ばす＝利益LTV最大化。コンテンツには必ず「問題解決＋目標達成＋目標再設定」の構造を入れる。痛み除去だけでなくパフォーマンス向上まで提案する。

■ 機能的価値×情緒的価値（両輪で書け）
- 機能的価値（結果）：原因がわかる／生活が変わる／再発不安が減る／自分で対処できる感覚／将来を諦めなくていい
- 情緒的価値（感情）：安心／納得／尊重されている感覚／希望／主体性が戻る／「やっと理解された」
両方を必ず含める。片方だけは「一般論っぽい・響かない」コンテンツになる。

■ 神経整体 3ステップ施術フレーム（症状ページ・LP・提案書で使う）
1. リセット（マイナスをゼロに戻す）：可動域＋筋出力の正常化
2. プラスを作る：姿勢保持筋・基礎筋力の向上
3. 機能性向上＋人生のパフォーマンス：日常動作・スポーツ動作・「その人にとってのパフォーマンス」

■ 現場の声を最優先素材にする
一般論ではなく、患者が実際に発した言葉（例：「肩ガッチガチでしんどい」「夜中に痺れで目が覚める」）を必ず1つ以上入れる。AIっぽい綺麗な言葉ではなく、現場の生っぽい言葉を使う。
${voicesBlock}

${base}

【タスク実行モード】
あなたは今、自動タスク実行エンジンから呼び出されています。
あなたはその道のプロです。プロとして本気の成果物を出してください。

絶対ルール:
1. 「検討します」「考えます」「〜が必要です」は禁止。実際に完成した成果物を出すこと。
2. 文章作成タスクは、そのままコピペして使える完成度で書くこと。短い要約ではなく、本文をフルで書くこと。
3. Facebook投稿なら400-600文字、ブログなら1500-2000文字、LINE配信なら200-300文字、提案書なら全セクション完成で出すこと。
4. 「〜しましょう」「〜が大切です」のような一般論は書かない。具体的な内容・数字・事例を入れること。
5. AIっぽい文章は絶対NG。以下を守ること:
   - 「それだけで〜」「〜ことです」のきれいなまとめ文で終わらない
   - 毎回同じ構成（問題→解決→結論）にしない。たまには結論から入る、途中で脱線する、問いかけで終わる
   - 完璧に整った文章にしない。実際の人間が書いたような「揺れ」を入れる
   - 「いや、正確に言うと」「ここだけの話」「正直に言うと」のような生っぽい表現を使う
   - 1文の長さをバラバラにする。短い文と長い文を混ぜる
6. 他の部署との連携が必要な場合は【連携依頼】として明記すること。
7. 回答はプレーンテキストで、マークダウン記号は使わないこと。
8. 優先度: ${task.priority || 'normal'}
9. 所属: ${task.department || employee?.department || '全社'}

【出力フォーマット（必須）】
回答の冒頭に必ず以下の形式で実行サマリーを記載すること。その後に成果物本体を続けること。

---実行サマリー---
実行内容:
・やったことを箇条書きで2〜4行（具体的に）
・数値があれば数値を含める
生成物: あり/なし（ありの場合は種類を記載。例: Facebook投稿文、提案書、分析レポート等）
次回アクション: 次に必要なアクションがあれば1〜2行で記載。なければ「なし」
---実行サマリー終了---

（ここから成果物本体を記載）`
}

// タスクをユーザーメッセージに変換
function buildTaskUserMessage(task: {
  title: string
  description?: string
  department?: string
  due_date?: string
  generated_by?: string
}) {
  const lines = [
    `【タスク】${task.title}`,
    '',
  ]

  if (task.description) {
    lines.push(`【詳細】`)
    lines.push(task.description)
    lines.push('')
  }

  if (task.due_date) {
    lines.push(`【期限】${task.due_date}`)
  }

  if (task.generated_by) {
    lines.push(`【発行元】${task.generated_by}`)
  }

  lines.push('')
  lines.push('上記のタスクを実行し、結果を報告してください。')

  return lines.join('\n')
}

// AIの出力から実行サマリーブロックを抽出
function extractExecutionSummary(result: string): { summary: string; deliverable: string } {
  // ---実行サマリー--- ... ---実行サマリー終了--- を抽出
  const summaryMatch = result.match(/---実行サマリー---([\s\S]*?)---実行サマリー終了---/)
  if (summaryMatch) {
    const summary = summaryMatch[1].trim()
    // サマリー終了後が成果物本体
    const afterSummary = result.split('---実行サマリー終了---')[1] || ''
    return {
      summary,
      deliverable: afterSummary.trim(),
    }
  }

  // フォーマットに従っていない場合のフォールバック
  // 先頭300文字をサマリーとして扱う
  const lines = result.split('\n').filter(l => l.trim())
  const summaryLines: string[] = []
  let remaining = result

  // 箇条書き行（・や- や数字.で始まる行）を最大5行抽出
  for (const line of lines.slice(0, 10)) {
    if (line.match(/^[・\-\d]/) || line.includes('実行') || line.includes('完了') || line.includes('作成')) {
      summaryLines.push(line.trim())
      if (summaryLines.length >= 5) break
    }
  }

  if (summaryLines.length > 0) {
    return {
      summary: summaryLines.join('\n'),
      deliverable: remaining,
    }
  }

  return {
    summary: result.substring(0, 300),
    deliverable: result,
  }
}

// 連鎖タスクの検知: 実行結果に他部署への依頼が含まれていれば自動生成
async function detectFollowUpTasks(
  supabase: ReturnType<typeof getSupabase>,
  originalTask: { id: string; title: string; department: string; batch_id?: string },
  result: string,
  today: string
) {
  // 【連携依頼】パターンを検知
  const handoffPattern = /【連携依頼】([^\n]+)/g
  const matches = [...result.matchAll(handoffPattern)]

  if (matches.length === 0) return

  for (const match of matches) {
    const handoffText = match[1].trim()

    // 部署名を推定
    const deptKeywords: Record<string, string> = {
      'LP': 'LP・Web制作部',
      'ランディング': 'LP・Web制作部',
      'SEO': 'LP・Web制作部',
      'デザイン': 'LP・Web制作部',
      '営業': 'BtoB営業部',
      'BtoB': 'BtoB営業部',
      '開発': 'AI開発部',
      'アプリ': 'AI開発部',
      '動画': 'メディア部',
      'YouTube': 'メディア部',
      '導入': 'カスタマーサクセス部',
      'オンボーディング': 'カスタマーサクセス部',
      '財務': '財務部',
      '売上': '財務部',
      'MEO': '整体院事業部',
      '集客': '整体院事業部',
      '訪問': '訪問鍼灸事業部',
    }

    let targetDept = '経営層' // デフォルト
    for (const [keyword, dept] of Object.entries(deptKeywords)) {
      if (handoffText.includes(keyword)) {
        targetDept = dept
        break
      }
    }

    await supabase.from('vo_tasks').insert({
      department: targetDept,
      title: handoffText.substring(0, 30),
      description: `【自動連鎖タスク】\n元タスク: ${originalTask.title}（${originalTask.department}）\n\n${handoffText}`,
      priority: 'normal',
      status: 'pending',
      due_date: today,
      batch_id: `chain_${originalTask.batch_id || originalTask.id}`,
      generated_by: 'task_engine_chain',
    })
  }
}

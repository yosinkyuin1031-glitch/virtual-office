import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getAnthropicClient,
  callClaude,
  extractJSON,
  getJSTDateRange,
  logActivity,
  isDuplicateExecution,
} from '../../../lib/pdca-utils'
import { BUSINESS_UNITS } from '../../../lib/business-units'
import { sendLINEBroadcast } from '../../../lib/line-notify'

export const runtime = 'nodejs'
export const maxDuration = 120

// direction / insight カテゴリのメモを company_context に昇格
// 戻り値: 昇格件数
async function promoteMemosToContext(supabase: ReturnType<typeof getSupabase>): Promise<number> {
  const businessKeywords: Record<string, string> = {
    '整体': 'seitai',
    '訪問': 'houmon',
    '鍼灸': 'houmon',
    '晴陽': 'houmon',
    'アプリ': 'app_sales',
    'カラダマップ': 'app_sales',
    'クリニックコア': 'app_sales',
    'ポイント管理': 'app_sales',
    'BR': 'device',
    '機器': 'device',
    '血管': 'device',
    'コンサル': 'consulting',
    '秘密基地': 'consulting',
  }

  const detectBiz = (text: string): string[] => {
    const tags = new Set<string>()
    for (const [kw, tag] of Object.entries(businessKeywords)) {
      if (text.includes(kw)) tags.add(tag)
    }
    return Array.from(tags)
  }

  const catMap: Record<string, string> = { direction: 'direction', insight: 'insight', feedback: 'rule' }

  const { data: memos } = await supabase
    .from('chairman_memos')
    .select('*')
    .in('category', ['direction', 'insight'])
    .eq('promoted_to_context', false)
    .limit(50)

  if (!memos || memos.length === 0) return 0

  const rows = memos.map((m: Record<string, unknown>) => ({
    title: String(m.content).slice(0, 50),
    content: m.content,
    category: catMap[m.category as string] || 'other',
    department_tags: m.department_tags || [],
    business_tags: detectBiz(String(m.content)),
    source: m.source === 'proud' ? 'proud' : 'promoted',
    source_memo_id: m.id,
  }))

  const { error } = await supabase.from('company_context').insert(rows)
  if (error) return 0

  const ids = memos.map((m: Record<string, unknown>) => m.id)
  await supabase.from('chairman_memos').update({ promoted_to_context: true }).in('id', ids)

  return memos.length
}

// 毎晩21:00 JST（UTC 12:00）に自動実行
// 翌日のタスク案をLINEで送信し、大口さんの振り分け返信を待つ
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    if (await isDuplicateExecution('night_review')) {
      return NextResponse.json({ message: '本日の夜振り分けは実行済みです' })
    }

    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 翌日の日付
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    // 1. 未完了タスク取得
    const { data: pendingTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })

    // 2. KPI取得
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    // 3. コンテキスト取得
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    // 4. 当日の活動（進捗確認用）
    const { startUTC, endUTC } = getJSTDateRange()
    const { data: todayActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: false })
      .limit(20)

    const goalsText = (goals || []).map(g => `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`).join('\n')
    const contextText = (contexts || []).map(c => `[${c.category}] ${c.title}: ${c.content}`).join('\n')
    const tasksText = (pendingTasks || []).map(t => `- [${t.priority}] ${t.department}: ${t.title}`).join('\n')
    const activityText = (todayActivity || []).slice(0, 10).map(a => `- ${a.employee_name}: ${a.action}`).join('\n')

    // Claude APIで翌日のタスク案を5事業別×2分類で生成
    const unitNames = BUSINESS_UNITS.map(u => u.name).join('|')
    const systemPrompt = `あなたはAI Solutionsのバーチャル社員です。以下の行動指針に従って動いてください。
- Facebook投稿タスクはアプリ事業のみ
- MEO勝ち上げ君はモニター中のため運用タスク不要
- タスクtitleは25文字以内
- 実態のないタスクは生成しない
- CCがやること（自動）と大口さんがやること（確認）を明確に分ける
- YouTube完了報告は日報にまとめる

あなたはミコ。AI Solutions社の秘書。毎晩21時に翌日のタスク案を整理して会長に報告する。

【5事業】
1. 大口神経整体院（整体院経営全般）
2. 晴陽鍼灸院（訪問鍼灸リハビリ）
3. 治療機器販売（BR・血管顕微鏡のBtoB）
4. アプリ事業（BtoB SaaS開発・販売）
5. 治療家コミュニティ（FCL・セミナー・コンサル）

【振り分けルール】
- auto: AI社員が自動実行できるもの（SNS投稿作成、データ集計、レポート生成、定型作業）
- confirm: 大口さんの判断が必要なもの（戦略決定、外部連絡、金額決定、新規企画の方向性）

出力フォーマット（厳守）:
===TASKS===
[
  {
    "id": 1,
    "business_unit": "${unitNames}",
    "title": "タスク名（20文字以内）",
    "description": "簡潔な説明",
    "suggested_type": "auto|confirm",
    "reason": "振り分け理由（10文字以内）"
  }
]
===SUMMARY===
翌日の全体方針（2〜3行、プレーンテキスト）`

    const userMessage = `【本日】${today}
【翌日】${tomorrow}

【KPI】
${goalsText}

【コンテキスト】
${contextText}

【未完了タスク（${pendingTasks?.length || 0}件）】
${tasksText || 'なし'}

【本日の活動】
${activityText || 'なし'}

上記を踏まえて、翌日（${tomorrow}）のタスク案を5事業別に整理してください。各タスクにauto/confirmの振り分け提案もつけてください。合計10〜15件程度。`

    const result = await callClaude(client, systemPrompt, userMessage)

    const tasksMatch = result.match(/===TASKS===([\s\S]*?)===SUMMARY===/)
    const summaryMatch = result.match(/===SUMMARY===([\s\S]*)$/)

    const tasksJSON = extractJSON(tasksMatch?.[1] || '') as Array<Record<string, string>> | null
    const summary = summaryMatch?.[1]?.trim() || ''

    // タスク案をvo_task_assignmentsに保存
    const savedTasks: Array<Record<string, unknown>> = []
    if (tasksJSON && Array.isArray(tasksJSON)) {
      for (const t of tasksJSON) {
        const { data } = await supabase
          .from('vo_task_assignments')
          .insert({
            task_date: tomorrow,
            business_unit: t.business_unit || 'アプリ事業',
            task_title: (t.title || '').substring(0, 50),
            task_description: t.description || '',
            task_type: t.suggested_type === 'confirm' ? 'confirm' : 'auto',
          })
          .select()
          .single()
        if (data) savedTasks.push(data)
      }
    }

    // LINE送信（振り分け確認メッセージ）
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][new Date(tomorrow + 'T00:00:00+09:00').getDay()]

    let lineMessage = `明日のタスク確認\n${tomorrow}(${dayOfWeek})\n━━━━━━━━━━━━━\n`

    if (summary) {
      lineMessage += `\n${summary}\n`
    }

    // 5事業別にグループ化
    const tasksByUnit: Record<string, Array<Record<string, string>>> = {}
    if (tasksJSON) {
      for (const t of tasksJSON) {
        const unit = t.business_unit || 'アプリ事業'
        if (!tasksByUnit[unit]) tasksByUnit[unit] = []
        tasksByUnit[unit].push(t)
      }
    }

    let taskNumber = 1
    for (const unit of BUSINESS_UNITS) {
      const tasks = tasksByUnit[unit.name]
      if (!tasks || tasks.length === 0) continue

      lineMessage += `\n${unit.emoji} ${unit.name}\n`
      for (const t of tasks) {
        const typeIcon = t.suggested_type === 'confirm' ? '✅' : '🤖'
        lineMessage += `${taskNumber}. ${typeIcon} ${t.title}\n`
        taskNumber++
      }
    }

    lineMessage += `\n━━━━━━━━━━━━━\n`
    lineMessage += `返信方法:\n`
    lineMessage += `番号+指示で変更できます\n`
    lineMessage += `例: 「3 スキップ」「5 自動」「7 確認」\n`
    lineMessage += `「OK」で全て承認\n`
    lineMessage += `━━━━━━━━━━━━━`

    const lineSent = await sendLINEBroadcast(lineMessage)

    // 活動ログ記録
    await logActivity('ミコ', '経営層', '翌日タスク振り分け送信',
      `${tomorrow}のタスク${savedTasks.length}件をLINEで送信`)

    // PDCAレポート保存
    const { savePDCAReport } = await import('../../../lib/pdca-utils')
    await savePDCAReport('night_review' as 'morning', {
      daily_summary: {
        task_count: savedTasks.length,
        by_unit: Object.fromEntries(
          Object.entries(tasksByUnit).map(([k, v]) => [k, v.length])
        ),
      },
      priority_tasks: summary,
    })

    // メモ → company_context 自動昇格（direction / insight のみ）
    const promotedCount = await promoteMemosToContext(supabase)

    return NextResponse.json({
      success: true,
      cycle: 'night_review',
      date: today,
      tomorrow,
      taskCount: savedTasks.length,
      promotedMemos: promotedCount,
      lineSent,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    await logActivity('システム', '全社', '夜振り分けエラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

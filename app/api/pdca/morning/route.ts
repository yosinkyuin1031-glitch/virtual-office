import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getAnthropicClient,
  callClaude,
  extractJSON,
  getJSTDateRange,
  logActivity,
  savePDCAReport,
  isDuplicateExecution,
} from '../../../lib/pdca-utils'
import { BUSINESS_UNITS, classifyTaskByUnit } from '../../../lib/business-units'
import { sendLINEBroadcast } from '../../../lib/line-notify'

export const runtime = 'nodejs'
export const maxDuration = 120

// 毎朝7:00 JST（UTC 22:00前日）に自動実行
// レイアがCEOとして全社を見渡し、朝礼を行う
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    // 重複実行防止
    if (await isDuplicateExecution('morning')) {
      return NextResponse.json({ message: '本日の朝サイクルは実行済みです' })
    }

    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 1. KPI取得
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    // 2. コンテキスト取得
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    // 3. 未完了タスク取得
    const { data: pendingTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })

    // 4. 直近の活動ログ（昨日分）
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
      .limit(30)

    // 5. 昨晩のPDCAレポート（あれば参照）
    const { data: lastEvening } = await supabase
      .from('vo_pdca_reports')
      .select('*')
      .eq('cycle_type', 'evening')
      .order('executed_at', { ascending: false })
      .limit(1)

    // 6. 昨晩の振り分け確認結果を取得
    const { data: assignments } = await supabase
      .from('vo_task_assignments')
      .select('*')
      .eq('task_date', today)
      .not('user_response', 'is', null)

    // 7. 定期タスクマスターから今日該当分を取得
    const todayDate = new Date(today + 'T00:00:00+09:00')
    const dayOfMonthNum = todayDate.getDate()
    const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate()
    const isLastDay = dayOfMonthNum === lastDayOfMonth

    const { data: recurringTasks } = await supabase
      .from('vo_recurring_tasks')
      .select('*')
      .eq('is_active', true)

    // 日付にマッチする定期タスクを抽出
    const todayRecurring = (recurringTasks || []).filter(rt => {
      if (rt.day_type === 'exact' && rt.day_of_month === dayOfMonthNum) return true
      if (rt.day_type === 'reminder' && rt.day_of_month === dayOfMonthNum) return true
      if (rt.day_type === 'last_day' && isLastDay) return true
      return false
    })

    const goalsText = (goals || []).map(g => `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`).join('\n')
    const contextText = (contexts || []).map(c => `[${c.category}] ${c.title}: ${c.content}`).join('\n')
    const tasksText = (pendingTasks || []).map(t => `- [${t.priority}] ${t.department}: ${t.title} (期限: ${t.due_date || '未設定'})`).join('\n')
    const activityText = (recentActivity || []).slice(0, 15).map(a => `- ${a.employee_name}(${a.department}): ${a.action} - ${a.detail?.substring(0, 80)}`).join('\n')
    const eveningInsight = lastEvening?.[0]?.daily_summary ? JSON.stringify(lastEvening[0].daily_summary) : 'なし'

    // 振り分け結果テキスト
    const assignmentText = (assignments || []).length > 0
      ? (assignments || []).map(a => `- [${a.business_unit}] ${a.task_title}: ${a.user_response === 'auto' ? '自動実行' : a.user_response === 'confirm' ? '確認必要' : 'スキップ'}`).join('\n')
      : '振り分け結果なし（デフォルト判定）'

    // Claude API 1回で全て生成（5事業×2分類形式）
    const systemPrompt = `あなたはAI Solutionsのバーチャル社員です。以下の行動指針に従って動いてください。
- Facebook投稿タスクはアプリ事業のみ
- MEO勝ち上げ君はモニター中のため運用タスク不要
- タスクtitleは25文字以内
- 実態のないタスクは生成しない
- CCがやること（自動）と大口さんがやること（確認）を明確に分ける
- YouTube完了報告は日報にまとめる

あなたはレイア。AI Solutions社のCEO。会長（大口陽平）の右腕として、毎朝全社の状況を確認し、的確な判断を下す。

【ビジョン】挑戦を諦めない人が増え、温かく支え合える社会。
【ミッション】「できない」を「できる」に変え、光を灯す。

【5事業】
1. 大口神経整体院（安定収益・ノウハウの源泉）
2. 晴陽鍼灸院（訪問鍼灸リハビリ・スタッフ拡大でスケール）
3. 治療機器販売（BR・血管顕微鏡のBtoB）
4. アプリ事業（BtoB SaaS・ストック型収益）
5. 治療家コミュニティ（FCL・セミナー・コンサル）

あなたの役割:
- KPIの進捗を冷静に分析し、遅れている項目を特定
- 各タスクを5事業に振り分け、「自動でやること」「大口さんが確認すること」に分類
- 会長の振り分け指示があれば最優先で反映する
- 全社員を鼓舞する朝礼メッセージを生成

【重要: タスク生成の注意事項】
- タスクのtitleは必ず25文字以内に収めること。途中で切れたタスクは絶対に出さない。
- タスクのdescriptionは100文字以内に収めること。
- MEO勝ち上げくんについて: モニター11名が稼働中だが、大口さん側でのアクティブな運用作業は現在していない。タスクとして出す場合は「モニターFB確認」「安定性チェック」程度に留めること。大量のMEO運用タスクは生成しない。
- YouTube自動投稿について: 4チャンネル（月光ヒーリング・Lo-Fi Cafe BGM・Nature Sound ASMR・ゆるり瞑想）がcronで完全自動運用中。YouTube関連のタスクは「分析確認」「戦略見直し」程度。投稿作業のタスクは出さない。
- Facebook投稿タスクはアプリ事業（BtoB SaaS・アプリ販売）のみ生成すること。整体院・訪問鍼灸・治療機器販売・治療家コミュニティのFacebook投稿タスクは生成しない。

出力フォーマット（厳守）:
===ANALYSIS===
KPI進捗の分析（各KPIの状態を簡潔に）
===TASKS===
[
  {
    "business_unit": "大口神経整体院|晴陽鍼灸院|治療機器販売|アプリ事業|治療家コミュニティ",
    "department": "部署名",
    "employee_name": "担当者名",
    "title": "タスク名（25文字以内）",
    "description": "具体的アクション",
    "task_type": "auto|confirm",
    "priority": "high/normal",
    "due_date": "YYYY-MM-DD"
  }
]
===PRIORITIES===
今日の最優先3つ（番号付きリスト）
===MESSAGE===
レイアとしての朝礼メッセージ（3〜5行、プレーンテキスト、マークダウン記号不使用）`

    const userMessage = `【本日】${today}

【KPI・目標】
${goalsText}

【会社方針・コンテキスト】
${contextText}

【現在の未完了タスク（${pendingTasks?.length || 0}件）】
${tasksText || 'なし'}

【昨日の活動】
${activityText || 'なし'}

【昨晩のPDCA分析】
${eveningInsight}

【会長の振り分け指示（昨晩の返信）】
${assignmentText}

上記を踏まえて、朝のPDCAサイクルを実行してください。タスクは必ず5事業のいずれかに分類し、auto（AI社員が自動実行）かconfirm（大口さんが確認）に振り分けてください。`

    const result = await callClaude(client, systemPrompt, userMessage)

    // セクション分割してパース
    const analysisMatch = result.match(/===ANALYSIS===([\s\S]*?)===TASKS===/)
    const tasksMatch = result.match(/===TASKS===([\s\S]*?)===PRIORITIES===/)
    const prioritiesMatch = result.match(/===PRIORITIES===([\s\S]*?)===MESSAGE===/)
    const messageMatch = result.match(/===MESSAGE===([\s\S]*)$/)

    const analysis = analysisMatch?.[1]?.trim() || ''
    const tasksJSON = extractJSON(tasksMatch?.[1] || '') as Array<Record<string, string>> | null
    const priorities = prioritiesMatch?.[1]?.trim() || ''
    const morningMessage = messageMatch?.[1]?.trim() || ''

    // 是正タスクをvo_tasksに挿入
    const insertedTasks: Array<Record<string, unknown>> = []
    if (tasksJSON && Array.isArray(tasksJSON) && tasksJSON.length > 0) {
      const batchId = `pdca_morning_${today}`
      const tasksToInsert = tasksJSON.map(t => ({
        department: t.department,
        employee_name: t.employee_name || null,
        title: t.title,
        description: t.description,
        priority: t.priority || 'normal',
        status: 'pending',
        due_date: t.due_date || today,
        batch_id: batchId,
        generated_by: 'pdca_morning',
      }))

      const { data } = await supabase
        .from('vo_tasks')
        .insert(tasksToInsert)
        .select()

      if (data) insertedTasks.push(...data)
    }

    // 朝礼メッセージを活動ログに記録
    if (morningMessage) {
      await logActivity('レイア', '経営層', '全社朝礼',
        `${morningMessage}\n\n【本日の最優先事項】\n${priorities}`)
    }

    // 振り分け結果を反映済みに更新
    if (assignments && assignments.length > 0) {
      const ids = assignments.map(a => a.id)
      await supabase
        .from('vo_task_assignments')
        .update({ reflected_in_morning: true })
        .in('id', ids)
    }

    // KPIスナップショット保存
    await supabase.from('vo_kpi_snapshots').upsert({
      snapshot_date: today,
      goals_snapshot: goals || [],
      tasks_summary: {
        pending: pendingTasks?.filter(t => t.status === 'pending').length || 0,
        in_progress: pendingTasks?.filter(t => t.status === 'in_progress').length || 0,
        new_corrective: insertedTasks.length,
      },
      activity_count: recentActivity?.length || 0,
    }, { onConflict: 'snapshot_date' })

    // PDCAレポート保存
    await savePDCAReport('morning', {
      kpi_status: analysis,
      corrective_tasks: insertedTasks.map(t => ({
        task_id: (t as Record<string, unknown>).id,
        department: (t as Record<string, unknown>).department,
        title: (t as Record<string, unknown>).title,
      })),
      priority_tasks: priorities,
      morning_message: morningMessage,
    })

    // LINE朝礼メッセージ送信（5事業別×2分類形式）
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][new Date(new Date().getTime() + 9 * 60 * 60 * 1000).getDay()]

    // タスクを5事業別に振り分け
    const allTodayTasks = [...(pendingTasks || []), ...insertedTasks]
    const tasksByUnit: Record<string, { auto: Array<Record<string, unknown>>; confirm: Array<Record<string, unknown>> }> = {}
    for (const unit of BUSINESS_UNITS) {
      tasksByUnit[unit.name] = { auto: [], confirm: [] }
    }

    // 新規生成タスク（business_unit付き）
    if (tasksJSON && Array.isArray(tasksJSON)) {
      for (const t of tasksJSON) {
        const unitName = t.business_unit || classifyTaskByUnit(t.department || '', t.title || '')
        if (!tasksByUnit[unitName]) tasksByUnit[unitName] = { auto: [], confirm: [] }
        const type = t.task_type === 'confirm' ? 'confirm' : 'auto'
        tasksByUnit[unitName][type].push(t)
      }
    }

    // 既存タスク（部署名から推定）
    for (const t of (pendingTasks || [])) {
      const unitName = classifyTaskByUnit(t.department || '', t.title || '')
      if (!tasksByUnit[unitName]) tasksByUnit[unitName] = { auto: [], confirm: [] }
      tasksByUnit[unitName].auto.push(t)
    }

    let lineMessage = `AI Solutions 朝礼\n${today}(${dayOfWeek})\n━━━━━━━━━━━━━\n`

    if (morningMessage) {
      lineMessage += `\n${morningMessage}\n`
    }

    if (priorities) {
      lineMessage += `\n${priorities}\n`
    }

    // 定期タスクセクション（該当日のみ表示）
    if (todayRecurring.length > 0) {
      lineMessage += `\n━━━━━━━━━━━━━\n`
      lineMessage += `📅 本日の定期タスク（${todayRecurring.length}件）\n\n`
      for (const rt of todayRecurring) {
        lineMessage += `✅ 【${rt.business_unit}】${rt.title}\n`
      }
    }

    // 定期タスクをtasksByUnitにも追加（confirmとして）
    for (const rt of todayRecurring) {
      const unitName = rt.business_unit || 'その他'
      if (!tasksByUnit[unitName]) tasksByUnit[unitName] = { auto: [], confirm: [] }
      tasksByUnit[unitName].confirm.push({ title: rt.title, department: rt.business_unit })
    }

    // 5事業別タスク表示
    for (const unit of BUSINESS_UNITS) {
      const tasks = tasksByUnit[unit.name]
      if (!tasks) continue
      const autoCount = tasks.auto.length
      const confirmCount = tasks.confirm.length
      if (autoCount === 0 && confirmCount === 0) continue

      lineMessage += `\n━━━━━━━━━━━━━\n`
      lineMessage += `${unit.emoji} ${unit.name}\n`

      if (autoCount > 0) {
        lineMessage += `\n🤖 自動でやること（${autoCount}件）\n`
        for (const t of tasks.auto.slice(0, 5)) {
          const task = t as Record<string, unknown>
          lineMessage += `・${task.title}\n`
        }
        if (autoCount > 5) lineMessage += `  ...他${autoCount - 5}件\n`
      }

      if (confirmCount > 0) {
        lineMessage += `\n✅ 大口さんが確認すること（${confirmCount}件）\n`
        for (const t of tasks.confirm.slice(0, 5)) {
          const task = t as Record<string, unknown>
          lineMessage += `・${task.title}\n`
        }
        if (confirmCount > 5) lineMessage += `  ...他${confirmCount - 5}件\n`
      }
    }

    lineMessage += `\n━━━━━━━━━━━━━\n`
    lineMessage += `新規生成: ${insertedTasks.length}件`

    const lineSent = await sendLINEBroadcast(lineMessage, 'morning')

    return NextResponse.json({
      success: true,
      cycle: 'morning',
      date: today,
      analysis,
      tasksGenerated: insertedTasks.length,
      priorities,
      morningMessage: morningMessage.substring(0, 200),
      lineSent,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    // エラーでも活動ログに記録
    await logActivity('システム', '全社', 'PDCA朝サイクルエラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

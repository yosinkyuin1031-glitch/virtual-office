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

export const runtime = 'nodejs'
export const maxDuration = 120

// 毎週月曜7:00 JST（UTC 日曜22:00）に自動実行
// レイア（CEO）が1週間を振り返り、来週の計画を策定する
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    if (await isDuplicateExecution('weekly')) {
      return NextResponse.json({ message: '今週の週次サイクルは実行済みです' })
    }

    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 1. 過去7日間のKPIスナップショット
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: kpiSnapshots } = await supabase
      .from('vo_kpi_snapshots')
      .select('*')
      .gte('snapshot_date', weekAgo)
      .order('snapshot_date', { ascending: true })

    // 2. 過去7日間のPDCAレポート
    const { data: weekReports } = await supabase
      .from('vo_pdca_reports')
      .select('*')
      .in('cycle_type', ['morning', 'evening'])
      .gte('executed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('executed_at', { ascending: true })

    // 3. 週間タスク統計
    const { data: weekTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // 4. 現在のKPI
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    // 5. コンテキスト
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    // 6. 週間の活動ログ集計
    const { data: weekActivity } = await supabase
      .from('activity_log')
      .select('department, action')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // データ整形
    const snapshotsText = (kpiSnapshots || []).map(s =>
      `${s.snapshot_date}: タスク${JSON.stringify(s.tasks_summary || {})}, 活動${s.activity_count}件`
    ).join('\n')

    // 朝礼メッセージの推移
    const morningMessages = (weekReports || [])
      .filter(r => r.cycle_type === 'morning' && r.morning_message)
      .map(r => `${new Date(r.executed_at).toISOString().split('T')[0]}: ${(r.morning_message as string).substring(0, 100)}`)
      .join('\n')

    // 日報の気づき
    const eveningInsights = (weekReports || [])
      .filter(r => r.cycle_type === 'evening' && r.department_reports)
      .map(r => `${new Date(r.executed_at).toISOString().split('T')[0]}: ${String(r.department_reports).substring(0, 150)}`)
      .join('\n')

    // タスク統計
    const taskStats = {
      created: weekTasks?.length || 0,
      completed: weekTasks?.filter(t => t.status === 'completed').length || 0,
      pending: weekTasks?.filter(t => t.status === 'pending').length || 0,
      in_progress: weekTasks?.filter(t => t.status === 'in_progress').length || 0,
    }

    // 部署別活動集計
    const deptCounts: Record<string, number> = {}
    for (const act of (weekActivity || [])) {
      const dept = act.department || '不明'
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    }
    const deptSummary = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, count]) => `${dept}: ${count}件`)
      .join(', ')

    const goalsText = (goals || []).map(g => `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`).join('\n')
    const contextText = (contexts || []).map(c => `[${c.category}] ${c.title}: ${c.content}`).join('\n')

    // Claude API 1回で週次レビュー全体を生成
    const systemPrompt = `あなたはレイア。AI Solutions社のCEO。毎週月曜に1週間を振り返り、来週の戦略を立てる。

【ビジョン】挑戦を諦めない人が増え、温かく支え合える社会。
【ミッション】「できない」を「できる」に変え、光を灯す。

【4事業の柱】
1. 整体院経営（月商200-300万目標）
2. 訪問鍼灸（月商160-300万目標、スタッフ拡大）
3. 治療機器販売（BR・血管顕微鏡）
4. BtoB SaaS（MRR 125万目標、現在8.9万）

あなたの役割:
- 1週間のKPI推移を分析し、トレンドを把握
- 成果と課題を明確にする
- 来週の部署別計画を策定
- 全社員を鼓舞する週次メッセージを生成

出力フォーマット（厳守）:
===REVIEW===
今週の振り返り（成果・課題を4事業ごとに簡潔に。プレーンテキスト、マークダウン不使用）
===TREND===
KPIトレンド分析（上昇/横ばい/下降を判定）
===PLAN===
[
  {
    "department": "部署名",
    "employee_name": "担当者名",
    "title": "タスク名（25文字以内）",
    "description": "具体的アクション",
    "priority": "high/normal",
    "due_date": "YYYY-MM-DD"
  }
]
===MESSAGE===
レイアとしての週次メッセージ（5〜7行、全社員への鼓舞。プレーンテキスト、マークダウン不使用）`

    const nextMonday = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const nextWeekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(nextMonday.getTime() + i * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000)
      return d.toISOString().split('T')[0]
    })

    const userMessage = `【本日】${today}（月曜日）
【来週の営業日】${nextWeekDates.join(', ')}

【現在のKPI】
${goalsText}

【会社方針】
${contextText}

【今週のKPIスナップショット推移】
${snapshotsText || 'データなし（初週）'}

【今週の朝礼サマリー】
${morningMessages || 'なし'}

【今週の日報サマリー】
${eveningInsights || 'なし'}

【今週のタスク統計】
作成: ${taskStats.created}件、完了: ${taskStats.completed}件、進行中: ${taskStats.in_progress}件、未着手: ${taskStats.pending}件

【部署別活動量】
${deptSummary || 'データなし'}

上記を踏まえて、週次レビューと来週の計画を策定してください。来週のタスクは各部署に1〜2個ずつ、合計10〜15個を配布してください。`

    const result = await callClaude(client, systemPrompt, userMessage)

    // パース
    const reviewMatch = result.match(/===REVIEW===([\s\S]*?)===TREND===/)
    const trendMatch = result.match(/===TREND===([\s\S]*?)===PLAN===/)
    const planMatch = result.match(/===PLAN===([\s\S]*?)===MESSAGE===/)
    const messageMatch = result.match(/===MESSAGE===([\s\S]*)$/)

    const review = reviewMatch?.[1]?.trim() || ''
    const trend = trendMatch?.[1]?.trim() || ''
    const weeklyTasks = extractJSON(planMatch?.[1] || '') as Array<Record<string, string>> | null
    const weeklyMessage = messageMatch?.[1]?.trim() || ''

    // 来週のタスクをvo_tasksに挿入
    const insertedTasks: Array<Record<string, unknown>> = []
    if (weeklyTasks && Array.isArray(weeklyTasks) && weeklyTasks.length > 0) {
      const batchId = `pdca_weekly_${today}`
      const tasksToInsert = weeklyTasks.map(t => ({
        department: t.department,
        employee_name: t.employee_name || null,
        title: t.title,
        description: t.description,
        priority: t.priority || 'normal',
        status: 'pending',
        due_date: t.due_date || nextWeekDates[4], // 来週金曜がデフォルト期限
        batch_id: batchId,
        generated_by: 'pdca_weekly',
      }))

      const { data } = await supabase
        .from('vo_tasks')
        .insert(tasksToInsert)
        .select()

      if (data) insertedTasks.push(...data)
    }

    // 週次メッセージを活動ログに記録
    if (weeklyMessage) {
      await logActivity('レイア', '経営層', '週次レビュー',
        `${weeklyMessage}\n\n【今週の振り返り】\n${review}\n\n【KPIトレンド】\n${trend}`)
    }

    // PDCAレポート保存
    await savePDCAReport('weekly', {
      weekly_kpi_trend: kpiSnapshots || [],
      weekly_plan: weeklyTasks,
      weekly_tasks: insertedTasks.map(t => ({
        task_id: (t as Record<string, unknown>).id,
        department: (t as Record<string, unknown>).department,
        title: (t as Record<string, unknown>).title,
      })),
      weekly_review_message: weeklyMessage,
    })

    return NextResponse.json({
      success: true,
      cycle: 'weekly',
      date: today,
      review: review.substring(0, 300),
      trend,
      tasksDistributed: insertedTasks.length,
      message: weeklyMessage.substring(0, 200),
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    await logActivity('システム', '全社', 'PDCA週次サイクルエラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

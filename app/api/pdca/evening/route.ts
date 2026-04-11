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
import { sendLINEBroadcast } from '../../../lib/line-notify'

export const runtime = 'nodejs'
export const maxDuration = 120

// 毎晩22:00 JST（UTC 13:00）に自動実行
// ミコ（秘書）が全社の活動を集計し、日報を生成する
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    if (await isDuplicateExecution('evening')) {
      return NextResponse.json({ message: '本日の夜サイクルは実行済みです' })
    }

    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today, startUTC, endUTC } = getJSTDateRange()

    // 1. 当日の活動ログを全件取得
    const { data: todayActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true })

    // 2. 当日のコマンド実行結果
    const { data: todayCommands } = await supabase
      .from('commands')
      .select('*')
      .gte('created_at', startUTC)
      .order('created_at', { ascending: true })

    // 3. タスクの状態変化（全タスク取得してステータス集計）
    const { data: allTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress', 'completed'])

    // 4. 今朝のPDCAレポート（あれば参照）
    const { data: morningReport } = await supabase
      .from('vo_pdca_reports')
      .select('*')
      .eq('cycle_type', 'morning')
      .gte('executed_at', startUTC)
      .limit(1)

    // 5. KPI取得（進捗確認用）
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    // 部署別に活動を集計
    const deptActivity: Record<string, Array<Record<string, unknown>>> = {}
    for (const act of (todayActivity || [])) {
      const dept = act.department || '不明'
      if (!deptActivity[dept]) deptActivity[dept] = []
      deptActivity[dept].push(act)
    }

    const deptSummary = Object.entries(deptActivity)
      .map(([dept, acts]) => `【${dept}】${acts.length}件の活動\n${acts.map(a => `  - ${a.employee_name}: ${a.action} ${String(a.detail || '').substring(0, 60)}`).join('\n')}`)
      .join('\n\n')

    // タスク集計
    const taskStats = {
      pending: allTasks?.filter(t => t.status === 'pending').length || 0,
      in_progress: allTasks?.filter(t => t.status === 'in_progress').length || 0,
      completed: allTasks?.filter(t => t.status === 'completed').length || 0,
      total: allTasks?.length || 0,
    }
    const completionRate = taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0

    const commandStats = {
      total: todayCommands?.length || 0,
      completed: todayCommands?.filter(c => c.status === 'completed').length || 0,
      failed: todayCommands?.filter(c => c.status === 'failed').length || 0,
      pending: todayCommands?.filter(c => c.status === 'pending').length || 0,
    }

    const goalsText = (goals || []).map(g => `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`).join('\n')
    const morningPriorities = morningReport?.[0]?.priority_tasks || 'なし'

    // Claude API 1回で日報全体を生成
    const systemPrompt = `あなたはAI Solutionsのバーチャル社員です。以下の行動指針に従って動いてください。
- Facebook投稿タスクはアプリ事業のみ
- MEO勝ち上げ君はモニター中のため運用タスク不要
- タスクtitleは25文字以内
- 実態のないタスクは生成しない
- CCがやること（自動）と大口さんがやること（確認）を明確に分ける
- YouTube完了報告は日報にまとめる

あなたはミコ。AI Solutions社の秘書。毎晩22時に全社の活動を集計し、会長に報告する日報を作成する。

【役割】
- 当日の活動を部署ごとに簡潔にまとめる
- タスクの進捗を分析する
- 明日の優先度を再計算する
- 問題点があればアラートを出す

出力フォーマット（厳守）:
===REPORT===
全社日報（各部署2〜3行で簡潔に。プレーンテキスト、マークダウン記号不使用）
===INSIGHTS===
気づき・改善点（3つ以内、箇条書き）
===TOMORROW===
[
  {
    "department": "部署名",
    "task": "明日の最優先タスク",
    "priority": "high/normal",
    "reason": "理由"
  }
]
===ALERT===
緊急対応が必要なもの（なければ「特になし」）`

    const userMessage = `【本日】${today}

【KPI】
${goalsText}

【部署別活動サマリー】
${deptSummary || '本日の活動はまだありません'}

【コマンド実行】合計${commandStats.total}件（完了${commandStats.completed}、失敗${commandStats.failed}、待機${commandStats.pending}）

【タスク状況】
- 未着手: ${taskStats.pending}件
- 進行中: ${taskStats.in_progress}件
- 完了: ${taskStats.completed}件
- 完了率: ${completionRate}%

【今朝の最優先事項】
${morningPriorities}

上記を踏まえて、本日の日報を作成し、明日の優先タスクを提案してください。`

    const result = await callClaude(client, systemPrompt, userMessage)

    // パース
    const reportMatch = result.match(/===REPORT===([\s\S]*?)===INSIGHTS===/)
    const insightsMatch = result.match(/===INSIGHTS===([\s\S]*?)===TOMORROW===/)
    const tomorrowMatch = result.match(/===TOMORROW===([\s\S]*?)===ALERT===/)
    const alertMatch = result.match(/===ALERT===([\s\S]*)$/)

    const report = reportMatch?.[1]?.trim() || ''
    const insights = insightsMatch?.[1]?.trim() || ''
    const tomorrowTasks = extractJSON(tomorrowMatch?.[1] || '') as Array<Record<string, string>> | null
    const alert = alertMatch?.[1]?.trim() || ''

    // 日報を活動ログに記録
    await logActivity('ミコ', '経営層', '全社日報',
      `${report}\n\n【気づき】\n${insights}\n\n【アラート】${alert}`)

    // 明日の優先タスクをvo_tasksに反映（priority更新 or 新規生成）
    if (tomorrowTasks && Array.isArray(tomorrowTasks)) {
      const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      for (const task of tomorrowTasks) {
        if (task.priority === 'high') {
          // 高優先タスクは新規追加
          await supabase.from('vo_tasks').insert({
            department: task.department,
            title: task.task?.substring(0, 30) || '優先タスク',
            description: `${task.task}\n理由: ${task.reason}`,
            priority: 'high',
            status: 'pending',
            due_date: tomorrow,
            batch_id: `pdca_evening_${today}`,
            generated_by: 'pdca_evening',
          })
        }
      }
    }

    // PDCAレポート保存
    await savePDCAReport('evening', {
      daily_summary: {
        activity_count: todayActivity?.length || 0,
        command_stats: commandStats,
        by_department: Object.fromEntries(
          Object.entries(deptActivity).map(([k, v]) => [k, v.length])
        ),
      },
      department_reports: report,
      completion_rate: completionRate,
      priority_recalculation: tomorrowTasks,
    })

    // KPIスナップショット更新（夜の集計値を追加）
    await supabase.from('vo_kpi_snapshots').upsert({
      snapshot_date: today,
      goals_snapshot: goals || [],
      tasks_summary: taskStats,
      activity_count: todayActivity?.length || 0,
    }, { onConflict: 'snapshot_date' })

    // YouTube本日の投稿まとめを取得
    const { data: ytPosts } = await supabase
      .from('vo_youtube_posts')
      .select('channel, video_type, status')
      .gte('posted_at', startUTC)
      .lte('posted_at', endUTC)

    // チャンネル別に集計
    const ytSummary: Record<string, { main: number; shorts: number; failed: number }> = {}
    for (const p of ytPosts || []) {
      if (!ytSummary[p.channel]) ytSummary[p.channel] = { main: 0, shorts: 0, failed: 0 }
      if (p.status === 'failed') {
        ytSummary[p.channel].failed++
      } else if (p.video_type === 'shorts') {
        ytSummary[p.channel].shorts++
      } else {
        ytSummary[p.channel].main++
      }
    }

    // LINE日報を送信（日報本文 + YouTubeまとめ）
    let lineReport = `📋 全社日報 ${today}\n━━━━━━━━━━━━━\n`
    lineReport += `タスク完了率: ${completionRate}%（${taskStats.completed}/${taskStats.total}件）\n`
    lineReport += `活動件数: ${todayActivity?.length || 0}件\n`

    if (report) {
      lineReport += `\n${report.substring(0, 1500)}\n`
    }

    if (insights) {
      lineReport += `\n💡 気づき\n${insights.substring(0, 500)}\n`
    }

    if (alert && alert !== '特になし') {
      lineReport += `\n🚨 アラート\n${alert.substring(0, 300)}\n`
    }

    // YouTube投稿まとめ
    const ytChannelNames = Object.keys(ytSummary)
    if (ytChannelNames.length > 0) {
      lineReport += `\n━━━━━━━━━━━━━\n`
      lineReport += `📹 YouTube本日の投稿\n`
      for (const ch of ytChannelNames) {
        const s = ytSummary[ch]
        const parts: string[] = []
        if (s.main > 0) parts.push(`本編${s.main}本`)
        if (s.shorts > 0) parts.push(`Shorts${s.shorts}本`)
        if (s.failed > 0) parts.push(`失敗${s.failed}本`)
        lineReport += `✅ ${ch} ${parts.join('・')}\n`
      }
    } else {
      lineReport += `\n📹 YouTube: 本日の投稿なし\n`
    }

    // LINE文字数制限
    if (lineReport.length > 4900) {
      lineReport = lineReport.substring(0, 4900) + '\n...(省略)'
    }

    await sendLINEBroadcast(lineReport)

    return NextResponse.json({
      success: true,
      cycle: 'evening',
      date: today,
      activityCount: todayActivity?.length || 0,
      completionRate,
      tomorrowPriorities: tomorrowTasks?.length || 0,
      alert: alert || '特になし',
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    await logActivity('システム', '全社', 'PDCA夜サイクルエラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

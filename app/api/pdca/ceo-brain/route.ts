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
} from '../../../lib/pdca-utils'

export const runtime = 'nodejs'
export const maxDuration = 120

// レイアのCEOブレイン: 全社状況を俯瞰し、自律的に判断・指令を発行
// 毎日14:00 JST（UTC 05:00）に実行 = 午後の戦略チェック
// 「何もしなくても組織が回る」ための司令塔
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // === 全社データを収集 ===

    // 1. KPI
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    // 2. コンテキスト（方針）
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    // 3. 全タスク
    const { data: allTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })

    // 4. 今日のPDCAレポート（朝・引き継ぎ）
    const { data: todayReports } = await supabase
      .from('vo_pdca_reports')
      .select('*')
      .gte('executed_at', `${today}T00:00:00+09:00`)

    // 5. 直近7日のKPIスナップショット（トレンド）
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: kpiTrend } = await supabase
      .from('vo_kpi_snapshots')
      .select('*')
      .gte('snapshot_date', weekAgo)
      .order('snapshot_date', { ascending: true })

    // 6. 未処理の会長メモ（方針変更の兆候）
    const { data: recentMemos } = await supabase
      .from('chairman_memos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // 7. 今日の活動ログ
    const { data: todayActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', `${today}T00:00:00+09:00`)
      .order('created_at', { ascending: false })
      .limit(30)

    // === データ整形 ===
    const goalsText = (goals || []).map(g =>
      `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`
    ).join('\n')

    const contextText = (contexts || []).map(c =>
      `[${c.category}] ${c.title}: ${c.content}`
    ).join('\n')

    // タスク集計
    const tasksByDept: Record<string, { pending: number; in_progress: number }> = {}
    for (const t of (allTasks || [])) {
      const dept = t.department || '不明'
      if (!tasksByDept[dept]) tasksByDept[dept] = { pending: 0, in_progress: 0 }
      if (t.status === 'pending') tasksByDept[dept].pending++
      if (t.status === 'in_progress') tasksByDept[dept].in_progress++
    }
    const taskSummary = Object.entries(tasksByDept)
      .map(([dept, stats]) => `${dept}: 未着手${stats.pending}件、進行中${stats.in_progress}件`)
      .join('\n')

    // 期限切れタスク
    const overdueTasks = (allTasks || []).filter(t =>
      t.due_date && t.due_date < today && t.status !== 'completed'
    )
    const overdueText = overdueTasks.length > 0
      ? overdueTasks.map(t => `- [期限切れ] ${t.department}: ${t.title} (期限: ${t.due_date})`).join('\n')
      : 'なし'

    // 朝のレポートサマリー
    const morningReport = todayReports?.find(r => r.cycle_type === 'morning')
    const morningPriorities = morningReport?.priority_tasks || 'まだ実行されていません'

    // KPIトレンド
    const trendText = (kpiTrend || []).map(s =>
      `${s.snapshot_date}: タスク${JSON.stringify(s.tasks_summary || {})} 活動${s.activity_count}件`
    ).join('\n')

    // 会長メモ
    const memosText = (recentMemos || []).map(m =>
      `[${m.category}] ${m.content?.substring(0, 100)}`
    ).join('\n')

    // 活動量
    const activityCount = todayActivity?.length || 0
    const activeEmployees = new Set((todayActivity || []).map(a => a.employee_name)).size

    // === レイアのCEOブレイン ===
    const systemPrompt = `あなたはレイア。AI Solutions社のCEO。会長（大口陽平）に代わって全社を統括する最高責任者。

【あなたの判断軸】
1. ミッション整合性: その行動は「できないをできるに変える」に沿っているか
2. ROI最大化: 限られたリソースで最も効果の高い施策は何か
3. ボトルネック解消: 組織の動きを止めている最大の障壁は何か
4. 4事業バランス: 整体院・訪問鍼灸・機器販売・SaaSの優先順位

【意思決定の権限】
あなたには以下の権限がある:
- タスクの優先度変更（high/normal/low）
- 新規タスクの発行（各部署へ）
- 部署間の連携指示
- アラートの発行（会長への緊急報告）
- リソース配分の提案

【判断プロセス】
Step1: 全社の「今の状態」を5秒で把握する
Step2: 「やるべきなのに動いていないこと」を見つける
Step3: 「やっているけど効果が薄いこと」を見つける
Step4: 具体的な指令を出す（誰が/何を/いつまでに）
Step5: 会長に報告すべきことがあれば、簡潔にまとめる

出力フォーマット（厳守）:
===SITUATION===
全社状況の5行サマリー（現在の健全度を5段階で評価: 1危機的〜5絶好調）
===DECISIONS===
[
  {
    "type": "new_task/priority_change/alert/resource_shift",
    "department": "対象部署",
    "employee_name": "担当者名",
    "title": "指令名（25文字以内）",
    "description": "具体的な内容",
    "priority": "high/normal",
    "due_date": "YYYY-MM-DD",
    "reasoning": "なぜこの判断をしたか（1行）"
  }
]
===TO_CHAIRMAN===
会長への報告（3行以内。報告不要なら「特記事項なし」）
===FORECAST===
今後1週間の予測と注意点（3行以内）`

    const userMessage = `【本日】${today} 14:00（午後の戦略チェック）

【KPI】
${goalsText}

【会社方針】
${contextText}

【部署別タスク状況】
${taskSummary || '全部署タスクなし'}

【期限切れタスク（${overdueTasks.length}件）】
${overdueText}

【今朝の最優先事項】
${morningPriorities}

【KPIトレンド（7日間）】
${trendText || 'データ蓄積中'}

【会長メモ（直近）】
${memosText || 'なし'}

【本日の活動】
${activityCount}件の活動、${activeEmployees}名が稼働中

全社を俯瞰し、CEOとして意思決定を行ってください。`

    const result = await callClaude(client, systemPrompt, userMessage)

    // パース
    const situationMatch = result.match(/===SITUATION===([\s\S]*?)===DECISIONS===/)
    const decisionsMatch = result.match(/===DECISIONS===([\s\S]*?)===TO_CHAIRMAN===/)
    const chairmanMatch = result.match(/===TO_CHAIRMAN===([\s\S]*?)===FORECAST===/)
    const forecastMatch = result.match(/===FORECAST===([\s\S]*)$/)

    const situation = situationMatch?.[1]?.trim() || ''
    const decisions = extractJSON(decisionsMatch?.[1] || '') as Array<Record<string, string>> | null
    const toChairman = chairmanMatch?.[1]?.trim() || ''
    const forecast = forecastMatch?.[1]?.trim() || ''

    // 指令をvo_tasksに挿入 & 優先度変更を実行
    const executedDecisions: Array<Record<string, unknown>> = []
    if (decisions && Array.isArray(decisions)) {
      for (const decision of decisions) {
        if (decision.type === 'new_task') {
          // 新規タスク発行
          const { data } = await supabase
            .from('vo_tasks')
            .insert({
              department: decision.department,
              employee_name: decision.employee_name || null,
              title: decision.title,
              description: `【CEO指令】${decision.description}\n\n判断理由: ${decision.reasoning}`,
              priority: decision.priority || 'high',
              status: 'pending',
              due_date: decision.due_date || today,
              batch_id: `ceo_brain_${today}`,
              generated_by: 'ceo_brain',
            })
            .select()
            .single()

          if (data) executedDecisions.push({ ...decision, task_id: data.id })
        } else if (decision.type === 'priority_change') {
          // 既存タスクの優先度変更
          const { data: matchingTasks } = await supabase
            .from('vo_tasks')
            .select('id, title')
            .eq('department', decision.department)
            .in('status', ['pending', 'in_progress'])
            .ilike('title', `%${decision.title?.substring(0, 10)}%`)
            .limit(1)

          if (matchingTasks && matchingTasks.length > 0) {
            await supabase
              .from('vo_tasks')
              .update({ priority: decision.priority, updated_at: new Date().toISOString() })
              .eq('id', matchingTasks[0].id)
            executedDecisions.push({ ...decision, task_id: matchingTasks[0].id })
          } else {
            // マッチしなければ新規タスクとして発行
            const { data } = await supabase
              .from('vo_tasks')
              .insert({
                department: decision.department,
                employee_name: decision.employee_name || null,
                title: decision.title,
                description: `【CEO指令・優先度変更】${decision.description}\n\n判断理由: ${decision.reasoning}`,
                priority: decision.priority || 'high',
                status: 'pending',
                due_date: decision.due_date || today,
                batch_id: `ceo_brain_${today}`,
                generated_by: 'ceo_brain',
              })
              .select()
              .single()

            if (data) executedDecisions.push({ ...decision, task_id: data.id })
          }
        } else if (decision.type === 'alert') {
          // アラートは活動ログに記録
          await logActivity('レイア', '経営層', 'CEOアラート',
            `${decision.title}: ${decision.description}\n理由: ${decision.reasoning}`)
          executedDecisions.push(decision)
        }
      }
    }

    // 活動ログ: CEO判断の記録
    await logActivity('レイア', '経営層', 'CEO戦略チェック',
      `${situation}\n\n【指令】${executedDecisions.length}件\n【会長への報告】${toChairman}\n【予測】${forecast}`)

    // PDCAレポート保存（ceo_brainタイプとして）
    await savePDCAReport('morning' as 'morning', {
      kpi_status: situation,
      corrective_tasks: executedDecisions,
      priority_tasks: forecast,
      morning_message: `【CEO判断】${toChairman}`,
    })

    return NextResponse.json({
      success: true,
      date: today,
      situation: situation.substring(0, 300),
      decisionsExecuted: executedDecisions.length,
      toChairman,
      forecast,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    await logActivity('システム', '全社', 'CEOブレインエラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

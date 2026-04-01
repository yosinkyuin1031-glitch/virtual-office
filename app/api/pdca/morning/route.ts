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

    const goalsText = (goals || []).map(g => `- ${g.label}: 目標${g.value} / 現在${g.current || '未測定'}`).join('\n')
    const contextText = (contexts || []).map(c => `[${c.category}] ${c.title}: ${c.content}`).join('\n')
    const tasksText = (pendingTasks || []).map(t => `- [${t.priority}] ${t.department}: ${t.title} (期限: ${t.due_date || '未設定'})`).join('\n')
    const activityText = (recentActivity || []).slice(0, 15).map(a => `- ${a.employee_name}(${a.department}): ${a.action} - ${a.detail?.substring(0, 80)}`).join('\n')
    const eveningInsight = lastEvening?.[0]?.daily_summary ? JSON.stringify(lastEvening[0].daily_summary) : 'なし'

    // Claude API 1回で全て生成
    const systemPrompt = `あなたはレイア。AI Solutions社のCEO。会長（大口陽平）の右腕として、毎朝全社の状況を確認し、的確な判断を下す。

【ビジョン】挑戦を諦めない人が増え、温かく支え合える社会。
【ミッション】「できない」を「できる」に変え、光を灯す。

【4事業】
1. 整体院経営（安定収益・ノウハウの源泉）
2. 訪問鍼灸リハビリ（スタッフ拡大でスケール）
3. 治療機器販売（BR・血管顕微鏡のBtoB）
4. アプリ開発BtoB SaaS（ストック型収益）

あなたの役割:
- KPIの進捗を冷静に分析し、遅れている項目を特定
- 遅れているKPIに対して、具体的な是正タスクを生成
- 今日1日の最優先事項を決定
- 全社員を鼓舞する朝礼メッセージを生成

出力フォーマット（厳守）:
===ANALYSIS===
KPI進捗の分析（各KPIの状態を簡潔に）
===TASKS===
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

上記を踏まえて、朝のPDCAサイクルを実行してください。`

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

    // LINE朝礼メッセージ送信
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][new Date(new Date().getTime() + 9 * 60 * 60 * 1000).getDay()]
    const allTodayTasks = [...(pendingTasks || []), ...insertedTasks]
    const highTasks = allTodayTasks.filter(t => (t as Record<string, unknown>).priority === 'high')
    const normalTasks = allTodayTasks.filter(t => (t as Record<string, unknown>).priority !== 'high')

    let lineMessage = `AI Solutions 朝礼\n${today}(${dayOfWeek})\n━━━━━━━━━━━━━\n`

    if (morningMessage) {
      lineMessage += `\n${morningMessage}\n`
    }

    if (priorities) {
      lineMessage += `\n${priorities}\n`
    }

    lineMessage += `\n━━━━━━━━━━━━━\n`
    lineMessage += `本日のタスク（${allTodayTasks.length}件）\n`

    if (highTasks.length > 0) {
      lineMessage += `\n最優先（${highTasks.length}件）\n`
      for (const t of highTasks.slice(0, 10)) {
        const task = t as Record<string, unknown>
        lineMessage += `${task.department}: ${task.title}\n`
      }
    }

    if (normalTasks.length > 0) {
      lineMessage += `\n通常（${normalTasks.length}件）\n`
      for (const t of normalTasks.slice(0, 10)) {
        const task = t as Record<string, unknown>
        lineMessage += `${task.department}: ${task.title}\n`
      }
      if (normalTasks.length > 10) {
        lineMessage += `...他${normalTasks.length - 10}件\n`
      }
    }

    lineMessage += `\n新規生成: ${insertedTasks.length}件\n━━━━━━━━━━━━━`

    const lineSent = await sendLINEBroadcast(lineMessage)

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

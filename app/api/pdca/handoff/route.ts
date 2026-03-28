import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getAnthropicClient,
  callClaude,
  extractJSON,
  getJSTDateRange,
  logActivity,
} from '../../../lib/pdca-utils'

export const runtime = 'nodejs'
export const maxDuration = 120

// 部署間連携の自動化
// 完了タスクを検知し、後続部署へ自動で引き継ぎタスクを生成
// 毎朝8:00 JST（UTC 23:00前日）、朝のPDCAサイクル後に実行
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 1. 直近24時間で完了したタスクを取得
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: completedTasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .eq('status', 'completed')
      .gte('updated_at', yesterday)
      .order('updated_at', { ascending: false })

    // 2. 直近24時間のactivity_logから重要イベントを抽出
    const { data: recentEvents } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
      .limit(50)

    if ((!completedTasks || completedTasks.length === 0) && (!recentEvents || recentEvents.length === 0)) {
      return NextResponse.json({ message: '引き継ぎが必要なイベントはありません' })
    }

    // 3. ソラト（COO）が部署間連携を判断
    const completedText = (completedTasks || []).map(t =>
      `- [${t.department}] ${t.title}: ${t.description?.substring(0, 100)}`
    ).join('\n')

    const eventsText = (recentEvents || []).slice(0, 20).map(e =>
      `- [${e.department}] ${e.employee_name}: ${e.action} - ${String(e.detail || '').substring(0, 80)}`
    ).join('\n')

    const systemPrompt = `あなたはソラト。AI Solutions社のCOO（最高執行責任者）。8部署24名の横断管理を担当。

あなたの専門は「部署間の連携」。ある部署の成果物やイベントが、別の部署の仕事のトリガーになるケースを見抜く。

【部署間連携パターン（これらを自動検知する）】

1. AI開発部 → LP制作部: アプリ完成/更新 → 営業スライド・LP更新
2. AI開発部 → カスタマーサクセス部: アプリ完成 → 導入マニュアル更新・モニターへの案内
3. BtoB営業部 → カスタマーサクセス部: モニター獲得・契約 → オンボーディング開始
4. 整体院事業部 → LP制作部: 新メニュー・キャンペーン → LP作成・更新
5. 整体院事業部 → メディア部: 症状の季節訴求変更 → YouTube動画企画
6. 経営層 → 全部署: 方針変更・KPI更新 → 各部署の計画修正
7. 財務部 → 経営層: 収益異常・コスト超過 → 戦略見直し
8. メディア部 → 整体院事業部: YouTube動画公開 → SNSシェア・LP導線追加
9. カスタマーサクセス部 → AI開発部: 顧客フィードバック → 機能改善要望
10. LP制作部 → BtoB営業部: LP完成 → 営業開始・資料配布

【判断基準】
- 完了タスクや活動イベントの中に、上記パターンに該当するものがあるかを判定
- 該当する場合、後続部署への具体的なタスクを生成
- 不必要な連携タスクは生成しない（本当に必要なものだけ）

出力フォーマット（厳守）:
===HANDOFFS===
[
  {
    "trigger": "トリガーとなったイベント/タスク（簡潔に）",
    "from_department": "発信元部署",
    "to_department": "引き継ぎ先部署",
    "employee_name": "担当者名",
    "title": "タスク名（25文字以内）",
    "description": "具体的なアクション内容",
    "priority": "high/normal",
    "due_date": "YYYY-MM-DD",
    "reason": "なぜこの引き継ぎが必要か"
  }
]
===SUMMARY===
連携判断のサマリー（3行以内、プレーンテキスト）

もし連携が不要な場合は空配列[]を返してください。`

    const userMessage = `【本日】${today}

【直近24時間で完了したタスク（${completedTasks?.length || 0}件）】
${completedText || 'なし'}

【直近24時間の活動イベント（${recentEvents?.length || 0}件）】
${eventsText || 'なし'}

上記を分析し、部署間で引き継ぎが必要なタスクを特定してください。`

    const result = await callClaude(client, systemPrompt, userMessage)

    // パース
    const handoffsMatch = result.match(/===HANDOFFS===([\s\S]*?)===SUMMARY===/)
    const summaryMatch = result.match(/===SUMMARY===([\s\S]*)$/)

    const handoffs = extractJSON(handoffsMatch?.[1] || '') as Array<Record<string, string>> | null
    const summary = summaryMatch?.[1]?.trim() || ''

    // 引き継ぎタスクをvo_tasksに挿入
    const insertedTasks: Array<Record<string, unknown>> = []
    if (handoffs && Array.isArray(handoffs) && handoffs.length > 0) {
      const batchId = `handoff_${today}`
      const tasksToInsert = handoffs.map(h => ({
        department: h.to_department,
        employee_name: h.employee_name || null,
        title: h.title,
        description: `【部署間連携】${h.from_department}→${h.to_department}\nトリガー: ${h.trigger}\n\n${h.description}\n\n理由: ${h.reason}`,
        priority: h.priority || 'normal',
        status: 'pending',
        due_date: h.due_date || today,
        batch_id: batchId,
        generated_by: 'pdca_handoff',
      }))

      const { data } = await supabase
        .from('vo_tasks')
        .insert(tasksToInsert)
        .select()

      if (data) insertedTasks.push(...data)
    }

    // 活動ログに記録
    if (insertedTasks.length > 0) {
      const handoffDetail = (handoffs || []).map(h =>
        `${h.from_department}→${h.to_department}: ${h.title}`
      ).join('\n')
      await logActivity('ソラト', '経営層', '部署間連携タスク生成',
        `${insertedTasks.length}件の引き継ぎタスクを自動生成\n${handoffDetail}\n\n${summary}`)
    }

    return NextResponse.json({
      success: true,
      date: today,
      handoffs: insertedTasks.length,
      summary,
      details: (handoffs || []).map(h => ({
        from: h.from_department,
        to: h.to_department,
        title: h.title,
      })),
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    await logActivity('システム', '全社', '部署間連携エラー', errMsg).catch(() => {})
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

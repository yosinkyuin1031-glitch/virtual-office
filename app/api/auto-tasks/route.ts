import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export const runtime = 'nodejs'
export const maxDuration = 120

// GET: タスク一覧取得
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')

    let query = supabase
      .from('vo_tasks')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ tasks: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: KPIからタスクを自動生成
export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 })
    }

    // 現在のKPIを取得
    const { data: goals, error: goalsError } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    if (goalsError) throw goalsError

    // コンテキストを取得
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    const goalsText = (goals || []).map(g => `- ${g.label}: ${g.value}`).join('\n')
    const contextText = (contexts || []).map(c => `[${c.category}] ${c.title}: ${c.content}`).join('\n')

    const today = new Date().toISOString().split('T')[0]

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `あなたは治療院経営×AIアプリ開発企業の経営コンサルタントです。
KPIと会社コンテキストを分析し、今月やるべき具体的なタスクを部署ごとに生成してください。

以下の部署があります：
- 経営層（戦略・方針）
- 財務部（売上・コスト管理）
- 整体院事業部（集客・リピート・単価向上）
- 訪問鍼灸事業部（スタッフ拡大・営業）
- AI開発部（アプリ開発・改善）
- BtoB営業部（アプリ販売・モニター獲得）
- マーケティング部（SNS・SEO・MEO・広告）
- LP・Web制作部（LP作成・改善）
- メディア部（YouTube・動画）
- カスタマーサクセス部（導入支援・解約防止）

必ず以下のJSON配列形式で出力してください。他のテキストは不要です：
[
  {
    "department": "部署名",
    "employee_name": "担当者名（任意）",
    "title": "タスク名（30文字以内）",
    "description": "具体的な内容・アクション",
    "priority": "high/normal/low",
    "due_date": "YYYY-MM-DD"
  }
]

ルール：
- 各KPIに対して1〜3個のタスクを生成
- 合計15〜25個程度
- priorityはhighを全体の30%程度に
- due_dateは今日(${today})から30日以内
- タスクは具体的で、すぐに行動に移せる内容にする
- 抽象的な「検討する」「考える」ではなく「○○を作成する」「○○件にアプローチする」等`,
      messages: [{
        role: 'user',
        content: `【現在のKPI・目標】
${goalsText}

【会社コンテキスト】
${contextText}

上記のKPIを達成するために、今月やるべきタスクを部署ごとに生成してください。`,
      }],
    })

    const resultText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    // JSONをパース
    const jsonMatch = resultText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIからのレスポンスをパースできませんでした', raw: resultText }, { status: 500 })
    }

    const tasks = JSON.parse(jsonMatch[0])
    const batchId = `batch_${Date.now()}`

    // 既存のpendingタスクをキャンセル（新しいバッチに置き換え）
    await supabase
      .from('vo_tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('status', 'pending')
      .eq('generated_by', 'ai')

    // 新しいタスクを一括挿入
    const tasksToInsert = tasks.map((t: Record<string, string>) => ({
      department: t.department,
      employee_name: t.employee_name || null,
      title: t.title,
      description: t.description,
      priority: t.priority || 'normal',
      status: 'pending',
      due_date: t.due_date || null,
      batch_id: batchId,
      generated_by: 'ai',
    }))

    const { data: insertedTasks, error: insertError } = await supabase
      .from('vo_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      tasks: insertedTasks,
      batch_id: batchId,
      count: insertedTasks?.length || 0,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT: タスクステータス更新
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vo_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

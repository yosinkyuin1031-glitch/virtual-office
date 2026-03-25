import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// ワークフロー一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflows: data || [] })
}

// ワークフロー開始（テンプレートから指令チェーンを生成）
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { template_id, name, steps, context = {} } = body

  if (!template_id || !steps || steps.length === 0) {
    return NextResponse.json({ error: 'テンプレートIDとステップが必要です' }, { status: 400 })
  }

  // ワークフローレコード作成
  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .insert({
      name,
      template_id,
      status: 'running',
      current_step: 1,
      total_steps: steps.length,
      context,
    })
    .select()
    .single()

  if (wfError) {
    return NextResponse.json({ error: wfError.message }, { status: 500 })
  }

  // 最初のステップの指令を作成
  const firstStep = steps[0]
  const { data: command, error: cmdError } = await supabase
    .from('commands')
    .insert({
      instruction: `【${name}】Step ${firstStep.order}: ${firstStep.action} — ${firstStep.description}`,
      status: 'pending',
      priority: 'high',
      assigned_department: firstStep.department,
      assigned_employee: firstStep.employee,
      workflow_id: workflow.id,
      workflow_step: 1,
      source: 'workflow',
    })
    .select()
    .single()

  if (cmdError) {
    return NextResponse.json({ error: cmdError.message }, { status: 500 })
  }

  return NextResponse.json({ workflow, firstCommand: command })
}

// ワークフロー更新（次のステップに進める）
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, action } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'IDとアクションが必要です' }, { status: 400 })
  }

  // 現在のワークフローを取得
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (!workflow) {
    return NextResponse.json({ error: 'ワークフローが見つかりません' }, { status: 404 })
  }

  if (action === 'next') {
    const nextStep = workflow.current_step + 1
    if (nextStep > workflow.total_steps) {
      // 完了
      await supabase
        .from('workflows')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ status: 'completed' })
    }

    // 次のステップに進む
    await supabase
      .from('workflows')
      .update({ current_step: nextStep })
      .eq('id', id)

    return NextResponse.json({ status: 'advanced', current_step: nextStep })
  }

  if (action === 'cancel') {
    await supabase
      .from('workflows')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', id)

    // 未完了の指令もキャンセル
    await supabase
      .from('commands')
      .update({ status: 'cancelled' })
      .eq('workflow_id', id)
      .in('status', ['pending', 'running'])

    return NextResponse.json({ status: 'cancelled' })
  }

  return NextResponse.json({ error: '不明なアクション' }, { status: 400 })
}

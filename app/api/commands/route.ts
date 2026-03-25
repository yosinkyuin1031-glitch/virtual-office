import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// 指令一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('commands')
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

  return NextResponse.json({ commands: data || [] })
}

// 新しい指令を作成
export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    instruction,
    priority = 'normal',
    assigned_department,
    assigned_employee,
    workflow_id,
    workflow_step,
    source = 'web',
  } = body

  if (!instruction || instruction.trim().length === 0) {
    return NextResponse.json({ error: '指示内容が空です' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('commands')
    .insert({
      instruction: instruction.trim(),
      status: 'pending',
      priority,
      assigned_department,
      assigned_employee,
      workflow_id,
      workflow_step,
      source,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ command: data })
}

// 指令ステータス更新
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, status, result, error: cmdError } = body

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (result) updates.result = result
  if (cmdError) updates.error = cmdError
  if (status === 'running') updates.started_at = new Date().toISOString()
  if (status === 'completed' || status === 'failed') updates.completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('commands')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ command: data })
}

// 指令削除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
  }

  const { error } = await supabase
    .from('commands')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

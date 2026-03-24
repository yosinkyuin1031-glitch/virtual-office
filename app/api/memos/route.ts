import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// メモ一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const department = searchParams.get('department')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('chairman_memos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (department) {
    query = query.contains('department_tags', [department])
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ memos: data })
}

// メモ新規作成
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content, category = 'general', source = 'web', department_tags = [] } = body

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'メモ内容が空です' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('chairman_memos')
    .insert({
      content: content.trim(),
      category,
      source,
      department_tags,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ memo: data })
}

// メモ削除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
  }

  const { error } = await supabase
    .from('chairman_memos')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

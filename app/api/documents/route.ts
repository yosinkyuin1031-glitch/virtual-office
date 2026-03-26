import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// 非表示ドキュメントID一覧を取得
export async function GET() {
  const { data, error } = await supabase
    .from('hidden_documents')
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ hiddenIds: (data || []).map(d => d.id) })
}

// ドキュメントを非表示にする（削除）
export async function POST(request: NextRequest) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hidden_documents')
    .upsert({ id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ドキュメントの非表示を解除（復元）
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hidden_documents')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

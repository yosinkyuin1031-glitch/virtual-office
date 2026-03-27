import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    // Group by category
    const grouped: Record<string, typeof data> = {}
    for (const item of data || []) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    return NextResponse.json({ contexts: data, grouped })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, title, content, sort_order } = body

    if (!category || !title || !content) {
      return NextResponse.json({ error: 'category, title, content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vo_context')
      .insert({ category, title, content, sort_order: sort_order || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ context: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, category, title, content, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (category !== undefined) updates.category = category
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('vo_context')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ context: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vo_context')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

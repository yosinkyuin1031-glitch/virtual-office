import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const businessId = sp.get('business_id') || undefined
    const category = sp.get('category') || undefined
    const q = sp.get('q')?.trim() || ''

    let query = supabase
      .from('office_knowledge')
      .select('*')
      .eq('active', true)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (businessId) query = query.eq('business_id', businessId)
    if (category) query = query.eq('category', category)

    const { data, error } = await query.limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let items = data || []
    if (q) {
      const lower = q.toLowerCase()
      items = items.filter(r => r.title.toLowerCase().includes(lower) || r.content.toLowerCase().includes(lower))
    }

    // カテゴリ別集計
    const counts: Record<string, number> = {}
    for (const r of items) counts[r.category] = (counts[r.category] || 0) + 1

    return NextResponse.json({ items, counts })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { business_id = 'all', category, title, content, tags = [], source = 'manual', source_ref, pinned = false } = body
    if (!category || !title || !content) return NextResponse.json({ error: 'category/title/content required' }, { status: 400 })
    const { data, error } = await supabase
      .from('office_knowledge')
      .insert({ business_id, category, title, content, tags, source, source_ref, pinned })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const id = sp.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const k of ['business_id', 'category', 'title', 'content', 'tags', 'active', 'pinned']) {
      if (k in body) update[k] = body[k]
    }
    const { error } = await supabase.from('office_knowledge').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const id = sp.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await supabase.from('office_knowledge').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

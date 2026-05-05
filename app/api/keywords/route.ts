import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'

type Category = 'symptom' | 'area' | 'strength'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const clinicId = sp.get('clinic_id') || OGUCHI_CLINIC_ID
    const { data, error } = await supabase
      .from('office_keyword_settings')
      .select('id,category,keyword,active,sort_order')
      .eq('clinic_id', clinicId)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const grouped: Record<Category, typeof data> = { symptom: [], area: [], strength: [] }
    for (const row of data || []) grouped[row.category as Category].push(row)
    return NextResponse.json({ keywords: grouped })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clinicId: string = body.clinic_id || OGUCHI_CLINIC_ID
    const category: Category = body.category
    const keyword: string = (body.keyword || '').trim()
    if (!['symptom', 'area', 'strength'].includes(category)) return NextResponse.json({ error: 'invalid category' }, { status: 400 })
    if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

    const { data: maxRow } = await supabase
      .from('office_keyword_settings')
      .select('sort_order')
      .eq('clinic_id', clinicId)
      .eq('category', category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.sort_order || 0) + 1
    const { data, error } = await supabase
      .from('office_keyword_settings')
      .insert({ clinic_id: clinicId, category, keyword, sort_order: nextOrder, active: true })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, row: data })
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
    const update: Record<string, unknown> = {}
    if (typeof body.keyword === 'string') update.keyword = body.keyword.trim()
    if (typeof body.active === 'boolean') update.active = body.active
    if (typeof body.sort_order === 'number') update.sort_order = body.sort_order
    const { error } = await supabase.from('office_keyword_settings').update(update).eq('id', id)
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
    const { error } = await supabase.from('office_keyword_settings').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

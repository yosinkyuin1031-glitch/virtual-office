import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ goals: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, label, value, category, sort_order } = body

    if (!key || !label || !value) {
      return NextResponse.json({ error: 'key, label, value are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vo_goals')
      .insert({ key, label, value, category: category || 'kpi', sort_order: sort_order || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ goal: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, label, value, key, category, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (label !== undefined) updates.label = label
    if (value !== undefined) updates.value = value
    if (key !== undefined) updates.key = key
    if (category !== undefined) updates.category = category
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('vo_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ goal: data })
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
      .from('vo_goals')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

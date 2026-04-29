import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

function addDaysISO(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

// GET: posts一覧、または初期日付（type=initial-date）
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const account = sp.get('account')
    const type = sp.get('type')
    if (!account) return NextResponse.json({ error: 'account required' }, { status: 400 })

    if (type === 'initial-date') {
      const today = new Date().toISOString().split('T')[0]
      const { data: pendingApproved } = await supabase
        .from('threads_scheduled_posts')
        .select('date')
        .eq('account', account)
        .in('status', ['pending', 'approved'])
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
      if (pendingApproved && pendingApproved.length > 0) {
        return NextResponse.json({ date: pendingApproved[0].date })
      }
      const { data: latest } = await supabase
        .from('threads_scheduled_posts')
        .select('date')
        .eq('account', account)
        .order('date', { ascending: false })
        .limit(1)
      return NextResponse.json({ date: latest && latest.length > 0 ? latest[0].date : today })
    }

    const date = sp.get('date')
    const range = sp.get('range') || 'day'
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

    let query = supabase
      .from('threads_scheduled_posts')
      .select('*')
      .eq('account', account)

    if (range === 'week') {
      const endDate = addDaysISO(date, 6)
      query = query.gte('date', date).lte('date', endDate)
    } else {
      query = query.eq('date', date)
    }
    const { data, error } = await query
      .order('date', { ascending: true })
      .order('hour', { ascending: true })
    if (error) throw error
    return NextResponse.json({ posts: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: 単一/一括の text or status 更新
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ids, text, status } = body
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof text === 'string') updates.text = text
    if (typeof status === 'string') updates.status = status

    if (Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabase
        .from('threads_scheduled_posts')
        .update(updates)
        .in('id', ids)
      if (error) throw error
      return NextResponse.json({ ok: true, updated: ids.length })
    }
    if (id) {
      const { error } = await supabase
        .from('threads_scheduled_posts')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'id or ids required' }, { status: 400 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

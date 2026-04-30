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

// GET: posts一覧、または初期日付（type=initial-date）、または全アカウントサマリー（type=summary）
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const type = sp.get('type')

    // type=summary: 全アカウントの状況サマリーを返す（accountパラメータ不要）
    if (type === 'summary') {
      const today = new Date().toISOString().split('T')[0]
      const accounts = ['seitai', 'houmon', 'btob']
      const result: Record<string, { pending: number; approved: number; postedToday: number; lastDate: string | null; daysAhead: number }> = {}

      for (const acc of accounts) {
        // 今日以降の pending/approved
        const { data: future } = await supabase
          .from('threads_scheduled_posts')
          .select('date,status')
          .eq('account', acc)
          .gte('date', today)
          .in('status', ['pending', 'approved'])
        const pending = (future || []).filter(p => p.status === 'pending').length
        const approved = (future || []).filter(p => p.status === 'approved').length
        const dates = Array.from(new Set((future || []).map(p => p.date))).sort()
        const lastDate = dates.length > 0 ? dates[dates.length - 1] : null
        const daysAhead = dates.length

        // 今日のposted件数
        const { data: posted } = await supabase
          .from('threads_scheduled_posts')
          .select('id')
          .eq('account', acc)
          .eq('date', today)
          .eq('status', 'posted')
        const postedToday = (posted || []).length

        result[acc] = { pending, approved, postedToday, lastDate, daysAhead }
      }
      return NextResponse.json({ summary: result, today })
    }

    const account = sp.get('account')
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

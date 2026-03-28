import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../lib/pdca-utils'

export const runtime = 'nodejs'

// PDCAレポート一覧取得（フロントエンド用）
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10')
    const cycleType = req.nextUrl.searchParams.get('type')

    let query = supabase
      .from('vo_pdca_reports')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (cycleType) {
      query = query.eq('cycle_type', cycleType)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ reports: data || [] })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

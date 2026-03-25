import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// 活動ログ取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const employee = searchParams.get('employee')

  let query = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (employee) {
    query = query.eq('employee_name', employee)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ activities: data || [] })
}

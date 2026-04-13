import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST: 手動タスク追加
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { department, title, description, priority, due_date } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vo_tasks')
      .insert({
        department: department || '経営層',
        title,
        description: description || '',
        priority: priority || 'normal',
        status: 'pending',
        due_date: due_date || null,
        generated_by: 'manual',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

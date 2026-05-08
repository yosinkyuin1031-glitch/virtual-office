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
    const status = sp.get('status') || 'pending'
    let query = supabase
      .from('office_pending_imports')
      .select('*')
      .order('created_at', { ascending: false })
    if (status !== 'all') query = query.eq('status', status)
    const { data, error } = await query.limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST: 新規インポート登録（手動・Plaud webhook 等から）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source = 'manual', source_ref, raw_content, ai_classification } = body
    if (!raw_content) return NextResponse.json({ error: 'raw_content required' }, { status: 400 })
    const { data, error } = await supabase
      .from('office_pending_imports')
      .insert({ source, source_ref, raw_content, ai_classification })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH: 承認/却下/編集
export async function PATCH(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const id = sp.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const action = body.action as 'approve' | 'reject' | 'archive' | 'update_classification'

    const { data: pending, error: getErr } = await supabase
      .from('office_pending_imports')
      .select('*')
      .eq('id', id)
      .single()
    if (getErr || !pending) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (action === 'reject') {
      await supabase.from('office_pending_imports').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_note: body.note || null }).eq('id', id)
      return NextResponse.json({ ok: true })
    }
    if (action === 'archive') {
      await supabase.from('office_pending_imports').update({ status: 'archived', reviewed_at: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ ok: true })
    }
    if (action === 'update_classification') {
      await supabase.from('office_pending_imports').update({ ai_classification: body.ai_classification }).eq('id', id)
      return NextResponse.json({ ok: true })
    }
    if (action === 'approve') {
      // ai_classification の type に応じて office_knowledge or office_context_items に登録
      const cls = (body.ai_classification || pending.ai_classification) as {
        type?: 'knowledge' | 'context' | 'task'
        business_id?: string
        category?: string
        title?: string
        content_proposal?: string
        effective_until?: string
        tags?: string[]
      }
      if (!cls?.type) return NextResponse.json({ error: 'classification type missing' }, { status: 400 })

      let resultId: string | null = null
      if (cls.type === 'knowledge') {
        const { data, error } = await supabase
          .from('office_knowledge')
          .insert({
            business_id: cls.business_id || 'all',
            category: cls.category || 'misc',
            title: cls.title || '無題',
            content: cls.content_proposal || pending.raw_content,
            tags: cls.tags || [],
            source: pending.source,
            source_ref: pending.source_ref,
          })
          .select('id')
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        resultId = data.id
      } else if (cls.type === 'context') {
        const { data, error } = await supabase
          .from('office_context_items')
          .insert({
            business_id: cls.business_id || 'all',
            category: cls.category || 'note',
            title: cls.title || '無題',
            content: cls.content_proposal || pending.raw_content,
            tags: cls.tags || [],
            effective_until: cls.effective_until || null,
            source: pending.source,
            source_ref: pending.source_ref,
          })
          .select('id')
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        resultId = data.id
      } else if (cls.type === 'task') {
        // vo_tasks に登録
        const { data, error } = await supabase
          .from('vo_tasks')
          .insert({
            department: cls.business_id || '経営層',
            title: cls.title || '無題タスク',
            description: cls.content_proposal || pending.raw_content,
            priority: 'normal',
            status: 'pending',
          })
          .select('id')
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        resultId = data.id
      }

      await supabase.from('office_pending_imports').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_note: body.note || null,
        result_id: resultId,
      }).eq('id', id)
      return NextResponse.json({ ok: true, resultId })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

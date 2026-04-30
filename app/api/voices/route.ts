import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

export interface PatientVoice {
  id: string
  source: 'monshin' | 'plaud' | 'review' | 'interview' | 'manual' | 'other'
  source_ref: string | null
  patient_name: string | null
  age_range: string | null
  gender: string | null
  raw_text: string
  normalized_quote: string | null
  symptom_tags: string[]
  emotion_tags: string[]
  scene_tags: string[]
  session_number: number | null
  repeat_status: 'new' | 'repeating' | 'churned' | 'completed' | 'unknown'
  business_unit: string
  captured_at: string | null
  created_at: string
  used_count: number
  last_used_at: string | null
}

// GET /api/voices?source=plaud&symptom=肩こり&search=痺れ&limit=50
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const limit = Math.min(200, Math.max(1, Number(sp.get('limit') || 100)))
    const source = sp.get('source')
    const symptom = sp.get('symptom')
    const emotion = sp.get('emotion')
    const repeat = sp.get('repeat')
    const business = sp.get('business')
    const search = sp.get('search')

    let q = supabase
      .from('vo_patient_voices')
      .select('*')
      .order('captured_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (source) q = q.eq('source', source)
    if (repeat) q = q.eq('repeat_status', repeat)
    if (business) q = q.eq('business_unit', business)
    if (symptom) q = q.contains('symptom_tags', [symptom])
    if (emotion) q = q.contains('emotion_tags', [emotion])
    if (search) q = q.or(`raw_text.ilike.%${search}%,normalized_quote.ilike.%${search}%`)

    const { data, error } = await q
    if (error) throw error

    // サマリー
    const { data: all } = await supabase.from('vo_patient_voices').select('source,symptom_tags,emotion_tags,repeat_status,business_unit')
    const summary = {
      total: all?.length ?? 0,
      bySource: {} as Record<string, number>,
      byRepeat: {} as Record<string, number>,
      byBusiness: {} as Record<string, number>,
      topSymptoms: {} as Record<string, number>,
      topEmotions: {} as Record<string, number>,
    }
    for (const v of all ?? []) {
      summary.bySource[v.source] = (summary.bySource[v.source] ?? 0) + 1
      summary.byRepeat[v.repeat_status] = (summary.byRepeat[v.repeat_status] ?? 0) + 1
      summary.byBusiness[v.business_unit] = (summary.byBusiness[v.business_unit] ?? 0) + 1
      for (const s of v.symptom_tags ?? []) summary.topSymptoms[s] = (summary.topSymptoms[s] ?? 0) + 1
      for (const e of v.emotion_tags ?? []) summary.topEmotions[e] = (summary.topEmotions[e] ?? 0) + 1
    }

    return NextResponse.json({ voices: data ?? [], summary })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/voices
// body: { raw_text, source?, normalized_quote?, symptom_tags?, emotion_tags?, scene_tags?, repeat_status?, business_unit?, patient_name?, age_range?, gender?, session_number?, captured_at? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.raw_text || typeof body.raw_text !== 'string') {
      return NextResponse.json({ error: 'raw_text required' }, { status: 400 })
    }
    const insert = {
      source: body.source ?? 'manual',
      source_ref: body.source_ref ?? null,
      patient_name: body.patient_name ?? null,
      age_range: body.age_range ?? null,
      gender: body.gender ?? null,
      raw_text: body.raw_text,
      normalized_quote: body.normalized_quote ?? null,
      symptom_tags: body.symptom_tags ?? [],
      emotion_tags: body.emotion_tags ?? [],
      scene_tags: body.scene_tags ?? [],
      session_number: body.session_number ?? null,
      repeat_status: body.repeat_status ?? 'unknown',
      business_unit: body.business_unit ?? '大口神経整体院',
      captured_at: body.captured_at ?? null,
      created_by: body.created_by ?? 'manual',
    }
    const { data, error } = await supabase.from('vo_patient_voices').insert(insert).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, voice: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/voices  body: { id, ...更新項目 }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await supabase.from('vo_patient_voices').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/voices?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await supabase.from('vo_patient_voices').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

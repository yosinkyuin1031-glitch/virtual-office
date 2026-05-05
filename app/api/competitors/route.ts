import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 120

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const DEFAULT_AREA = '大阪市住吉区'

type CategoryType = '整体' | '病院'

interface MapResult {
  position?: number
  title?: string
  rating?: number
  reviews?: number
  type?: string
  address?: string
  phone?: string
  website?: string
  gps_coordinates?: { latitude: number; longitude: number }
  place_id?: string
}

async function fetchMap(query: string): Promise<MapResult[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) throw new Error('SERPAPI_KEY missing')
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&google_domain=google.co.jp&hl=ja&type=search&api_key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  const local = json.local_results || []
  return (local as MapResult[]).slice(0, 5)
}

// =================== GET: 過去スナップショット一覧 ===================
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const clinicId = sp.get('clinic_id') || OGUCHI_CLINIC_ID
    const symptom = sp.get('symptom')
    let q = supabase
      .from('office_competitor_snapshots')
      .select('id,symptom,area,category,top_results,fetched_at')
      .eq('clinic_id', clinicId)
      .order('fetched_at', { ascending: false })
      .limit(200)
    if (symptom) q = q.eq('symptom', symptom)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // symptom × category 別の最新スナップショットだけを返す
    const latest: Record<string, typeof data[0]> = {}
    for (const r of data || []) {
      const key = `${r.symptom}__${r.category}`
      if (!latest[key]) latest[key] = r
    }
    return NextResponse.json({ snapshots: Object.values(latest), all: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// =================== POST: 競合TOP5を取得して保存 ===================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const clinicId: string = body.clinic_id || OGUCHI_CLINIC_ID
    const area: string = (body.area || DEFAULT_AREA).trim()
    const onlyCategory: CategoryType | undefined = body.category
    const onlySymptom: string | undefined = body.symptom

    if (!process.env.SERPAPI_KEY) {
      return NextResponse.json({ error: 'SERPAPI_KEY が設定されていません' }, { status: 500 })
    }

    // 症状リストをDBから取得（symptom カテゴリの有効分）
    const { data: kws } = await supabase
      .from('office_keyword_settings')
      .select('keyword')
      .eq('clinic_id', clinicId)
      .eq('category', 'symptom')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    let symptoms = (kws || []).map((k) => k.keyword)
    if (onlySymptom) symptoms = symptoms.filter((s) => s === onlySymptom)
    if (symptoms.length === 0) return NextResponse.json({ error: '症状キーワードが登録されていません' }, { status: 400 })

    const categories: CategoryType[] = onlyCategory ? [onlyCategory] : ['整体', '病院']

    const results: { symptom: string; category: CategoryType; count: number; error?: string }[] = []

    for (const symptom of symptoms) {
      for (const category of categories) {
        try {
          const query = `${symptom} ${category} ${area}`
          const top = await fetchMap(query)
          await supabase.from('office_competitor_snapshots').insert({
            clinic_id: clinicId,
            symptom,
            area,
            category,
            top_results: top,
            raw: { query },
          })
          results.push({ symptom, category, count: top.length })
        } catch (e) {
          results.push({ symptom, category, count: 0, error: (e as Error).message })
        }
        // SerpAPI レート保護
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

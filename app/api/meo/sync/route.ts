import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 300

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const OGUCHI_USER_ID = '99b75413-b76c-4097-94f7-f72b51e3dc6d'
const OGUCHI_BUSINESS_NAME = '大口神経整体院'

interface MapResult {
  position?: number
  title?: string
  place_id?: string
}

async function fetchRankFor(keyword: string, area: string): Promise<{ rank: number | null; topThree: MapResult[]; raw?: unknown }> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) throw new Error('SERPAPI_KEY missing')
  const query = `${keyword} ${area}`
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&google_domain=google.co.jp&hl=ja&type=search&api_key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`)
  const json = await res.json()
  const local = (json.local_results || []) as MapResult[]
  // 大口神経整体院のpositionを取得
  const target = local.find((r) => (r.title || '').includes('大口神経整体院'))
  return {
    rank: target?.position || null,
    topThree: local.slice(0, 3),
  }
}

export async function POST(req: NextRequest) {
  try {
    // Cron 認証
    const secret = req.headers.get('x-cron-secret')
    const isCron = req.headers.get('user-agent')?.includes('vercel-cron')
    if (process.env.CRON_SECRET && !isCron && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { data: clinic } = await supabase
      .from('meo_clinics')
      .select('id,name,area,keywords')
      .eq('id', OGUCHI_CLINIC_ID)
      .single()
    if (!clinic) return NextResponse.json({ error: 'clinic not found' }, { status: 404 })

    const area = (clinic.area || '大阪市住吉区').trim()
    const keywords: string[] = clinic.keywords || []
    if (keywords.length === 0) return NextResponse.json({ ok: true, synced: 0, message: 'no keywords' })

    const results: { keyword: string; rank: number | null; error?: string }[] = []
    for (const kw of keywords) {
      try {
        const { rank, topThree } = await fetchRankFor(kw, area)
        const id = `meo_${OGUCHI_USER_ID}_${kw}_${Date.now()}`.slice(0, 200)
        await supabase.from('meo_ranking_history').insert({
          id,
          user_id: OGUCHI_USER_ID,
          keyword: kw,
          rank,
          business_name: OGUCHI_BUSINESS_NAME,
          top_three: topThree,
        })
        results.push({ keyword: kw, rank })
      } catch (e) {
        results.push({ keyword: kw, rank: null, error: (e as Error).message })
      }
      await new Promise((r) => setTimeout(r, 400))
    }
    return NextResponse.json({ ok: true, synced: results.length, results })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron は GET でも叩く可能性あり
  return POST(req)
}

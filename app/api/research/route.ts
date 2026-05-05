import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 60

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'

// SerpAPI 結果を整形
type SerpAd = { title?: string; displayed_link?: string; link?: string; description?: string; source?: string }
type SerpOrganic = { position?: number; title?: string; link?: string; snippet?: string; displayed_link?: string }
type SerpRelated = { question?: string }

function summarizeAds(ads: SerpAd[]): string {
  if (!ads.length) return '広告出稿なし'
  return ads
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.title || '(無題)'} — ${a.displayed_link || ''}`)
    .join('\n')
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const limit = Math.min(parseInt(sp.get('limit') || '50'), 200)
    const { data, error } = await supabase
      .from('meo_ad_research_reports')
      .select('id,query,area,ad_count,summary,created_at,ads,organic_top,related_questions')
      .eq('clinic_id', OGUCHI_CLINIC_ID)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reports: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const query: string = (body.query || '').trim()
    const area: string = (body.area || '大阪市住吉区').trim()
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SERPAPI_KEY が設定されていません。.env.local と Vercel の環境変数に追加してください。' },
        { status: 500 }
      )
    }

    const fullQuery = area ? `${query} ${area}` : query
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(fullQuery)}&google_domain=google.co.jp&gl=jp&hl=ja&num=20&api_key=${apiKey}`

    const res = await fetch(url)
    if (!res.ok) {
      const t = await res.text()
      return NextResponse.json({ error: `SerpAPI error ${res.status}: ${t.slice(0, 300)}` }, { status: 502 })
    }
    const json = await res.json()

    const ads: SerpAd[] = json.ads || json.shopping_results || []
    const organic: SerpOrganic[] = (json.organic_results || []).slice(0, 10)
    const related: SerpRelated[] = json.related_questions || []

    const summary = `「${fullQuery}」の広告出稿数: ${ads.length}件\n\n■ 広告主TOP5\n${summarizeAds(ads)}\n\n■ オーガニック1位: ${organic[0]?.title || '—'}\n■ 関連質問数: ${related.length}件`

    const { data: saved, error: insErr } = await supabase
      .from('meo_ad_research_reports')
      .insert({
        clinic_id: OGUCHI_CLINIC_ID,
        query,
        area,
        raw_results: { ads, organic_top: organic, related_questions: related },
        ad_count: ads.length,
        ads,
        organic_top: organic,
        related_questions: related,
        summary,
      })
      .select()
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, report: saved })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

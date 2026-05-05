import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const OGUCHI_USER_ID = '99b75413-b76c-4097-94f7-f72b51e3dc6d'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const days = parseInt(sp.get('days') || '60')

    // クリニック情報＋登録キーワード
    const { data: clinic } = await supabase
      .from('meo_clinics')
      .select('id,name,area,keywords')
      .eq('id', OGUCHI_CLINIC_ID)
      .single()

    const sinceISO = new Date(Date.now() - days * 86400000).toISOString()

    // 順位履歴（指定日数）
    const { data: history } = await supabase
      .from('meo_ranking_history')
      .select('keyword,rank,checked_at')
      .eq('user_id', OGUCHI_USER_ID)
      .gte('checked_at', sinceISO)
      .order('checked_at', { ascending: false })

    // キーワード別に最新+履歴を集計
    const byKeyword: Record<string, { keyword: string; latestRank: number | null; latestAt: string | null; history: Array<{ rank: number | null; checked_at: string }> }> = {}
    for (const r of history || []) {
      const key = r.keyword
      if (!byKeyword[key]) {
        byKeyword[key] = { keyword: key, latestRank: null, latestAt: null, history: [] }
      }
      byKeyword[key].history.push({ rank: r.rank, checked_at: r.checked_at })
    }
    for (const k of Object.keys(byKeyword)) {
      const sorted = byKeyword[k].history.slice().sort((a, b) => (a.checked_at < b.checked_at ? 1 : -1))
      byKeyword[k].latestRank = sorted[0]?.rank ?? null
      byKeyword[k].latestAt = sorted[0]?.checked_at ?? null
      byKeyword[k].history = sorted.slice(0, 30).reverse()
    }

    // 登録KWで履歴ゼロのものも一覧に追加
    const registered = (clinic?.keywords || []) as string[]
    for (const kw of registered) {
      if (!byKeyword[kw]) byKeyword[kw] = { keyword: kw, latestRank: null, latestAt: null, history: [] }
    }

    const items = Object.values(byKeyword)
      .sort((a, b) => {
        // ランク良い順（nullは末尾）
        if (a.latestRank === null && b.latestRank === null) return 0
        if (a.latestRank === null) return 1
        if (b.latestRank === null) return -1
        return a.latestRank - b.latestRank
      })

    const summary = {
      keywordCount: items.length,
      ranked: items.filter((i) => i.latestRank && i.latestRank <= 10).length,
      top3: items.filter((i) => i.latestRank && i.latestRank <= 3).length,
      lastChecked: items.reduce((acc: string | null, cur) => {
        if (!cur.latestAt) return acc
        if (!acc) return cur.latestAt
        return cur.latestAt > acc ? cur.latestAt : acc
      }, null),
    }

    return NextResponse.json({
      clinic,
      summary,
      keywords: items,
      meoAppUrl: process.env.MEO_APP_URL || 'https://meo-katiagari-kun-v2.vercel.app',
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

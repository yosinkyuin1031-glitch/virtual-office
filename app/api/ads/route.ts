import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'

type Platform = 'meta' | 'google'

interface CredRow {
  platform: Platform
  status: 'pending' | 'connected' | 'error'
  account_id: string | null
  customer_id: string | null
  last_synced_at: string | null
  last_error: string | null
}

async function getCredentials(): Promise<Record<Platform, CredRow>> {
  const { data } = await supabase
    .from('office_ad_credentials')
    .select('platform,status,account_id,customer_id,last_synced_at,last_error')
    .eq('clinic_id', OGUCHI_CLINIC_ID)
  const map: Record<string, CredRow> = {}
  for (const row of data || []) map[row.platform] = row as CredRow
  // env からの即時連携状況も反映（DB未設定でも env に key があれば pending とみなす）
  const metaEnv = !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID)
  const googleEnv = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_REFRESH_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID)
  if (!map.meta) map.meta = { platform: 'meta', status: metaEnv ? 'pending' : 'pending', account_id: process.env.META_AD_ACCOUNT_ID || null, customer_id: null, last_synced_at: null, last_error: null }
  if (!map.google) map.google = { platform: 'google', status: googleEnv ? 'pending' : 'pending', account_id: null, customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || null, last_synced_at: null, last_error: null }
  return map as Record<Platform, CredRow>
}

function envConfigured(platform: Platform): boolean {
  if (platform === 'meta') return !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID)
  return !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_REFRESH_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID && process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET)
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const days = parseInt(sp.get('days') || '30')
    const sinceDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const creds = await getCredentials()

    const { data: metrics } = await supabase
      .from('office_ad_metrics_daily')
      .select('platform,date,impressions,clicks,spend,conversions,ctr,cpc,cpa,campaign_name')
      .eq('clinic_id', OGUCHI_CLINIC_ID)
      .gte('date', sinceDate)
      .order('date', { ascending: false })

    // プラットフォーム別集計
    const summary: Record<Platform, { impressions: number; clicks: number; spend: number; conversions: number; ctr: number; cpc: number; cpa: number; days: number }> = {
      meta: { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, days: 0 },
      google: { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, days: 0 },
    }
    const byDate: Record<string, { meta: { impressions: number; clicks: number; spend: number; conv: number }; google: { impressions: number; clicks: number; spend: number; conv: number } }> = {}

    for (const m of metrics || []) {
      const p = m.platform as Platform
      if (!summary[p]) continue
      summary[p].impressions += Number(m.impressions || 0)
      summary[p].clicks += Number(m.clicks || 0)
      summary[p].spend += Number(m.spend || 0)
      summary[p].conversions += Number(m.conversions || 0)
      if (!byDate[m.date]) byDate[m.date] = { meta: { impressions: 0, clicks: 0, spend: 0, conv: 0 }, google: { impressions: 0, clicks: 0, spend: 0, conv: 0 } }
      byDate[m.date][p].impressions += Number(m.impressions || 0)
      byDate[m.date][p].clicks += Number(m.clicks || 0)
      byDate[m.date][p].spend += Number(m.spend || 0)
      byDate[m.date][p].conv += Number(m.conversions || 0)
    }
    for (const p of ['meta', 'google'] as Platform[]) {
      const s = summary[p]
      s.ctr = s.impressions > 0 ? s.clicks / s.impressions : 0
      s.cpc = s.clicks > 0 ? s.spend / s.clicks : 0
      s.cpa = s.conversions > 0 ? s.spend / s.conversions : 0
      s.days = Object.keys(byDate).filter((d) => byDate[d][p].impressions > 0).length
    }

    const series = Object.keys(byDate)
      .sort()
      .map((d) => ({ date: d, ...byDate[d] }))

    return NextResponse.json({
      creds,
      envConfigured: { meta: envConfigured('meta'), google: envConfigured('google') },
      summary,
      series,
      hasData: (metrics || []).length > 0,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST: 同期トリガー（未連携時はエラーではなく status=not_configured を返す）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const platform: Platform = body.platform === 'google' ? 'google' : 'meta'

    if (!envConfigured(platform)) {
      return NextResponse.json({
        ok: true,
        status: 'not_configured',
        message:
          platform === 'meta'
            ? 'META_ACCESS_TOKEN と META_AD_ACCOUNT_ID を Vercel 環境変数に設定してください。Business Manager → システムユーザー → トークン生成（広告:読み取り）'
            : 'Google Ads は GOOGLE_ADS_DEVELOPER_TOKEN / CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN / CUSTOMER_ID の5つを設定してください。Developer Token は Google Ads → ツール → API センターから申請（審査1〜2週間）',
      })
    }

    if (platform === 'meta') {
      const accountId = process.env.META_AD_ACCOUNT_ID!.replace(/^act_/, '')
      const token = process.env.META_ACCESS_TOKEN!
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      const until = new Date().toISOString().slice(0, 10)
      const url = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,actions,ctr,cpc&time_range[since]=${since}&time_range[until]=${until}&time_increment=1&access_token=${token}`
      const res = await fetch(url)
      if (!res.ok) {
        const t = await res.text()
        await supabase.from('office_ad_credentials').upsert({ clinic_id: OGUCHI_CLINIC_ID, platform: 'meta', status: 'error', last_error: t.slice(0, 500), updated_at: new Date().toISOString() }, { onConflict: 'clinic_id,platform' })
        return NextResponse.json({ ok: false, status: 'api_error', message: `Meta API ${res.status}: ${t.slice(0, 300)}` }, { status: 502 })
      }
      const json = await res.json()
      const rows = (json.data || []).map((r: { campaign_id?: string; campaign_name?: string; impressions?: string; clicks?: string; spend?: string; actions?: Array<{ value?: string }>; date_start?: string; ctr?: string; cpc?: string }) => {
        const conv = (r.actions || []).reduce((s: number, a) => s + Number(a.value || 0), 0)
        return {
          clinic_id: OGUCHI_CLINIC_ID,
          platform: 'meta' as const,
          account_id: accountId,
          campaign_id: r.campaign_id || null,
          campaign_name: r.campaign_name || null,
          date: r.date_start || since,
          impressions: Number(r.impressions || 0),
          clicks: Number(r.clicks || 0),
          spend: Number(r.spend || 0),
          conversions: conv,
          ctr: r.ctr ? Number(r.ctr) / 100 : null,
          cpc: r.cpc ? Number(r.cpc) : null,
          cpa: conv > 0 && r.spend ? Number(r.spend) / conv : null,
          raw: r,
        }
      })
      if (rows.length > 0) {
        await supabase.from('office_ad_metrics_daily').upsert(rows, { onConflict: 'clinic_id,platform,campaign_id,date' })
      }
      await supabase.from('office_ad_credentials').upsert({ clinic_id: OGUCHI_CLINIC_ID, platform: 'meta', status: 'connected', account_id: accountId, last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }, { onConflict: 'clinic_id,platform' })
      return NextResponse.json({ ok: true, status: 'connected', synced: rows.length })
    }

    // Google Ads は将来実装。現状は env がそろっていてもプレースホルダ
    return NextResponse.json({
      ok: true,
      status: 'not_implemented',
      message: 'Google Ads API の同期処理は未実装です。env が揃ったら追加実装します（OAuth refresh + GAQL 経由）。',
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const OGUCHI_USER_ID = '99b75413-b76c-4097-94f7-f72b51e3dc6d'

export async function GET() {
  try {
    // 並列にチェック
    const [
      videosRes,
      keywordsRes,
      reviewsRes,
      meoRes,
      competitorsRes,
      goalsRes,
    ] = await Promise.all([
      supabase.from('office_gbp_videos').select('id').eq('clinic_id', OGUCHI_CLINIC_ID).eq('active', true),
      supabase.from('office_keyword_settings').select('category').eq('clinic_id', OGUCHI_CLINIC_ID).eq('active', true),
      supabase.from('meo_clinic_reviews').select('reply_status').eq('clinic_id', OGUCHI_CLINIC_ID),
      supabase.from('meo_ranking_history').select('checked_at').eq('user_id', OGUCHI_USER_ID).order('checked_at', { ascending: false }).limit(1),
      supabase.from('office_competitor_snapshots').select('id').eq('clinic_id', OGUCHI_CLINIC_ID).limit(1),
      supabase.from('vo_goals').select('id').limit(1).maybeSingle(),
    ])

    const videoCount = videosRes.data?.length || 0
    const kwBuckets = (keywordsRes.data || []).reduce((acc: Record<string, number>, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1
      return acc
    }, {})
    const reviewTotal = reviewsRes.data?.length || 0
    const reviewUnreplied = (reviewsRes.data || []).filter(r => !r.reply_status || r.reply_status === 'unreplied').length

    const lastMeoCheck = meoRes.data?.[0]?.checked_at || null
    const meoFresh = lastMeoCheck && (Date.now() - new Date(lastMeoCheck).getTime() < 36 * 3600 * 1000)
    const competitorsFetched = (competitorsRes.data?.length || 0) > 0
    const goalsRegistered = !!goalsRes.data

    return NextResponse.json({
      seitai: {
        kpi: {
          status: goalsRegistered ? 'ok' : 'warning',
          label: goalsRegistered ? '方針・KPI 登録済' : '方針・KPI 未登録',
          target: '/api/goals',
        },
        reviews: {
          status: reviewTotal === 0 ? 'warning' : reviewUnreplied === 0 ? 'ok' : 'pending',
          label: reviewTotal === 0
            ? '口コミ未取得（MEO勝ち上げくんで取得）'
            : reviewUnreplied > 0
              ? `口コミ AI返信未生成 ${reviewUnreplied}件`
              : `口コミ全件対応済（${reviewTotal}件）`,
          link: '/reviews',
        },
        keywords: {
          status: (kwBuckets.symptom || 0) > 0 ? 'ok' : 'warning',
          label: (kwBuckets.symptom || 0) > 0
            ? `LLMOキーワード（症状${kwBuckets.symptom || 0}/地域${kwBuckets.area || 0}/強み${kwBuckets.strength || 0}）`
            : 'LLMOキーワード 未設定',
          link: '/keywords',
        },
        meo: {
          status: !lastMeoCheck ? 'warning' : meoFresh ? 'ok' : 'pending',
          label: !lastMeoCheck
            ? 'MEO順位 未取得（毎朝4時自動）'
            : meoFresh
              ? `MEO順位 最新（${new Date(lastMeoCheck).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric' })}）`
              : `MEO順位 古い（${new Date(lastMeoCheck).toLocaleDateString('ja-JP')}）`,
          link: '/meo',
        },
        gbp_videos: {
          status: videoCount === 0 ? 'warning' : 'ok',
          label: videoCount === 0 ? 'GBP動画プール 未登録' : `GBP動画プール ${videoCount}本`,
          link: '/gbp',
        },
        competitors: {
          status: competitorsFetched ? 'ok' : 'warning',
          label: competitorsFetched ? '競合TOP5 取得済' : '競合TOP5 未取得',
          link: '/competitors',
        },
        meta_ads: {
          status: process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID ? 'ok' : 'error',
          label: process.env.META_ACCESS_TOKEN ? 'Meta広告 連携済' : 'Meta広告 API未連携（トークン未設定）',
          link: '/ads',
        },
        google_ads: {
          status: process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_REFRESH_TOKEN ? 'ok' : 'error',
          label: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? 'Google広告 連携済' : 'Google広告 API未連携',
          link: '/ads',
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

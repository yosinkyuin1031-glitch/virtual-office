import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

// モデル料金（USD per MTok・2026年5月時点）
const PRICING = {
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0, label: 'Haiku 4.5' },
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0, label: 'Sonnet 4.5' },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, label: 'Sonnet 4.6' },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0, label: 'Sonnet 4' },
  'claude-opus-4-7': { input: 15.0, output: 75.0, label: 'Opus 4.7' },
}

// 使用見積（実測ではなく、各機能の月間想定回数とトークン数の概算）
const USAGE_ESTIMATES = [
  { feature: 'GBP毎日投稿生成', endpoint: '/api/gbp', model: 'claude-haiku-4-5-20251001', monthly_calls: 30, avg_in_tokens: 600, avg_out_tokens: 400 },
  { feature: '口コミ返信生成', endpoint: '/api/reviews', model: 'claude-haiku-4-5-20251001', monthly_calls: 20, avg_in_tokens: 800, avg_out_tokens: 300 },
  { feature: 'Plaud分類', endpoint: '/api/plaud-webhook', model: 'claude-haiku-4-5-20251001', monthly_calls: 30, avg_in_tokens: 1500, avg_out_tokens: 500 },
  { feature: 'AIチャット', endpoint: '/api/chat', model: 'claude-sonnet-4-6', monthly_calls: 100, avg_in_tokens: 1500, avg_out_tokens: 800 },
  { feature: '自動タスク生成', endpoint: '/api/auto-tasks', model: 'claude-sonnet-4-20250514', monthly_calls: 30, avg_in_tokens: 2000, avg_out_tokens: 1000 },
  { feature: '実行エンジン', endpoint: '/api/execute', model: 'claude-sonnet-4-20250514', monthly_calls: 50, avg_in_tokens: 2500, avg_out_tokens: 1200 },
  { feature: 'PDCA各種', endpoint: '/api/pdca/*', model: 'claude-sonnet-4-6', monthly_calls: 60, avg_in_tokens: 3000, avg_out_tokens: 1500 },
  { feature: 'Cron処理', endpoint: '/api/cron', model: 'claude-sonnet-4-6', monthly_calls: 30, avg_in_tokens: 1000, avg_out_tokens: 500 },
]

// 実際のvo_tasks/threads等の件数からの概算もできるが、まずは固定見積もり
function calcAnthropicCost() {
  const USD_TO_JPY = 155
  const lines = USAGE_ESTIMATES.map(u => {
    const p = PRICING[u.model as keyof typeof PRICING]
    const inputCost = (u.monthly_calls * u.avg_in_tokens / 1_000_000) * p.input
    const outputCost = (u.monthly_calls * u.avg_out_tokens / 1_000_000) * p.output
    const totalUsd = inputCost + outputCost
    return {
      feature: u.feature,
      endpoint: u.endpoint,
      model: p.label,
      monthly_calls: u.monthly_calls,
      monthly_cost_usd: Number(totalUsd.toFixed(4)),
      monthly_cost_jpy: Math.round(totalUsd * USD_TO_JPY),
    }
  })
  const totalUsd = lines.reduce((s, l) => s + l.monthly_cost_usd, 0)
  return { lines, totalUsd: Number(totalUsd.toFixed(2)), totalJpy: Math.round(totalUsd * USD_TO_JPY) }
}

export async function GET() {
  try {
    const anthropic = calcAnthropicCost()

    // SerpAPI 使用回数（office_competitor_snapshots と meo_ranking_history と meo_ad_research_reports の月間追加件数）
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const [comp, meo, research] = await Promise.all([
      supabase.from('office_competitor_snapshots').select('id', { count: 'exact', head: true }).gte('fetched_at', monthAgo),
      supabase.from('meo_ranking_history').select('id', { count: 'exact', head: true }).gte('checked_at', monthAgo),
      supabase.from('meo_ad_research_reports').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ])
    const serpCalls = (comp.count || 0) + (meo.count || 0) + (research.count || 0)
    const serpPlan = serpCalls < 100 ? 'Free（無料）' : 'Hobby ($50)'
    const serpCostJpy = serpCalls < 100 ? 0 : 7500

    const services = [
      { name: 'Anthropic Claude', detail: `8機能で利用・うち3機能はHaiku化済`, cost_jpy: anthropic.totalJpy },
      { name: 'SerpAPI', detail: `今月${serpCalls}回実行 / ${serpPlan}`, cost_jpy: serpCostJpy },
      { name: 'Vercel', detail: 'Cron + Functions', cost_jpy: 3000, note: 'Pro想定（要見直し）' },
      { name: 'Supabase', detail: 'Free Tier 範囲内', cost_jpy: 0 },
    ]
    const totalJpy = services.reduce((s, x) => s + x.cost_jpy, 0)

    return NextResponse.json({
      anthropic,
      services,
      totalJpy,
      note: 'Anthropic は使用想定値ベースの概算。SerpAPIは過去30日の実DB件数。実コストはVercel/Anthropicダッシュボードで要確認',
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

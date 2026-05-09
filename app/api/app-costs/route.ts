import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { products } from '../../lib/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

// 外部利用アプリ（他者が使うアプリのみ・自院運用は対象外）
type ExternalApp = { id: string; name: string; url: string | null; category: string; icon: string; user: string }
const EXTERNAL_APPS: ExternalApp[] = [
  // BtoB販売（誰でも購入可能）
  { id: 'customer-mgmt', name: 'Clinic Core', url: 'https://customer-mgmt.vercel.app', category: 'BtoB販売', icon: '👥', user: '山口先生・石川先生・他' },
  { id: 'kensa-saas', name: 'カラダマップ（検査シートSaaS）', url: 'https://kensa-sheet-app.vercel.app', category: 'BtoB販売', icon: '🔬', user: '水田先生・モニター' },
  { id: 'ai-master', name: '治療家AIマスター', url: 'https://ai-master.vercel.app', category: 'BtoB販売', icon: '🧠', user: 'BtoB' },
  { id: 'ai-tools', name: '整体院AIツール', url: 'https://seitai-ai-tools.vercel.app', category: 'BtoB販売', icon: '🤖', user: 'BtoB' },
  { id: 'meo-winner', name: 'MEO勝ち上げくん', url: 'https://meo-kachiagekun.vercel.app', category: 'BtoB販売', icon: '🏆', user: 'モニター10名' },
  { id: 'meo-checker-dist', name: 'MEOチェッカー（配布用）', url: 'https://meo-checker-three.vercel.app', category: 'BtoB販売', icon: '📦', user: 'モニター配布' },
  { id: 'line-delivery', name: 'LINE配信アプリ', url: 'https://line-delivery.vercel.app', category: 'BtoB販売', icon: '📨', user: 'BtoB' },
  { id: 'heatscope', name: 'HeatScope', url: 'https://heatscope.vercel.app', category: 'BtoB販売', icon: '🔥', user: '8サイト計測中' },
  { id: 'training-clinic', name: 'トレクリ（TrainingClinic）', url: 'https://training-clinic-app.vercel.app', category: 'BtoB販売', icon: '💪', user: '川口先生' },
  { id: 'vision-clinic', name: 'VisionClinic', url: null, category: 'BtoB販売', icon: '👁️', user: '二葉先生（共同開発）' },

  // C-cure 受託案件（清水先生）
  { id: 'ccure-monshin', name: 'C-cure 問診票', url: 'https://headache-monshin.vercel.app', category: 'C-cure（清水先生）', icon: '📋', user: '清水先生＋受講生' },
  { id: 'ccure-headache-diagnosis', name: 'C-cure 頭痛診断', url: 'https://headache-diagnosis.vercel.app', category: 'C-cure（清水先生）', icon: '🤕', user: '清水先生＋受講生' },
  { id: 'ccure-headache-note', name: 'C-cure 頭痛ダイアリー', url: 'https://headache-note.vercel.app', category: 'C-cure（清水先生）', icon: '📔', user: '清水先生＋受講生' },

  // 個別カスタム
  { id: 'tiktok-recipe', name: 'TikTokレシピリサーチ', url: 'https://tiktok-recipe-research.vercel.app', category: '個別カスタム', icon: '🍳', user: '1クライアント専用' },
]

function externalApps() {
  return EXTERNAL_APPS.map(a => ({
    id: a.id,
    name: a.name,
    url: a.url,
    category: a.category,
    status: 'active',
    icon: a.icon,
    user: a.user,
  }))
}
// products は使わないが import 警告回避のため一度参照
void products.length

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const month = sp.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM

    const apps = externalApps()
    const { data: costs, error } = await supabase
      .from('office_app_costs_with_total')
      .select('*')
      .eq('month', month)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // appごとに当月のコスト行をマージ
    const costsByApp: Record<string, Record<string, unknown>> = {}
    for (const c of costs || []) costsByApp[c.app_id] = c

    const merged = apps.map(app => {
      const c = costsByApp[app.id] || {}
      return {
        ...app,
        cost_id: c.id || null,
        vercel_jpy: Number(c.vercel_jpy || 0),
        supabase_jpy: Number(c.supabase_jpy || 0),
        api_anthropic_jpy: Number(c.api_anthropic_jpy || 0),
        api_other_jpy: Number(c.api_other_jpy || 0),
        domain_jpy: Number(c.domain_jpy || 0),
        other_jpy: Number(c.other_jpy || 0),
        total_jpy: Number(c.total_jpy || 0),
        notes: c.notes || '',
      }
    })

    const totals = merged.reduce((acc, m) => ({
      vercel: acc.vercel + m.vercel_jpy,
      supabase: acc.supabase + m.supabase_jpy,
      anthropic: acc.anthropic + m.api_anthropic_jpy,
      other_api: acc.other_api + m.api_other_jpy,
      domain: acc.domain + m.domain_jpy,
      other: acc.other + m.other_jpy,
      total: acc.total + m.total_jpy,
    }), { vercel: 0, supabase: 0, anthropic: 0, other_api: 0, domain: 0, other: 0, total: 0 })

    // 過去6ヶ月のグランドトータル推移
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    const fromMonth = sixMonthsAgo.toISOString().slice(0, 7)
    const { data: history } = await supabase
      .from('office_app_costs_with_total')
      .select('month, total_jpy')
      .gte('month', fromMonth)
    const historyByMonth: Record<string, number> = {}
    for (const h of history || []) {
      historyByMonth[h.month] = (historyByMonth[h.month] || 0) + Number(h.total_jpy || 0)
    }
    const historySeries = Object.keys(historyByMonth).sort().map(m => ({ month: m, total: historyByMonth[m] }))

    return NextResponse.json({ month, apps: merged, totals, history: historySeries })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { app_id, app_name, month, vercel_jpy = 0, supabase_jpy = 0, api_anthropic_jpy = 0, api_other_jpy = 0, domain_jpy = 0, other_jpy = 0, notes } = body
    if (!app_id || !month) return NextResponse.json({ error: 'app_id and month required' }, { status: 400 })

    const payload = { app_id, app_name, month, vercel_jpy, supabase_jpy, api_anthropic_jpy, api_other_jpy, domain_jpy, other_jpy, notes, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('office_app_costs').upsert(payload, { onConflict: 'app_id,month' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 当月分を前月から複製
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action
    if (action === 'copy_from_prev') {
      const { from_month, to_month } = body
      if (!from_month || !to_month) return NextResponse.json({ error: 'from_month and to_month required' }, { status: 400 })
      const { data: src, error } = await supabase
        .from('office_app_costs')
        .select('app_id, app_name, vercel_jpy, supabase_jpy, api_anthropic_jpy, api_other_jpy, domain_jpy, other_jpy, notes')
        .eq('month', from_month)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const rows = (src || []).map(r => ({ ...r, month: to_month }))
      if (rows.length > 0) {
        await supabase.from('office_app_costs').upsert(rows, { onConflict: 'app_id,month' })
      }
      return NextResponse.json({ ok: true, copied: rows.length })
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

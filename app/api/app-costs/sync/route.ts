import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 120

// /api/app-costs/route.ts と同じリスト
const EXTERNAL_APPS = [
  { id: 'customer-mgmt', name: 'Clinic Core', vercelProject: 'customer-mgmt' },
  { id: 'kensa-saas', name: 'カラダマップ（検査シートSaaS）', vercelProject: 'kensa-sheet-app' },
  { id: 'ai-master', name: '治療家AIマスター', vercelProject: 'ai-master' },
  { id: 'ai-tools', name: '整体院AIツール', vercelProject: 'seitai-ai-tools' },
  { id: 'meo-winner', name: 'MEO勝ち上げくん', vercelProject: 'meo-kachiagekun' },
  { id: 'meo-checker-dist', name: 'MEOチェッカー（配布用）', vercelProject: 'meo-checker' },
  { id: 'line-delivery', name: 'LINE配信アプリ', vercelProject: 'line-delivery' },
  { id: 'heatscope', name: 'HeatScope', vercelProject: 'heatscope' },
  { id: 'training-clinic', name: 'トレクリ（TrainingClinic）', vercelProject: 'training-clinic-app' },
  { id: 'vision-clinic', name: 'VisionClinic', vercelProject: 'vision-clinic' },
  { id: 'ccure-monshin', name: 'C-cure 問診票', vercelProject: 'headache-monshin' },
  { id: 'ccure-headache-diagnosis', name: 'C-cure 頭痛診断', vercelProject: 'headache-diagnosis' },
  { id: 'ccure-headache-note', name: 'C-cure 頭痛ダイアリー', vercelProject: 'headache-note' },
  { id: 'tiktok-recipe', name: 'TikTokレシピリサーチ', vercelProject: 'tiktok-recipe-research' },
]

const VERCEL_PRO_USD = 20  // Pro plan base
const USD_TO_JPY = 155

// Vercel API: プロジェクトIDをプロジェクト名から解決（全ページ取得）
async function resolveProjectIds(token: string, teamId: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  let until: number | undefined
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({ teamId, limit: '100' })
    if (until) params.set('until', String(until))
    const res = await fetch(`https://api.vercel.com/v9/projects?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Vercel projects ${res.status}`)
    const json = await res.json()
    const projects = json.projects || []
    for (const p of projects) map[p.name] = p.id
    const next = json.pagination?.next
    if (!next || projects.length === 0) break
    until = next
  }
  return map
}

// プロジェクトの月間使用量（バンド幅・ビルド時間など）。Proプランのusage APIから取得を試みる
async function getProjectUsage(token: string, teamId: string, projectId: string, fromIso: string, toIso: string) {
  // Vercel usage API（簡易）：プロジェクト単位のbandwidth+function execution時間
  try {
    const url = `https://api.vercel.com/v1/data-cache/usage?teamId=${teamId}&from=${fromIso}&to=${toIso}&projectId=${projectId}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return { bandwidth_gb: 0, function_gb_hour: 0 }
    const json = await res.json()
    return {
      bandwidth_gb: Number(json.bandwidth || 0) / (1024 * 1024 * 1024),
      function_gb_hour: Number(json.functionExecution || 0) / 3600,
    }
  } catch {
    return { bandwidth_gb: 0, function_gb_hour: 0 }
  }
}

export async function POST(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const monthArg = sp.get('month') || new Date().toISOString().slice(0, 7)

    // Cron 認証
    const isCron = req.headers.get('user-agent')?.includes('vercel-cron')
    const secret = req.headers.get('x-cron-secret')
    if (process.env.CRON_SECRET && !isCron && secret !== process.env.CRON_SECRET) {
      // 通常リクエストもOK（手動更新を許容）
    }

    const token = process.env.VERCEL_TOKEN
    const teamId = process.env.VERCEL_TEAM_ID
    if (!token || !teamId) {
      return NextResponse.json({ error: 'VERCEL_TOKEN / VERCEL_TEAM_ID が未設定' }, { status: 500 })
    }

    // プロジェクトID解決
    const projectIds = await resolveProjectIds(token, teamId)

    // 月の範囲
    const [y, m] = monthArg.split('-').map(Number)
    const from = new Date(Date.UTC(y, m - 1, 1)).toISOString()
    const to = new Date(Date.UTC(y, m, 0, 23, 59, 59)).toISOString()

    // Pro plan を「実在する外部アプリ」で按分
    const existingApps = EXTERNAL_APPS.filter(a => projectIds[a.vercelProject])
    const allocPerAppJpy = existingApps.length > 0 ? Math.round((VERCEL_PRO_USD * USD_TO_JPY) / existingApps.length) : 0

    // 各アプリの使用量取得＋按分コスト保存
    const results: Array<{ id: string; name: string; vercel_jpy: number; bandwidth_gb: number; status: string }> = []
    for (const app of EXTERNAL_APPS) {
      const projectId = projectIds[app.vercelProject]
      if (!projectId) {
        results.push({ id: app.id, name: app.name, vercel_jpy: 0, bandwidth_gb: 0, status: 'project_not_found' })
        continue
      }
      const usage = await getProjectUsage(token, teamId, projectId, from, to)
      const vercelJpy = allocPerAppJpy

      // upsert
      const { error: upsertErr } = await supabase.from('office_app_costs').upsert({
        app_id: app.id,
        app_name: app.name,
        month: monthArg,
        vercel_jpy: vercelJpy,
        // supabase/anthropic/その他は別ソースで取得しないため触らない（既存値保持したいので、upsertの既存値を維持するようにinsertロジック工夫）
        notes: `Vercel API同期 ${new Date().toISOString().slice(0, 10)}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'app_id,month', ignoreDuplicates: false })

      if (upsertErr) {
        results.push({ id: app.id, name: app.name, vercel_jpy: 0, bandwidth_gb: usage.bandwidth_gb, status: 'db_error: ' + upsertErr.message })
      } else {
        results.push({ id: app.id, name: app.name, vercel_jpy: vercelJpy, bandwidth_gb: usage.bandwidth_gb, status: 'ok' })
      }
    }

    return NextResponse.json({
      ok: true,
      month: monthArg,
      vercel_pro_usd: VERCEL_PRO_USD,
      vercel_pro_jpy_total: VERCEL_PRO_USD * USD_TO_JPY,
      apps_synced: results.filter(r => r.status === 'ok').length,
      total_apps: EXTERNAL_APPS.length,
      alloc_per_app_jpy: allocPerAppJpy,
      results,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}

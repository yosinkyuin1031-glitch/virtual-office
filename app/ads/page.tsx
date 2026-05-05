'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Platform = 'meta' | 'google'

interface Cred {
  platform: Platform
  status: 'pending' | 'connected' | 'error'
  account_id: string | null
  customer_id: string | null
  last_synced_at: string | null
  last_error: string | null
}

interface Summary {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  days: number
}

interface SeriesRow {
  date: string
  meta: { impressions: number; clicks: number; spend: number; conv: number }
  google: { impressions: number; clicks: number; spend: number; conv: number }
}

interface ApiResponse {
  creds: Record<Platform, Cred>
  envConfigured: { meta: boolean; google: boolean }
  summary: Record<Platform, Summary>
  series: SeriesRow[]
  hasData: boolean
}

export default function AdsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<Platform | null>(null)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/ads?days=30')
    const d: ApiResponse = await r.json()
    setData(d)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const sync = async (platform: Platform) => {
    setSyncing(platform)
    try {
      const r = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const d = await r.json()
      if (d.status === 'not_configured') {
        alert('未連携です\n\n' + (d.message || ''))
      } else if (d.status === 'connected') {
        alert(`同期完了：${d.synced || 0} 行`)
      } else if (d.status === 'not_implemented') {
        alert(d.message || 'まだ実装されていません')
      } else if (d.status === 'api_error') {
        alert('API エラー：' + (d.message || ''))
      }
      await load()
    } finally {
      setSyncing(null)
    }
  }

  const fmt = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
  const fmtY = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP')
  const fmtPct = (n: number) => (n * 100).toFixed(2) + '%'

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">← ホーム</Link>
          <span>/</span>
          <span>広告分析</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">広告分析（Meta / Google Ads）</h1>
        <p className="text-gray-400 text-sm mb-6">過去30日のCPC・CTR・CPAをAPI連携で自動取得</p>

        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : !data ? (
          <p className="text-red-400">読み込み失敗</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <PlatformCard
                name="Meta（Facebook/Instagram）広告"
                color="bg-blue-600"
                cred={data.creds.meta}
                envOk={data.envConfigured.meta}
                summary={data.summary.meta}
                onSync={() => sync('meta')}
                syncing={syncing === 'meta'}
                fmt={fmt}
                fmtY={fmtY}
                fmtPct={fmtPct}
                envHelp={
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Business Manager → システムユーザーを作成</li>
                    <li>広告アカウントへ「広告：分析」権限を付与</li>
                    <li>システムユーザーから永続トークンを生成</li>
                    <li>Vercel 環境変数に <code className="text-blue-300">META_ACCESS_TOKEN</code> と <code className="text-blue-300">META_AD_ACCOUNT_ID</code> を追加</li>
                    <li>「同期する」ボタンを押す</li>
                  </ol>
                }
              />
              <PlatformCard
                name="Google Ads"
                color="bg-emerald-600"
                cred={data.creds.google}
                envOk={data.envConfigured.google}
                summary={data.summary.google}
                onSync={() => sync('google')}
                syncing={syncing === 'google'}
                fmt={fmt}
                fmtY={fmtY}
                fmtPct={fmtPct}
                envHelp={
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Google Ads → ツール → API センター で Developer Token 申請（審査1〜2週間）</li>
                    <li>Google Cloud で OAuth Client ID/Secret 作成</li>
                    <li>OAuth 同意画面で Refresh Token 発行</li>
                    <li>Vercel 環境変数に5つを追加：<code className="text-emerald-300">GOOGLE_ADS_DEVELOPER_TOKEN / CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN / CUSTOMER_ID</code></li>
                    <li>同期処理は env がそろい次第有効化</li>
                  </ol>
                }
              />
            </div>

            {data.hasData && data.series.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">日次推移（直近30日）</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-xs text-gray-400">
                      <tr>
                        <th className="text-left p-2">日付</th>
                        <th className="text-right p-2">Meta 表示</th>
                        <th className="text-right p-2">Meta クリック</th>
                        <th className="text-right p-2">Meta 費用</th>
                        <th className="text-right p-2">Meta CV</th>
                        <th className="text-right p-2">Google 表示</th>
                        <th className="text-right p-2">Google クリック</th>
                        <th className="text-right p-2">Google 費用</th>
                        <th className="text-right p-2">Google CV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.series.slice().reverse().map((row) => (
                        <tr key={row.date} className="border-t border-gray-800">
                          <td className="p-2 text-gray-300">{row.date}</td>
                          <td className="p-2 text-right">{fmt(row.meta.impressions)}</td>
                          <td className="p-2 text-right">{fmt(row.meta.clicks)}</td>
                          <td className="p-2 text-right">{fmtY(row.meta.spend)}</td>
                          <td className="p-2 text-right">{fmt(row.meta.conv)}</td>
                          <td className="p-2 text-right">{fmt(row.google.impressions)}</td>
                          <td className="p-2 text-right">{fmt(row.google.clicks)}</td>
                          <td className="p-2 text-right">{fmtY(row.google.spend)}</td>
                          <td className="p-2 text-right">{fmt(row.google.conv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PlatformCard({
  name,
  color,
  cred,
  envOk,
  summary,
  onSync,
  syncing,
  fmt,
  fmtY,
  fmtPct,
  envHelp,
}: {
  name: string
  color: string
  cred: Cred
  envOk: boolean
  summary: Summary
  onSync: () => void
  syncing: boolean
  fmt: (n: number) => string
  fmtY: (n: number) => string
  fmtPct: (n: number) => string
  envHelp: React.ReactNode
}) {
  const status = cred.status
  const isConnected = envOk && (status === 'connected' || cred.last_synced_at)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          <h2 className="font-semibold">{name}</h2>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          isConnected ? 'bg-green-500/20 text-green-300'
            : status === 'error' ? 'bg-red-500/20 text-red-300'
              : 'bg-gray-500/20 text-gray-400'
        }`}>
          {isConnected ? '連携済' : status === 'error' ? 'エラー' : '未連携'}
        </span>
      </div>

      {!isConnected ? (
        <div>
          <p className="text-sm text-gray-300 mb-3">API連携が未設定です。以下の手順でセットアップしてください。</p>
          {envHelp}
          {status === 'error' && cred.last_error && (
            <p className="text-xs text-red-300 mt-2">最新エラー: {cred.last_error}</p>
          )}
          <button
            onClick={onSync}
            disabled={syncing}
            className="mt-3 w-full px-3 py-2 rounded text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
          >
            {syncing ? '確認中…' : '接続テスト'}
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Cell label="表示" value={fmt(summary.impressions)} />
            <Cell label="クリック" value={fmt(summary.clicks)} />
            <Cell label="費用" value={fmtY(summary.spend)} />
            <Cell label="コンバージョン" value={fmt(summary.conversions)} />
            <Cell label="CTR" value={fmtPct(summary.ctr)} />
            <Cell label="CPC" value={fmtY(summary.cpc)} />
            <Cell label="CPA" value={summary.conversions > 0 ? fmtY(summary.cpa) : '—'} />
            <Cell label="集計日数" value={`${summary.days}日`} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              最終同期: {cred.last_synced_at ? new Date(cred.last_synced_at).toLocaleString('ja-JP') : '—'}
            </p>
            <button
              onClick={onSync}
              disabled={syncing}
              className="px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              {syncing ? '同期中…' : '同期する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded p-2">
      <div className="text-[10px] text-gray-400">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  )
}

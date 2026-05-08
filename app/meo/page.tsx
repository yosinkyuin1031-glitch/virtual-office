'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface KeywordRow {
  keyword: string
  latestRank: number | null
  latestAt: string | null
  history: Array<{ rank: number | null; checked_at: string }>
}

interface Summary {
  keywordCount: number
  ranked: number
  top3: number
  lastChecked: string | null
}

export default function MeoPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [clinicName, setClinicName] = useState('')
  const [meoUrl, setMeoUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/meo?days=90')
      .then((r) => r.json())
      .then((d) => {
        setKeywords(d.keywords || [])
        setSummary(d.summary || null)
        setClinicName(d.clinic?.name || '')
        setMeoUrl(d.meoAppUrl || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const rankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-500'
    if (rank <= 3) return 'text-green-400'
    if (rank <= 10) return 'text-blue-400'
    if (rank <= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
          <Link href="/?biz=seitai" className="hover:text-white">← 整体院タブへ戻る</Link>
          <span>/</span>
          <span>MEO順位</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">MEO順位ダッシュボード</h1>
          {meoUrl && (
            <a
              href={meoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded text-sm bg-purple-600 hover:bg-purple-500"
            >
              MEO勝ち上げくんで順位チェック→
            </a>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">{clinicName}</p>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <Stat label="キーワード数" value={summary.keywordCount} />
            <Stat label="10位以内" value={summary.ranked} highlight="blue" />
            <Stat label="3位以内" value={summary.top3} highlight="green" />
            <Stat label="最終チェック" value={summary.lastChecked ? formatDate(summary.lastChecked) : '—'} />
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : keywords.length === 0 ? (
          <p className="text-gray-400">順位データがありません。MEO勝ち上げくんで順位チェックを実行してください。</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-xs text-gray-400">
                <tr>
                  <th className="text-left p-3">キーワード</th>
                  <th className="text-center p-3 w-20">最新順位</th>
                  <th className="text-center p-3 w-24">最終</th>
                  <th className="text-left p-3">推移（最新30回）</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k) => (
                  <tr key={k.keyword} className="border-t border-gray-800 hover:bg-gray-850">
                    <td className="p-3 font-medium">{k.keyword}</td>
                    <td className={`p-3 text-center font-bold text-lg ${rankColor(k.latestRank)}`}>
                      {k.latestRank ?? '圏外'}
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">{formatDate(k.latestAt)}</td>
                    <td className="p-3">
                      <Sparkline data={k.history.map((h) => h.rank)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: 'blue' | 'green' }) {
  const color = highlight === 'green' ? 'text-green-300' : highlight === 'blue' ? 'text-blue-300' : 'text-white'
  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function Sparkline({ data }: { data: Array<number | null> }) {
  if (data.length === 0) return <span className="text-xs text-gray-500">データなし</span>
  const valid = data.map((v) => (v == null ? 100 : Math.min(v, 100)))
  const max = Math.max(...valid, 10)
  const w = 200
  const h = 30
  const step = data.length > 1 ? w / (data.length - 1) : w
  const points = valid.map((v, i) => {
    const x = i * step
    const y = (v / max) * h
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points={points.join(' ')} />
      {valid.map((v, i) => (
        <circle key={i} cx={i * step} cy={(v / max) * h} r="2" fill={v <= 3 ? '#10b981' : v <= 10 ? '#3b82f6' : '#f59e0b'} />
      ))}
    </svg>
  )
}

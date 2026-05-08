'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CategoryType = '整体' | '病院'

interface MapResult {
  position?: number
  title?: string
  rating?: number
  reviews?: number
  type?: string
  address?: string
  phone?: string
  website?: string
  place_id?: string
}

interface Snapshot {
  id: string
  symptom: string
  area: string
  category: CategoryType
  top_results: MapResult[]
  fetched_at: string
}

export default function CompetitorsPage() {
  const [snaps, setSnaps] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [progress, setProgress] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/competitors')
    const d = await r.json()
    setSnaps(d.snapshots || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const refreshAll = async () => {
    if (!confirm('全症状×整体／病院（最大18クエリ）を再取得します。よろしいですか？\nSerpAPI を消費します。')) return
    setRefreshing(true)
    setProgress('実行中…完了まで30〜60秒')
    try {
      const r = await fetch('/api/competitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const d = await r.json()
      if (!r.ok) {
        alert('失敗: ' + (d.error || ''))
      } else {
        setProgress(`${(d.results || []).length} 件取得しました`)
        await load()
      }
    } finally {
      setRefreshing(false)
      setTimeout(() => setProgress(''), 5000)
    }
  }

  const refreshOne = async (symptom: string, category: CategoryType) => {
    setRefreshing(true)
    try {
      const r = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom, category }),
      })
      const d = await r.json()
      if (!r.ok) alert('失敗: ' + (d.error || ''))
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  // symptom 別にまとめる
  const bySymptom: Record<string, Record<CategoryType, Snapshot | undefined>> = {}
  for (const s of snaps) {
    if (!bySymptom[s.symptom]) bySymptom[s.symptom] = { 整体: undefined, 病院: undefined }
    bySymptom[s.symptom][s.category] = s
  }

  const symptoms = Object.keys(bySymptom).sort()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/?biz=seitai" className="hover:text-gray-900">← 整体院タブへ戻る</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-gray-900">広告リサーチ</Link>
          <span>/</span>
          <span>競合MEO TOP5</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">競合院 MEO TOP5（症状別）</h1>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm"
          >
            {refreshing ? '取得中…' : '全症状を再取得'}
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-2">登録症状 × 整体／病院 で MEO地図結果TOP5 を取得</p>
        {progress && <p className="text-xs text-amber-700 mb-4">{progress}</p>}

        {loading ? (
          <p className="text-gray-500 mt-6">読み込み中…</p>
        ) : symptoms.length === 0 ? (
          <p className="text-gray-500 mt-6">スナップショットがありません。「全症状を再取得」を押してください。</p>
        ) : (
          <div className="space-y-6 mt-6">
            {symptoms.map((sym) => (
              <div key={sym} className="bg-white border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">{sym}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['整体', '病院'] as CategoryType[]).map((cat) => {
                    const snap = bySymptom[sym][cat]
                    return (
                      <div key={cat} className="bg-white border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${cat === '整体' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            {cat}
                          </h3>
                          <button
                            onClick={() => refreshOne(sym, cat)}
                            disabled={refreshing}
                            className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                          >
                            再取得
                          </button>
                        </div>
                        {snap ? (
                          <>
                            <ol className="space-y-2">
                              {(snap.top_results || []).map((r, i) => (
                                <li key={i} className="text-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-500 text-xs mt-0.5 w-4">{i + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{r.title}</div>
                                      <div className="text-xs text-gray-500 flex items-center gap-2">
                                        {r.rating != null && <span className="text-yellow-700">★ {r.rating}</span>}
                                        {r.reviews != null && <span>{r.reviews}件</span>}
                                        {r.type && <span className="truncate">{r.type}</span>}
                                      </div>
                                      {r.address && <div className="text-xs text-gray-500 truncate">{r.address}</div>}
                                      {r.website && (
                                        <a href={r.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate inline-block max-w-full">
                                          {r.website.replace(/^https?:\/\//, '').slice(0, 40)}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                            <p className="text-xs text-gray-500 mt-2">
                              取得: {new Date(snap.fetched_at).toLocaleString('ja-JP')}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">未取得</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

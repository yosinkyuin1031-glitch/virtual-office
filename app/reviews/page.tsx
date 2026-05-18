'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type ReplyStatus = 'unreplied' | 'draft' | 'approved' | 'posted' | 'skipped'

interface Review {
  id: string
  author_name: string | null
  rating: number
  review_text: string
  review_date: string | null
  fetched_at: string
  ai_reply_draft: string | null
  reply_text: string | null
  reply_status: ReplyStatus | null
  reply_generated_at: string | null
  llmo_keywords: { symptoms?: string[]; areas?: string[]; strengths?: string[] } | null
  owner_note: string | null
  owner_response_text: string | null
  owner_response_date: string | null
  last_synced_at: string | null
}

interface Summary {
  total: number
  avgRating: number
  unreplied: number
  draft: number
  approved: number
  posted: number
  low: number
}

const STATUS_LABEL: Record<ReplyStatus, { label: string; color: string }> = {
  unreplied: { label: '未生成', color: 'bg-gray-200 text-gray-700' },
  draft: { label: 'AI下書き', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '承認済', color: 'bg-blue-100 text-blue-700' },
  posted: { label: '投稿済', color: 'bg-green-100 text-green-700' },
  skipped: { label: 'スキップ', color: 'bg-gray-200 text-gray-500' },
}

type Filter = 'all' | 'unreplied' | 'replied' | 'low'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [clinicName, setClinicName] = useState('')
  const [filter, setFilter] = useState<Filter>('unreplied')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [bulkGen, setBulkGen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/reviews?filter=${filter}&limit=100`)
    const d = await r.json()
    setReviews(d.reviews || [])
    setSummary(d.summary || null)
    setClinicName(d.clinic?.name || '')
    setLoading(false)
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const generate = async (id: string) => {
    setGenerating(id)
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', review_id: id }),
      })
      const d = await r.json()
      if (!r.ok) alert('生成失敗: ' + (d.error || ''))
      await load()
    } finally {
      setGenerating(null)
    }
  }

  const gmbSync = async () => {
    if (!confirm('Googleマップから最新の口コミと返信状態を取得します（SerpAPIを使用）。よろしいですか？')) return
    setSyncing(true)
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gmb-sync', max_pages: 5 }),
      })
      const d = await r.json()
      if (!r.ok) {
        alert('同期失敗: ' + (d.error || ''))
      } else {
        alert(`同期完了\n取得: ${d.fetched || 0}件 / 新規: ${d.inserted || 0}件 / 更新: ${d.updated || 0}件`)
      }
      await load()
    } finally {
      setSyncing(false)
    }
  }

  const bulkGenerate = async () => {
    if (!confirm('未生成の口コミに一括でAI返信を作成します（最大20件）。よろしいですか？')) return
    setBulkGen(true)
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-generate' }),
      })
      const d = await r.json()
      alert(`${d.generated || 0}件 生成しました`)
      await load()
    } finally {
      setBulkGen(false)
    }
  }

  const startEdit = (rev: Review) => {
    setEditingId(rev.id)
    setEditText(rev.reply_text || '')
  }

  const saveEdit = async (id: string, status?: ReplyStatus) => {
    setSavingId(id)
    try {
      const body: Record<string, unknown> = { reply_text: editText }
      if (status) body.reply_status = status
      await fetch(`/api/reviews?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setEditingId(null)
      setEditText('')
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const updateStatus = async (id: string, status: ReplyStatus) => {
    setSavingId(id)
    try {
      await fetch(`/api/reviews?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_status: status }),
      })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/?biz=seitai" className="hover:text-gray-900">← 整体院タブへ戻る</Link>
          <span>/</span>
          <span>口コミ返信</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">Googleクチコミ返信</h1>
          <Link
            href="/keywords"
            className="text-sm px-3 py-1.5 rounded bg-gray-50 border border-gray-300 hover:bg-gray-100"
          >
            ⚙ キーワード設定
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-6">{clinicName} ／ LLMO・MEO最適化キーワード自動挿入</p>

        {summary && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            <Stat label="総件数" value={summary.total} />
            <Stat label="平均★" value={summary.avgRating.toFixed(2)} />
            <Stat label="未応答" value={summary.unreplied} highlight={summary.unreplied > 0 ? 'amber' : undefined} />
            <Stat label="AI下書き" value={summary.draft} highlight={summary.draft > 0 ? 'yellow' : undefined} />
            <Stat label="GMB返信済" value={summary.posted} highlight="blue" />
            <Stat label="低評価(≤3)" value={summary.low} highlight={summary.low > 0 ? 'red' : undefined} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['unreplied', 'low', 'replied', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm border ${
                filter === f ? 'bg-blue-600 border-blue-500' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {f === 'all' && '全件'}
              {f === 'unreplied' && 'GMB未応答'}
              {f === 'replied' && 'GMB返信済'}
              {f === 'low' && '低評価'}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={gmbSync}
              disabled={syncing}
              className="px-4 py-1.5 rounded text-sm bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
            >
              {syncing ? 'GMB同期中…' : 'GMBから最新を同期'}
            </button>
            <button
              onClick={bulkGenerate}
              disabled={bulkGen}
              className="px-4 py-1.5 rounded text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              {bulkGen ? '一括生成中…' : '未応答を一括AI生成（最大20）'}
            </button>
            <button onClick={load} className="px-3 py-1.5 rounded text-sm bg-gray-50 border border-gray-300 hover:bg-gray-100">
              更新
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">読み込み中…</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">該当する口コミがありません</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const status = (rev.reply_status as ReplyStatus) || 'unreplied'
              const stCfg = STATUS_LABEL[status]
              const hasGmbReply = !!(rev.owner_response_text && rev.owner_response_text.trim())
              return (
                <div key={rev.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-700 text-sm">{'★'.repeat(rev.rating || 0)}{'☆'.repeat(5 - (rev.rating || 0))}</span>
                        <span className="text-sm font-medium">{rev.author_name || '匿名'}</span>
                        <span className="text-xs text-gray-500">{rev.review_date || ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasGmbReply ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">GMB返信済</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">GMB未応答</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${stCfg.color}`}>{stCfg.label}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">{rev.review_text}</p>

                  {hasGmbReply && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-900">
                      <div className="font-medium mb-1">Google側オーナー返信（取得済）</div>
                      <p className="whitespace-pre-wrap leading-relaxed">{rev.owner_response_text}</p>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">院長返信（AI生成）</span>
                      {rev.llmo_keywords && (
                        <div className="flex flex-wrap gap-1 text-xs">
                          {[
                            ...(rev.llmo_keywords.symptoms || []),
                            ...(rev.llmo_keywords.areas || []),
                            ...(rev.llmo_keywords.strengths || []),
                          ]
                            .slice(0, 5)
                            .map((k, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {k}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {editingId === rev.id ? (
                      <>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full h-32 bg-white border border-gray-300 rounded p-2 text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEdit(rev.id, 'approved')}
                            disabled={savingId === rev.id}
                            className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                          >
                            保存して承認
                          </button>
                          <button
                            onClick={() => saveEdit(rev.id)}
                            disabled={savingId === rev.id}
                            className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                          >
                            下書き保存
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setEditText('')
                            }}
                            className="px-3 py-1 rounded text-sm bg-gray-50 hover:bg-gray-100"
                          >
                            キャンセル
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {rev.reply_text ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{rev.reply_text}</p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">未生成。「AI生成」で作成してください。</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {!rev.reply_text && (
                            <button
                              onClick={() => generate(rev.id)}
                              disabled={generating === rev.id}
                              className="px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                            >
                              {generating === rev.id ? '生成中…' : 'AI生成'}
                            </button>
                          )}
                          {rev.reply_text && (
                            <>
                              <button
                                onClick={() => generate(rev.id)}
                                disabled={generating === rev.id}
                                className="px-3 py-1 rounded text-sm bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
                              >
                                {generating === rev.id ? '再生成中…' : '再生成'}
                              </button>
                              <button
                                onClick={() => copy(rev.id, rev.reply_text || '')}
                                className="px-3 py-1 rounded text-sm bg-green-700 hover:bg-green-600"
                              >
                                {copiedId === rev.id ? 'コピー完了' : 'コピー'}
                              </button>
                              <button
                                onClick={() => startEdit(rev)}
                                className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                              >
                                編集
                              </button>
                              {status !== 'approved' && status !== 'posted' && (
                                <button
                                  onClick={() => updateStatus(rev.id, 'approved')}
                                  disabled={savingId === rev.id}
                                  className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                                >
                                  承認
                                </button>
                              )}
                              {status !== 'posted' && (
                                <button
                                  onClick={() => updateStatus(rev.id, 'posted')}
                                  disabled={savingId === rev.id}
                                  className="px-3 py-1 rounded text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50"
                                >
                                  投稿済にする
                                </button>
                              )}
                            </>
                          )}
                          <a
                            href="https://business.google.com/reviews"
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded text-sm bg-gray-50 border border-gray-300 hover:bg-gray-100 ml-auto"
                          >
                            GBPで返信→
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: 'amber' | 'yellow' | 'blue' | 'red' }) {
  const color =
    highlight === 'amber' ? 'text-amber-700'
      : highlight === 'yellow' ? 'text-yellow-700'
        : highlight === 'blue' ? 'text-blue-700'
          : highlight === 'red' ? 'text-red-700'
            : 'text-gray-900'
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  )
}

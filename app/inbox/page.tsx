'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface InboxItem {
  id: string
  source: 'vo_task' | 'threads'
  title: string
  body: string
  preview: string
  employeeName: string | null
  department: string | null
  businessUnit: string
  priority: string | null
  createdAt: string
  action: 'pending' | 'posted' | 'archived'
  destinations: { key: string; label: string; url: string; emoji: string }[]
  meta?: Record<string, unknown>
}

interface InboxResponse {
  items: InboxItem[]
  summary: {
    total: number
    pending: number
    posted: number
    archived: number
    byUnit: Record<string, number>
  }
}

const UNIT_TABS: { key: string; label: string; emoji: string }[] = [
  { key: 'all', label: 'すべて', emoji: '📥' },
  { key: '大口神経整体院', label: '整体院', emoji: '🏥' },
  { key: '晴陽鍼灸院', label: '訪問鍼灸', emoji: '🏠' },
  { key: 'アプリ事業', label: 'アプリ事業', emoji: '💻' },
  { key: '治療家コミュニティ・コンサル', label: 'コミュニティ', emoji: '🤝' },
  { key: '治療機器販売', label: '機器販売', emoji: '🔧' },
  { key: '経営本社', label: '経営', emoji: '🏢' },
]

const ACTION_TABS: { key: 'pending' | 'posted' | 'archived'; label: string }[] = [
  { key: 'pending', label: '未対応' },
  { key: 'posted', label: '投稿済' },
  { key: 'archived', label: '破棄' },
]

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMin = Math.round((now - d.getTime()) / 60000)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`
  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${diffDay}日前`
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

function InboxCard({
  item,
  onAction,
}: {
  item: InboxItem
  onAction: (id: string, source: string, action: 'posted' | 'archived' | 'reset') => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [working, setWorking] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = item.body
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyAndOpen = async (url: string) => {
    await handleCopy()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleAction = async (action: 'posted' | 'archived' | 'reset') => {
    setWorking(true)
    try {
      await onAction(item.id, item.source, action)
    } finally {
      setWorking(false)
    }
  }

  const priorityBadge = item.priority === 'high' ? (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">優先</span>
  ) : null

  const actionBadge = item.action === 'posted' ? (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">投稿済</span>
  ) : item.action === 'archived' ? (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">破棄</span>
  ) : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {item.businessUnit}
            </span>
            {item.employeeName && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {item.employeeName}
              </span>
            )}
            {priorityBadge}
            {actionBadge}
            <span className="text-[10px] text-gray-400">{relativeTime(item.createdAt)}</span>
          </div>
        </div>

        <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2">{item.title}</h4>

        <div
          className="text-xs text-gray-600 leading-relaxed cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg max-h-[60vh] overflow-y-auto text-[11px]">
              {item.body}
            </pre>
          ) : (
            <p className="text-[11px] text-gray-500">{item.preview}{item.body.length > 140 ? '...' : ''}</p>
          )}
          <span className="text-[10px] text-gray-400 mt-1 inline-block">
            {expanded ? '▲ 閉じる' : '▼ 全文を表示'}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleCopy}
            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
              copied
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {copied ? 'コピー済' : '📋 コピー'}
          </button>

          {item.destinations.map((d) => (
            <button
              key={d.key}
              onClick={() => handleCopyAndOpen(d.url)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
              title={`コピーして${d.label}を開く`}
            >
              {d.emoji} {d.label}
            </button>
          ))}

          <div className="flex-1" />

          {item.action === 'pending' ? (
            <>
              <button
                disabled={working}
                onClick={() => handleAction('posted')}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
              >
                ✓ 投稿済
              </button>
              <button
                disabled={working}
                onClick={() => handleAction('archived')}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                破棄
              </button>
            </>
          ) : (
            <button
              disabled={working}
              onClick={() => handleAction('reset')}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              ↩ 戻す
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [data, setData] = useState<InboxResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<'pending' | 'posted' | 'archived'>('pending')
  const [days, setDays] = useState(14)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/inbox?range=${days}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as InboxResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = useCallback(
    async (id: string, source: string, action: 'posted' | 'archived' | 'reset') => {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, source, action }),
      })
      if (!res.ok) {
        alert('更新に失敗しました')
        return
      }
      // 楽観的更新: 該当アイテムを更新
      setData((prev) => {
        if (!prev) return prev
        const newAction: InboxItem['action'] =
          action === 'posted' ? 'posted' : action === 'archived' ? 'archived' : 'pending'
        const items = prev.items.map((i) =>
          i.id === id && i.source === source ? { ...i, action: newAction } : i,
        )
        const summary = {
          total: items.length,
          pending: items.filter((i) => i.action === 'pending').length,
          posted: items.filter((i) => i.action === 'posted').length,
          archived: items.filter((i) => i.action === 'archived').length,
          byUnit: items.reduce<Record<string, number>>((acc, i) => {
            if (i.action !== 'pending') return acc
            acc[i.businessUnit] = (acc[i.businessUnit] ?? 0) + 1
            return acc
          }, {}),
        }
        return { items, summary }
      })
    },
    [],
  )

  const filteredItems = useMemo(() => {
    if (!data) return []
    return data.items.filter((i) => {
      if (i.action !== actionFilter) return false
      if (unitFilter !== 'all' && i.businessUnit !== unitFilter) return false
      return true
    })
  }, [data, actionFilter, unitFilter])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">← ホームへ</Link>
            <div className="flex items-center gap-2">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value={3}>過去3日</option>
                <option value={7}>過去7日</option>
                <option value={14}>過去14日</option>
                <option value={30}>過去30日</option>
              </select>
              <button
                onClick={fetchData}
                className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                🔄 更新
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📥 アウトプット受信箱
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            AI社員が作った原稿をここに集約。コピー → 投稿先を開いて貼り付け → 投稿済をマーク。
          </p>
        </div>

        {/* サマリー */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{data.summary.pending}</div>
              <div className="text-[10px] text-gray-500">未対応</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.posted}</div>
              <div className="text-[10px] text-gray-500">投稿済</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-gray-400">{data.summary.archived}</div>
              <div className="text-[10px] text-gray-500">破棄</div>
            </div>
          </div>
        )}

        {/* アクションタブ */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {ACTION_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActionFilter(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                actionFilter === t.key
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {data && t.key === 'pending' && data.summary.pending > 0 && (
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-full">
                  {data.summary.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 事業タブ */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto">
          {UNIT_TABS.map((t) => {
            const count = data && t.key !== 'all' ? (data.summary.byUnit[t.key] ?? 0) : data?.summary.pending ?? 0
            return (
              <button
                key={t.key}
                onClick={() => setUnitFilter(t.key)}
                className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${
                  unitFilter === t.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.emoji} {t.label}
                {actionFilter === 'pending' && count > 0 && unitFilter !== t.key && (
                  <span className="ml-1 text-[10px] opacity-70">({count})</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 一覧 */}
        {loading && <div className="text-center text-sm text-gray-400 py-8">読み込み中...</div>}
        {error && (
          <div className="text-center text-sm text-red-500 py-8">
            エラー: {error}
            <button onClick={fetchData} className="ml-2 underline">再試行</button>
          </div>
        )}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-12">
            該当する原稿はありません
          </div>
        )}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <InboxCard key={`${item.source}-${item.id}`} item={item} onAction={handleAction} />
          ))}
        </div>
      </div>
    </div>
  )
}

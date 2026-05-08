'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface ContextItem {
  id: string
  business_id: string
  category: string
  title: string
  content: string
  tags: string[]
  effective_until: string | null
  status: 'active' | 'expired' | 'archived'
  source: string
  pinned: boolean
  created_at: string
  updated_at: string
  _stale?: boolean
}

const BIZ_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '共通（全事業）' },
  { value: 'seitai', label: '🏥 整体院' },
  { value: 'houmon', label: '🏠 訪問鍼灸' },
  { value: 'app-biz', label: '📱 アプリ事業' },
  { value: 'consulting', label: '🧭 コンサル' },
  { value: 'device', label: '🔧 機器販売' },
]

const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'kpi', label: '目標・KPI・実績', emoji: '🎯' },
  { value: 'campaign', label: '進行中キャンペーン', emoji: '🎁' },
  { value: 'closing', label: 'クロージング進行中', emoji: '🔥' },
  { value: 'competitor', label: '競合動向', emoji: '👀' },
  { value: 'priority', label: '優先事項・直近フォーカス', emoji: '⚡' },
  { value: 'note', label: '注意事項・メモ', emoji: '📝' },
]

const bizLabel = (id: string) => BIZ_OPTIONS.find(b => b.value === id)?.label || id
const catLabel = (id: string) => {
  const c = CATEGORY_OPTIONS.find(x => x.value === id)
  return c ? `${c.emoji} ${c.label}` : id
}

export default function ContextPage() {
  const [items, setItems] = useState<ContextItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ biz: string; cat: string; status: string }>({ biz: '', cat: '', status: 'active' })
  const [editing, setEditing] = useState<ContextItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.biz) params.set('business_id', filter.biz)
    if (filter.cat) params.set('category', filter.cat)
    if (filter.status) params.set('status', filter.status)
    const r = await fetch('/api/context-items?' + params)
    const d = await r.json()
    setItems(d.items || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const i of items) c[i.category] = (c[i.category] || 0) + 1
    return c
  }, [items])

  const save = async (data: Partial<ContextItem>, id?: string) => {
    setBusy('save')
    try {
      if (id) {
        await fetch(`/api/context-items?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      } else {
        await fetch('/api/context-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      }
      setEditing(null)
      setShowCreate(false)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const togglePin = async (id: string, pinned: boolean) => {
    setBusy(id)
    try {
      await fetch(`/api/context-items?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned: !pinned }) })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const archive = async (id: string) => {
    if (!confirm('アーカイブしますか？')) return
    setBusy(id)
    try {
      await fetch(`/api/context-items?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'archived' }) })
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">← ホーム</Link>
          <span>/</span>
          <span>コンテキスト</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">🎯 コンテキスト（現在状況）</h1>
          <div className="flex gap-2">
            <Link href="/knowledge" className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">
              📚 ナレッジへ
            </Link>
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white">
              + 新規追加
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-4">今の状況。古いものは自動的にグレーアウト</p>

        {/* フィルタ */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={filter.biz} onChange={e => setFilter({ ...filter, biz: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option value="">全事業</option>
              {BIZ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filter.cat} onChange={e => setFilter({ ...filter, cat: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option value="">全カテゴリ</option>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
            </select>
            <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option value="active">アクティブ</option>
              <option value="archived">アーカイブ</option>
              <option value="all">すべて</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
            {CATEGORY_OPTIONS.map(c => (counts[c.value] || 0) > 0 && (
              <button key={c.value} onClick={() => setFilter({ ...filter, cat: c.value })} className="px-2 py-1 rounded bg-gray-100 hover:bg-blue-50 text-gray-700">
                {c.emoji} {c.label} <span className="text-gray-500">({counts[c.value]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 一覧 */}
        {loading ? (
          <p className="text-gray-500">読み込み中…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
            コンテキストがありません
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`bg-white border rounded-lg p-4 ${item._stale || item.status !== 'active' ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.pinned && <span className="text-xs">📌</span>}
                      <h3 className="text-base font-bold">{item.title}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{catLabel(item.category)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{bizLabel(item.business_id)}</span>
                      {item._stale && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">⚠️ 期限切れ</span>}
                      {item.status === 'archived' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">アーカイブ</span>}
                    </div>
                    {item.effective_until && (
                      <p className="text-[10px] text-gray-500">有効期限: {item.effective_until}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => togglePin(item.id, item.pinned)} disabled={busy === item.id} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">{item.pinned ? '📌' : '📍'}</button>
                    <button onClick={() => setEditing(item)} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">編集</button>
                    {item.status === 'active' && (
                      <button onClick={() => archive(item.id)} disabled={busy === item.id} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-amber-50 text-amber-700 disabled:opacity-50">アーカイブ</button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.content.slice(0, 500)}{item.content.length > 500 ? '…' : ''}</p>
                <p className="text-[10px] text-gray-400 mt-2">更新: {new Date(item.updated_at).toLocaleString('ja-JP')}</p>
              </div>
            ))}
          </div>
        )}

        {(editing || showCreate) && (
          <ContextEditor
            item={editing}
            onClose={() => { setEditing(null); setShowCreate(false) }}
            onSave={(data, id) => save(data, id)}
            busy={busy === 'save'}
          />
        )}
      </div>
    </div>
  )
}

function ContextEditor({ item, onClose, onSave, busy }: {
  item: ContextItem | null
  onClose: () => void
  onSave: (data: Partial<ContextItem>, id?: string) => void
  busy: boolean
}) {
  const [form, setForm] = useState({
    business_id: item?.business_id || 'all',
    category: item?.category || 'priority',
    title: item?.title || '',
    content: item?.content || '',
    tags: (item?.tags || []).join(', '),
    effective_until: item?.effective_until || '',
    pinned: item?.pinned || false,
  })

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('タイトルと本文は必須です')
      return
    }
    const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean)
    onSave({
      business_id: form.business_id,
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      tags,
      effective_until: form.effective_until || null,
      pinned: form.pinned,
    }, item?.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">{item ? 'コンテキストを編集' : 'コンテキストを新規追加'}</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">事業</label>
              <select value={form.business_id} onChange={e => setForm({ ...form, business_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                {BIZ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">カテゴリ</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">タイトル</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">本文</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">タグ（カンマ区切り）</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">有効期限（任意・古くなったらグレーアウト）</label>
              <input type="date" value={form.effective_until} onChange={e => setForm({ ...form, effective_until: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
            <span>📌 ピン留め</span>
          </label>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200">キャンセル</button>
          <button onClick={submit} disabled={busy} className="px-4 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
            {busy ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

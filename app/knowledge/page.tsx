'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface KnowledgeItem {
  id: string
  business_id: string
  category: string
  title: string
  content: string
  tags: string[]
  source: string
  source_ref: string | null
  pinned: boolean
  active: boolean
  created_at: string
  updated_at: string
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
  { value: 'identity', label: '理念・哲学', emoji: '🌟' },
  { value: 'persona', label: '人物・お客様像', emoji: '👤' },
  { value: 'method', label: '施術・治療法', emoji: '🩺' },
  { value: 'episode', label: '患者エピソード', emoji: '💬' },
  { value: 'symptom', label: '症状解説', emoji: '📖' },
  { value: 'product', label: '商品・メニュー', emoji: '📦' },
  { value: 'talk', label: 'トーク台本', emoji: '🎙️' },
  { value: 'manual', label: '運用マニュアル', emoji: '📋' },
  { value: 'reference', label: '参考リンク', emoji: '🔗' },
  { value: 'sns', label: 'SNS情報', emoji: '📱' },
  { value: 'misc', label: 'その他', emoji: '📂' },
]

const bizLabel = (id: string) => BIZ_OPTIONS.find(b => b.value === id)?.label || id
const catLabel = (id: string) => {
  const c = CATEGORY_OPTIONS.find(x => x.value === id)
  return c ? `${c.emoji} ${c.label}` : id
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ biz: string; cat: string; q: string }>({ biz: '', cat: '', q: '' })
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.biz) params.set('business_id', filter.biz)
    if (filter.cat) params.set('category', filter.cat)
    if (filter.q) params.set('q', filter.q)
    const r = await fetch('/api/knowledge?' + params)
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

  const save = async (data: Partial<KnowledgeItem>, id?: string) => {
    setBusy('save')
    try {
      if (id) {
        await fetch(`/api/knowledge?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      } else {
        await fetch('/api/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
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
      await fetch(`/api/knowledge?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned: !pinned }) })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('削除しますか？')) return
    setBusy(id)
    try {
      await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
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
          <span>ナレッジベース</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">📚 ナレッジベース</h1>
          <div className="flex gap-2">
            <Link href="/context" className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">
              🎯 コンテキストへ
            </Link>
            <Link href="/inbox?type=imports" className="px-3 py-1.5 rounded text-sm bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800">
              📥 承認待ち
            </Link>
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white">
              + 新規追加
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-4">永続的な知見・ノウハウ。AIプロンプトに自動注入されます</p>

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
            <input value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} placeholder="検索（タイトル・本文）" className="px-3 py-2 border border-gray-300 rounded text-sm" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
            <button onClick={() => setFilter({ biz: '', cat: '', q: '' })} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">クリア</button>
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
            該当するナレッジがありません
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.pinned && <span className="text-xs">📌</span>}
                      <h3 className="text-base font-bold">{item.title}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{catLabel(item.category)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{bizLabel(item.business_id)}</span>
                      {item.source !== 'manual' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">{item.source}</span>
                      )}
                    </div>
                    {item.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1">
                        {item.tags.map((t, i) => <span key={i} className="text-[10px] text-gray-500">#{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => togglePin(item.id, item.pinned)} disabled={busy === item.id} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100" title={item.pinned ? 'ピン外す' : 'ピン留め'}>{item.pinned ? '📌' : '📍'}</button>
                    <button onClick={() => setEditing(item)} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">編集</button>
                    <button onClick={() => remove(item.id)} disabled={busy === item.id} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-red-50 text-red-600 disabled:opacity-50">削除</button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.content.slice(0, 600)}{item.content.length > 600 ? '…' : ''}</p>
                <p className="text-[10px] text-gray-400 mt-2">更新: {new Date(item.updated_at).toLocaleString('ja-JP')}</p>
              </div>
            ))}
          </div>
        )}

        {/* 編集モーダル */}
        {(editing || showCreate) && (
          <KnowledgeEditor
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

function KnowledgeEditor({ item, onClose, onSave, busy }: {
  item: KnowledgeItem | null
  onClose: () => void
  onSave: (data: Partial<KnowledgeItem>, id?: string) => void
  busy: boolean
}) {
  const [form, setForm] = useState({
    business_id: item?.business_id || 'all',
    category: item?.category || 'identity',
    title: item?.title || '',
    content: item?.content || '',
    tags: (item?.tags || []).join(', '),
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
      pinned: form.pinned,
    }, item?.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">{item ? 'ナレッジを編集' : 'ナレッジを新規追加'}</h2>
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
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">タグ（カンマ区切り）</label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="例: 神経整体, 大口陽平, 哲学" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
            <span>📌 ピン留め（一覧の先頭に表示）</span>
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

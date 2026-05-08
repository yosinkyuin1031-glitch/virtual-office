'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Classification {
  type?: 'knowledge' | 'context' | 'task'
  business_id?: string
  category?: string
  title?: string
  content_proposal?: string
  tags?: string[]
  reasoning?: string
  effective_until?: string
}

interface PendingImport {
  id: string
  source: string
  source_ref: string | null
  raw_content: string
  ai_classification: Classification | null
  status: 'pending' | 'approved' | 'rejected' | 'archived'
  reviewed_at: string | null
  reviewed_note: string | null
  result_id: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: '承認待ち', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  approved: { label: '承認済', color: 'bg-green-100 text-green-800 border-green-300' },
  rejected: { label: '却下', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  archived: { label: 'アーカイブ', color: 'bg-gray-100 text-gray-500 border-gray-300' },
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  knowledge: { label: '📚 ナレッジ', color: 'bg-blue-100 text-blue-700' },
  context: { label: '🎯 コンテキスト', color: 'bg-green-100 text-green-700' },
  task: { label: '✅ タスク', color: 'bg-purple-100 text-purple-700' },
}

const BIZ_OPTIONS = [
  { value: 'all', label: '全社共通' },
  { value: 'seitai', label: '🏥 整体院' },
  { value: 'houmon', label: '🏠 訪問鍼灸' },
  { value: 'app-biz', label: '📱 アプリ事業' },
  { value: 'consulting', label: '🧭 コンサル' },
  { value: 'device', label: '🔧 機器販売' },
]

export default function ImportsPage() {
  const [items, setItems] = useState<PendingImport[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'archived' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Classification>({})

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/pending-imports?status=${filter}`)
    const d = await r.json()
    setItems(d.items || [])
    setLoading(false)
  }, [filter])
  useEffect(() => { load() }, [load])

  const startEdit = (item: PendingImport) => {
    setEditing(item.id)
    setEditForm(item.ai_classification || {})
  }

  const updateClassification = async (id: string) => {
    setBusy(id)
    try {
      await fetch(`/api/pending-imports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_classification', ai_classification: editForm }),
      })
      setEditing(null)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const approve = async (id: string, classification?: Classification) => {
    setBusy(id)
    try {
      const r = await fetch(`/api/pending-imports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ai_classification: classification }),
      })
      const d = await r.json()
      if (!r.ok) alert('承認失敗: ' + (d.error || ''))
      setEditing(null)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id: string) => {
    if (!confirm('却下しますか？')) return
    setBusy(id)
    try {
      await fetch(`/api/pending-imports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">← ホーム</Link>
          <span>/</span>
          <span>承認待ち</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">📥 承認待ち（Plaud等）</h1>
        <p className="text-gray-500 text-sm mb-4">録音や外部データのAI分類結果を承認・却下・編集</p>

        <div className="flex gap-2 mb-4">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            >
              {f === 'all' ? 'すべて' : STATUS_LABEL[f]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">読み込み中…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
            該当するアイテムはありません
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const cls = item.ai_classification
              const isEditing = editing === item.id
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_LABEL[item.status].color}`}>
                        {STATUS_LABEL[item.status].label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.source}
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleString('ja-JP')}</span>
                    </div>
                  </div>

                  {/* AI分類結果 */}
                  {cls && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <p className="text-[10px] text-blue-700 font-bold mb-2">🤖 AI分類案</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <select value={editForm.type || ''} onChange={e => setEditForm({ ...editForm, type: e.target.value as 'knowledge' | 'context' | 'task' })} className="px-2 py-1 border border-gray-300 rounded text-sm">
                              <option value="knowledge">📚 ナレッジ</option>
                              <option value="context">🎯 コンテキスト</option>
                              <option value="task">✅ タスク</option>
                            </select>
                            <select value={editForm.business_id || ''} onChange={e => setEditForm({ ...editForm, business_id: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm">
                              {BIZ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <input value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="カテゴリ" className="px-2 py-1 border border-gray-300 rounded text-sm" />
                          </div>
                          <input value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="タイトル" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                          <textarea value={editForm.content_proposal || ''} onChange={e => setEditForm({ ...editForm, content_proposal: e.target.value })} rows={6} placeholder="本文" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                          <div className="flex gap-2">
                            <button onClick={() => updateClassification(item.id)} disabled={busy === item.id} className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50">分類だけ保存</button>
                            <button onClick={() => approve(item.id, editForm)} disabled={busy === item.id} className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-50">編集内容で承認</button>
                            <button onClick={() => setEditing(null)} className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {cls.type && <span className={`text-[11px] px-2 py-0.5 rounded ${TYPE_LABEL[cls.type]?.color || ''}`}>{TYPE_LABEL[cls.type]?.label}</span>}
                            {cls.business_id && <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{BIZ_OPTIONS.find(o => o.value === cls.business_id)?.label || cls.business_id}</span>}
                            {cls.category && <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{cls.category}</span>}
                          </div>
                          {cls.title && <h4 className="font-bold text-sm mb-1">{cls.title}</h4>}
                          {cls.content_proposal && <p className="text-xs text-gray-700 whitespace-pre-wrap">{cls.content_proposal.slice(0, 400)}{cls.content_proposal.length > 400 ? '…' : ''}</p>}
                          {cls.tags && cls.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {cls.tags.map((t, i) => <span key={i} className="text-[10px] text-blue-700">#{t}</span>)}
                            </div>
                          )}
                          {cls.reasoning && <p className="text-[10px] text-gray-500 italic mt-1">💭 {cls.reasoning}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 元の文字起こし */}
                  <details className="mb-2">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">▸ 元の文字起こしを見る ({item.raw_content.length}文字)</summary>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-2 bg-gray-50 p-2 rounded">{item.raw_content}</pre>
                  </details>

                  {/* アクションボタン */}
                  {item.status === 'pending' && !isEditing && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(item.id)} disabled={busy === item.id} className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-50">
                        ✓ そのまま承認
                      </button>
                      <button onClick={() => startEdit(item)} className="px-3 py-1.5 rounded text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700">
                        編集して承認
                      </button>
                      <button onClick={() => reject(item.id)} disabled={busy === item.id} className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                        ✕ 却下
                      </button>
                    </div>
                  )}
                  {item.status === 'approved' && item.result_id && (
                    <p className="text-xs text-green-700">✓ 承認済 → ID: {item.result_id.slice(0, 8)}...</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

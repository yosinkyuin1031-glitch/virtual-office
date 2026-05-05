'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Category = 'symptom' | 'area' | 'strength'

interface KW {
  id: string
  category: Category
  keyword: string
  active: boolean
  sort_order: number
}

const CAT_LABEL: Record<Category, { label: string; description: string; color: string }> = {
  symptom: { label: '症状ワード', description: '口コミ本文に症状の言及がある場合のみ返信に挿入', color: 'bg-rose-600' },
  area: { label: '地域ワード', description: '返信に必ず1つ自然に挿入される', color: 'bg-blue-600' },
  strength: { label: '強みワード', description: '返信に1つ自然に挿入される（神経整体・検査など）', color: 'bg-emerald-600' },
}

export default function KeywordsPage() {
  const [data, setData] = useState<Record<Category, KW[]>>({ symptom: [], area: [], strength: [] })
  const [loading, setLoading] = useState(true)
  const [newKw, setNewKw] = useState<Record<Category, string>>({ symptom: '', area: '', strength: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/keywords')
    const d = await r.json()
    setData(d.keywords || { symptom: [], area: [], strength: [] })
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const add = async (cat: Category) => {
    const kw = newKw[cat].trim()
    if (!kw) return
    setBusy('add-' + cat)
    try {
      await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, keyword: kw }),
      })
      setNewKw({ ...newKw, [cat]: '' })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const toggle = async (id: string, active: boolean) => {
    setBusy(id)
    try {
      await fetch(`/api/keywords?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('このキーワードを削除しますか？')) return
    setBusy(id)
    try {
      await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const startEdit = (kw: KW) => {
    setEditingId(kw.id)
    setEditText(kw.keyword)
  }

  const saveEdit = async (id: string) => {
    setBusy(id)
    try {
      await fetch(`/api/keywords?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: editText }),
      })
      setEditingId(null)
      setEditText('')
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">← ホーム</Link>
          <span>/</span>
          <Link href="/reviews" className="hover:text-white">口コミ返信</Link>
          <span>/</span>
          <span>キーワード設定</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">LLMO・MEOキーワード設定</h1>
        <p className="text-gray-400 text-sm mb-6">
          口コミ返信に自然挿入されるキーワード。AI検索（ChatGPT/Gemini）で引用される際の手がかりになります。
        </p>

        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : (
          <div className="space-y-6">
            {(['symptom', 'area', 'strength'] as Category[]).map((cat) => {
              const cfg = CAT_LABEL[cat]
              const list = data[cat] || []
              return (
                <div key={cat} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`}></span>
                    <h2 className="font-semibold">{cfg.label}</h2>
                    <span className="text-xs text-gray-500">{list.filter((k) => k.active).length} / {list.length} 有効</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{cfg.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {list.map((kw) => (
                      <div
                        key={kw.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm border ${
                          kw.active ? 'bg-gray-800 border-gray-700' : 'bg-gray-950 border-gray-800 opacity-50 line-through'
                        }`}
                      >
                        {editingId === kw.id ? (
                          <>
                            <input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="bg-gray-900 border border-gray-700 rounded px-1 text-sm w-32"
                              autoFocus
                            />
                            <button onClick={() => saveEdit(kw.id)} className="text-blue-400 text-xs ml-1">保存</button>
                            <button onClick={() => { setEditingId(null); setEditText('') }} className="text-gray-500 text-xs ml-1">×</button>
                          </>
                        ) : (
                          <>
                            <span>{kw.keyword}</span>
                            <button
                              onClick={() => startEdit(kw)}
                              className="text-gray-400 hover:text-white text-xs ml-1"
                              title="編集"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => toggle(kw.id, kw.active)}
                              className="text-gray-400 hover:text-yellow-400 text-xs ml-1"
                              title={kw.active ? '無効化' : '有効化'}
                            >
                              {kw.active ? '⏸' : '▶'}
                            </button>
                            <button
                              onClick={() => remove(kw.id)}
                              disabled={busy === kw.id}
                              className="text-gray-400 hover:text-red-400 text-xs ml-1 disabled:opacity-50"
                              title="削除"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKw[cat]}
                      onChange={(e) => setNewKw({ ...newKw, [cat]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && add(cat)}
                      placeholder={`新しい${cfg.label}を追加`}
                      className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
                    />
                    <button
                      onClick={() => add(cat)}
                      disabled={busy === 'add-' + cat || !newKw[cat].trim()}
                      className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                    >
                      追加
                    </button>
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

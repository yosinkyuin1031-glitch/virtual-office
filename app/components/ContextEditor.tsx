'use client'

import { useState, useEffect, useCallback } from 'react'

interface ContextItem {
  id: string
  category: string
  title: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { key: 'mission_vision', label: 'ミッション・ビジョン', icon: '🧭' },
  { key: 'focus', label: '重点施策', icon: '🎯' },
  { key: 'yearly', label: '年度目標', icon: '📅' },
  { key: 'rules', label: 'ルール・方針', icon: '📋' },
  { key: 'other', label: 'その他', icon: '💬' },
]

interface ContextEditorProps {
  fullPage?: boolean
}

export default function ContextEditor({ fullPage = false }: ContextEditorProps) {
  const [contexts, setContexts] = useState<ContextItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('mission_vision')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const fetchContexts = useCallback(async () => {
    try {
      const res = await fetch('/api/context')
      const data = await res.json()
      setContexts(data.contexts || [])
    } catch {
      console.error('Failed to fetch contexts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContexts()
  }, [fetchContexts])

  const filtered = contexts.filter(c => c.category === activeTab)

  const startEdit = (item: ContextItem) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditContent(item.content)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await fetch('/api/context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, title: editTitle, content: editContent }),
      })
      setEditingId(null)
      showToast('保存しました')
      fetchContexts()
    } catch {
      showToast('保存に失敗しました')
    }
  }

  const addContext = async () => {
    if (!newTitle || !newContent) return
    try {
      await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab, title: newTitle, content: newContent, sort_order: filtered.length + 1 }),
      })
      setNewTitle('')
      setNewContent('')
      setShowAdd(false)
      showToast('追加しました')
      fetchContexts()
    } catch {
      showToast('追加に失敗しました')
    }
  }

  const deleteContext = async (id: string) => {
    if (!confirm('この項目を削除しますか？')) return
    try {
      await fetch(`/api/context?id=${id}`, { method: 'DELETE' })
      showToast('削除しました')
      fetchContexts()
    } catch {
      showToast('削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
        <p className="text-sm text-gray-400 text-center">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      <div className={`bg-white rounded-xl border border-amber-200 ${fullPage ? 'p-6' : 'p-5'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${fullPage ? 'text-base' : 'text-sm'} font-bold text-gray-800 flex items-center gap-2`}>
            <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
            事業方針・コンテキスト
          </h3>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${
              isEditMode
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isEditMode ? '完了' : '✏️ 編集'}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4 border-b border-gray-100 pb-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setActiveTab(cat.key); setEditingId(null); setShowAdd(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap ${
                activeTab === cat.key
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200 font-medium'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filtered.length === 0 && !showAdd && (
            <p className="text-sm text-gray-400 text-center py-4">このカテゴリにはまだ項目がありません</p>
          )}

          {filtered.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-lg p-4 hover:bg-amber-50/30 transition">
              {editingId === item.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full text-sm font-bold border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="タイトル"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                    placeholder="内容"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.content}</p>
                    </div>
                    {isEditMode && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteContext(item.id)}
                          className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add button */}
          {isEditMode && !showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full border-2 border-dashed border-amber-200 rounded-lg p-3 text-amber-400 hover:text-amber-600 hover:border-amber-400 transition text-sm"
            >
              + 新規追加
            </button>
          )}

          {/* Add form */}
          {showAdd && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full text-sm font-bold border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="タイトル"
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={3}
                className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                placeholder="内容"
              />
              <div className="flex gap-2">
                <button
                  onClick={addContext}
                  className="px-4 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                >
                  追加
                </button>
                <button
                  onClick={() => { setShowAdd(false); setNewTitle(''); setNewContent('') }}
                  className="px-4 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

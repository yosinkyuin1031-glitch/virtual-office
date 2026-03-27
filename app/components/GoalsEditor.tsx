'use client'

import { useState, useEffect, useCallback } from 'react'

interface Goal {
  id: string
  key: string
  label: string
  value: string
  category: string
  sort_order: number
  updated_at: string
}

interface GoalsEditorProps {
  fullPage?: boolean
}

export default function GoalsEditor({ fullPage = false }: GoalsEditorProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editValue, setEditValue] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.goals || [])
    } catch {
      console.error('Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setEditLabel(goal.label)
    setEditValue(goal.value)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, label: editLabel, value: editValue }),
      })
      setEditingId(null)
      showToast('保存しました')
      fetchGoals()
    } catch {
      showToast('保存に失敗しました')
    }
  }

  const addGoal = async () => {
    if (!newKey || !newLabel || !newValue) return
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, label: newLabel, value: newValue, sort_order: goals.length + 1 }),
      })
      setNewKey('')
      setNewLabel('')
      setNewValue('')
      setShowAdd(false)
      showToast('追加しました')
      fetchGoals()
    } catch {
      showToast('追加に失敗しました')
    }
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('このKPIを削除しますか？')) return
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
      showToast('削除しました')
      fetchGoals()
    } catch {
      showToast('削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm text-gray-400 text-center">読み込み中...</p>
      </div>
    )
  }

  // KPI icons based on label keywords
  const getIcon = (label: string) => {
    if (label.includes('売上') || label.includes('月商')) return '💰'
    if (label.includes('訪問')) return '🏠'
    if (label.includes('導入') || label.includes('院数')) return '🏥'
    if (label.includes('プロダクト') || label.includes('アプリ')) return '📱'
    if (label.includes('物販') || label.includes('サブスク')) return '🛒'
    if (label.includes('会員')) return '🔄'
    if (label.includes('MRR') || label.includes('収益')) return '📈'
    if (label.includes('単価')) return '⬆️'
    return '📊'
  }

  const kpiColors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#EC4899']

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <div className={`bg-white rounded-xl border border-gray-200 ${fullPage ? 'p-6' : 'p-5'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${fullPage ? 'text-base' : 'text-sm'} font-bold text-gray-800 flex items-center gap-2`}>
            <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
            目標・KPI
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

        <div className={`grid ${fullPage ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
          {goals.map((goal, idx) => (
            <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative">
              {editingId === goal.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    className="w-full text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="ラベル"
                  />
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold"
                    placeholder="値"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 text-xs px-2 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 text-xs px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getIcon(goal.label)}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{goal.label}</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: kpiColors[idx % kpiColors.length] }}>{goal.value}</p>
                  {isEditMode && (
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => startEdit(goal)}
                        className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add new button */}
          {isEditMode && !showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="border-2 border-dashed border-amber-200 rounded-xl p-4 flex items-center justify-center text-amber-400 hover:text-amber-600 hover:border-amber-400 transition"
            >
              <span className="text-2xl">+</span>
            </button>
          )}

          {/* Add form */}
          {showAdd && (
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-2">
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="w-full text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="キー（英数字）"
              />
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="w-full text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="ラベル名"
              />
              <input
                type="text"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="w-full text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold"
                placeholder="値"
              />
              <div className="flex gap-2">
                <button
                  onClick={addGoal}
                  className="flex-1 text-xs px-2 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                >
                  追加
                </button>
                <button
                  onClick={() => { setShowAdd(false); setNewKey(''); setNewLabel(''); setNewValue('') }}
                  className="flex-1 text-xs px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
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

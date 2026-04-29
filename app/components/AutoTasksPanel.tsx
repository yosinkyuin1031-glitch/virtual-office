'use client'

import { useState, useEffect, useCallback } from 'react'

interface Task {
  id: string
  department: string
  employee_name: string | null
  title: string
  description: string
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  batch_id: string
  generated_by: string | null
  created_at: string
  completed_at: string | null
  completion_note: string | null
}

const priorityConfig = {
  high: { label: '高', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  normal: { label: '中', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  low: { label: '低', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}

const priorityOrder: Array<'high' | 'normal' | 'low'> = ['high', 'normal', 'low']

const statusConfig = {
  pending: { label: '未着手', icon: '○', color: '#9CA3AF' },
  in_progress: { label: '進行中', icon: '◉', color: '#3B82F6' },
  completed: { label: '完了', icon: '✓', color: '#22C55E' },
  cancelled: { label: 'キャンセル', icon: '×', color: '#9CA3AF' },
}

const departmentColors: Record<string, string> = {
  '経営層': '#FFD700',
  '財務部': '#00C853',
  '整体院事業部': '#1565C0',
  '訪問鍼灸事業部': '#2E7D32',
  'AI開発部': '#263238',
  'BtoB営業部': '#FF6F00',
  'マーケティング部': '#E91E63',
  'LP・Web制作部': '#9C27B0',
  'メディア部': '#311B92',
  '動画・デザイン制作部': '#795548',
  'プロダクト管理部': '#00796B',
  'カスタマーサクセス部': '#26C6DA',
}

export default function AutoTasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<string>('active')
  const [toast, setToast] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDept, setNewDept] = useState('経営層')
  const [newPriority, setNewPriority] = useState<'high' | 'normal' | 'low'>('normal')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchTasks = useCallback(async () => {
    try {
      const status = filter === 'active' ? 'pending' : filter === 'completed' ? 'completed' : 'all'
      const params = filter === 'active' ? '?status=pending' : filter === 'completed' ? '?status=completed' : ''
      const res = await fetch(`/api/auto-tasks${params}`)
      const data = await res.json()
      if (filter === 'active') {
        const res2 = await fetch('/api/auto-tasks?status=in_progress')
        const data2 = await res2.json()
        setTasks([...(data.tasks || []), ...(data2.tasks || [])])
      } else {
        setTasks(data.tasks || [])
      }
    } catch {
      console.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 初回表示時に全部署を開く
  useEffect(() => {
    if (tasks.length > 0 && expandedDepts.size === 0) {
      const depts = new Set(tasks.map(t => t.department))
      setExpandedDepts(depts)
    }
  }, [tasks, expandedDepts.size])

  const generateTasks = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/auto-tasks', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        showToast(`エラー: ${data.error}`)
      } else {
        showToast(`${data.count}件のタスクを自動生成しました`)
        fetchTasks()
      }
    } catch {
      showToast('タスク生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/auto-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      fetchTasks()
    } catch {
      showToast('更新に失敗しました')
    }
  }

  const updatePriority = async (id: string, priority: string) => {
    try {
      await fetch('/api/auto-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, priority }),
      })
      fetchTasks()
    } catch {
      showToast('更新に失敗しました')
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/auto-tasks?id=${id}`, { method: 'DELETE' })
      showToast('タスクを削除しました')
      fetchTasks()
    } catch {
      showToast('削除に失敗しました')
    }
  }

  const addTask = async () => {
    if (!newTitle.trim()) return
    try {
      const now = new Date()
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      const today = jstNow.toISOString().split('T')[0]

      const res = await fetch('/api/auto-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // PUTはupdate用なので、直接Supabaseに挿入するPOSTエンドポイントを使う代わりに
          // 既存のGETに対して別途insertする
        }),
      })
      // PUTではinsertできないので、直接fetchでinsert
      const insertRes = await fetch('/api/auto-tasks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          department: newDept,
          priority: newPriority,
          due_date: today,
        }),
      })
      if (insertRes.ok) {
        showToast('タスクを追加しました')
        setNewTitle('')
        setShowAdd(false)
        fetchTasks()
      } else {
        showToast('追加に失敗しました')
      }
      void res
    } catch {
      showToast('追加に失敗しました')
    }
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  // 部署ごとにグループ化
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const dept = task.department
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(task)
    return acc
  }, {})

  // highが多い部署を先に
  const sortedDepts = Object.keys(grouped).sort((a, b) => {
    const aHigh = grouped[a].filter(t => t.priority === 'high').length
    const bHigh = grouped[b].filter(t => t.priority === 'high').length
    return bHigh - aHigh
  })

  const totalTasks = tasks.length
  const highTasks = tasks.filter(t => t.priority === 'high').length
  const completedTasks = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
              タスク管理
            </h3>
            {totalTasks > 0 && (
              <p className="text-[11px] text-gray-400 mt-1 ml-3.5">
                全{totalTasks}件（優先: {highTasks}件 / 完了: {completedTasks}件）
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
            >
              + 追加
            </button>
            <button
              onClick={generateTasks}
              disabled={generating}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                generating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-sm'
              }`}
            >
              {generating ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  AI分析中...
                </>
              ) : (
                <>AI生成</>
              )}
            </button>
          </div>
        </div>

        {/* タスク追加フォーム */}
        {showAdd && (
          <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="タスク内容を入力..."
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onKeyDown={e => { if (e.key === 'Enter') addTask() }}
            />
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {Object.keys(departmentColors).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {priorityOrder.map(p => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`text-[11px] px-2 py-1 rounded font-bold transition ${
                      newPriority === p
                        ? ''
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    style={{
                      backgroundColor: priorityConfig[p].bg,
                      color: priorityConfig[p].color,
                      border: `1px solid ${priorityConfig[p].border}`,
                    }}
                  >
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
              <button
                onClick={addTask}
                className="ml-auto px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-bold"
              >
                追加
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle('') }}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* フィルター */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'active', label: '未完了' },
            { key: 'completed', label: '完了済み' },
            { key: 'all', label: 'すべて' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${
                filter === f.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 font-bold'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* タスクリスト */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">読み込み中...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm text-gray-500">タスクがありません</p>
            <p className="text-xs text-gray-400 mt-1">
              「+ 追加」や「AI生成」でタスクを作成できます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDepts.map(dept => {
              const deptTasks = grouped[dept]
              const deptColor = departmentColors[dept] || '#666'
              const isExpanded = expandedDepts.has(dept)
              const deptHigh = deptTasks.filter(t => t.priority === 'high').length
              const deptCompleted = deptTasks.filter(t => t.status === 'completed').length

              return (
                <div key={dept} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* 部署ヘッダー */}
                  <button
                    onClick={() => toggleDept(dept)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: deptColor }}
                    />
                    <span className="text-sm font-bold text-gray-700 flex-1">{dept}</span>
                    <span className="text-[11px] text-gray-400">
                      {deptTasks.length}件
                      {deptHigh > 0 && <span className="text-red-500 ml-1">({deptHigh} 優先)</span>}
                      {deptCompleted > 0 && <span className="text-green-500 ml-1">({deptCompleted} 完了)</span>}
                    </span>
                    <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* タスク一覧 */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {deptTasks.map(task => {
                        const pri = priorityConfig[task.priority]
                        const stat = statusConfig[task.status]

                        return (
                          <div key={task.id} className="px-4 py-3 hover:bg-gray-50/50 transition group">
                            <div className="flex items-start gap-3">
                              {/* ステータス切替ボタン */}
                              <button
                                onClick={() => {
                                  const next = task.status === 'pending' ? 'in_progress'
                                    : task.status === 'in_progress' ? 'completed'
                                    : 'pending'
                                  updateStatus(task.id, next)
                                }}
                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition hover:scale-110"
                                style={{
                                  borderColor: stat.color,
                                  color: stat.color,
                                  backgroundColor: task.status === 'completed' ? stat.color + '22' : 'transparent',
                                }}
                                title={`クリックで${task.status === 'pending' ? '進行中' : task.status === 'in_progress' ? '完了' : '未着手'}に変更`}
                              >
                                {stat.icon}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                                  >
                                    {task.title}
                                  </span>
                                  {/* 優先度切替ボタン */}
                                  <button
                                    onClick={() => {
                                      const currentIdx = priorityOrder.indexOf(task.priority)
                                      const nextIdx = (currentIdx + 1) % priorityOrder.length
                                      updatePriority(task.id, priorityOrder[nextIdx])
                                    }}
                                    className="text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer hover:opacity-80 transition"
                                    style={{ backgroundColor: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}
                                    title="クリックで優先度を変更"
                                  >
                                    {pri.label}
                                  </button>
                                  {task.employee_name && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                      {task.employee_name}
                                    </span>
                                  )}
                                  {task.generated_by === 'line' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">
                                      LINE
                                    </span>
                                  )}
                                  {/* 完了タスクで詳細がある場合、展開ボタン */}
                                  {task.status === 'completed' && task.completion_note && (
                                    <button
                                      onClick={() => toggleTask(task.id)}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition"
                                    >
                                      {expandedTasks.has(task.id) ? '詳細を閉じる' : '実行詳細'}
                                    </button>
                                  )}
                                </div>
                                {task.description && task.description !== task.title && (
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                )}
                                {task.due_date && (
                                  <p className="text-[10px] text-gray-300 mt-1">
                                    期限: {task.due_date}
                                    {task.completed_at && (
                                      <span className="ml-2 text-green-500">
                                        完了: {new Date(task.completed_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </p>
                                )}

                                {/* completion_note展開表示 */}
                                {expandedTasks.has(task.id) && task.completion_note && (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-green-700 mb-2">実行結果</p>
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                                      {task.completion_note}
                                    </pre>
                                  </div>
                                )}
                              </div>

                              {/* 削除ボタン */}
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-xs p-1"
                                title="削除"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
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

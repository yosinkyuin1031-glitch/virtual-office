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
  created_at: string
}

const priorityConfig = {
  high: { label: '高', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  normal: { label: '中', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  low: { label: '低', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}

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
  'カスタマーサクセス部': '#26C6DA',
}

export default function AutoTasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<string>('active') // active, all, completed
  const [toast, setToast] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

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
      // active includes both pending and in_progress
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
              自動生成タスク
            </h3>
            {totalTasks > 0 && (
              <p className="text-[11px] text-gray-400 mt-1 ml-3.5">
                全{totalTasks}件（優先: {highTasks}件 / 完了: {completedTasks}件）
              </p>
            )}
          </div>
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
              <>⚡ KPIからタスク生成</>
            )}
          </button>
        </div>

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
              「KPIからタスク生成」ボタンで、目標に基づいたタスクを自動作成できます
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
                      {deptHigh > 0 && <span className="text-red-500 ml-1">({deptHigh}件 優先)</span>}
                      {deptCompleted > 0 && <span className="text-green-500 ml-1">({deptCompleted}件 完了)</span>}
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
                          <div key={task.id} className="px-4 py-3 hover:bg-gray-50/50 transition">
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
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ backgroundColor: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}
                                  >
                                    {pri.label}
                                  </span>
                                  {task.employee_name && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                      {task.employee_name}
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                )}
                                {task.due_date && (
                                  <p className="text-[10px] text-gray-300 mt-1">
                                    期限: {task.due_date}
                                  </p>
                                )}
                              </div>
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

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  department: string
  title: string
  description: string
  priority: string
  status: string
  due_date: string | null
  assignee_type?: string
  employee_name?: string
  completed_at: string | null
  completion_note: string | null
  created_at: string
}

type BizFilter = 'all' | 'seitai' | 'houmon' | 'app-biz' | 'consulting' | 'device'
type StatusFilter = 'pending' | 'completed' | 'all'

const BIZ_TABS: { key: BizFilter; label: string; emoji: string; color: string; depts: string[] }[] = [
  { key: 'all', label: 'すべて', emoji: '📥', color: '#6b7280', depts: [] },
  { key: 'seitai', label: '整体院', emoji: '🏥', color: '#1565C0', depts: ['整体院事業部'] },
  { key: 'houmon', label: '訪問鍼灸', emoji: '🏠', color: '#2E7D32', depts: ['訪問鍼灸事業部'] },
  { key: 'app-biz', label: 'アプリ事業', emoji: '📱', color: '#263238', depts: ['AI開発部', 'BtoB営業部', 'プロダクト企画部', 'カスタマーサクセス部', '経営層'] },
  { key: 'consulting', label: 'コンサル', emoji: '🧭', color: '#FBC02D', depts: ['コンサル事業部'] },
  { key: 'device', label: '機器販売', emoji: '🔧', color: '#E53935', depts: ['治療機器販売部'] },
]

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: '未対応' },
  { key: 'completed', label: '完了' },
  { key: 'all', label: 'すべて' },
]

function filterByBiz(tasks: Task[], biz: BizFilter): Task[] {
  if (biz === 'all') return tasks
  const tab = BIZ_TABS.find(t => t.key === biz)
  if (!tab) return tasks
  return tasks.filter(t => tab.depts.some(d => t.department?.includes(d)))
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [bizFilter, setBizFilter] = useState<BizFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/auto-tasks?status=all')
      .then(r => r.json())
      .then(res => setTasks(res.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c: Record<BizFilter, { pending: number; completed: number; all: number }> = {
      all: { pending: 0, completed: 0, all: 0 },
      seitai: { pending: 0, completed: 0, all: 0 },
      houmon: { pending: 0, completed: 0, all: 0 },
      'app-biz': { pending: 0, completed: 0, all: 0 },
      consulting: { pending: 0, completed: 0, all: 0 },
      device: { pending: 0, completed: 0, all: 0 },
    }
    for (const biz of BIZ_TABS.map(b => b.key)) {
      const list = filterByBiz(tasks, biz)
      c[biz].all = list.length
      c[biz].pending = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
      c[biz].completed = list.filter(t => t.status === 'completed').length
    }
    return c
  }, [tasks])

  const filtered = useMemo(() => {
    let list = filterByBiz(tasks, bizFilter)
    if (statusFilter === 'pending') list = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    if (statusFilter === 'completed') list = list.filter(t => t.status === 'completed')
    return list.sort((a, b) => {
      // Pendingが先、優先度高が先
      const prioOrder: Record<string, number> = { high: 0, normal: 1, low: 2 }
      const aP = prioOrder[a.priority] ?? 1
      const bP = prioOrder[b.priority] ?? 1
      if (aP !== bP) return aP - bP
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [tasks, bizFilter, statusFilter])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    setBusy(task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t))
    try {
      await fetch('/api/auto-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
    } catch {
      load()
    } finally {
      setBusy(null)
    }
  }

  const bizColorOf = (department: string) => {
    for (const tab of BIZ_TABS) {
      if (tab.depts.some(d => department?.includes(d))) return { color: tab.color, emoji: tab.emoji, label: tab.label }
    }
    return { color: '#6b7280', emoji: '📋', label: department || '—' }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">← ホーム</Link>
          <span>/</span>
          <span>タスク（5事業統合）</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">タスク統合ビュー</h1>
        <p className="text-sm text-gray-500 mb-4">5事業全体のタスクを横断して管理</p>

        {/* 事業タブ */}
        <div className="flex flex-wrap gap-2 mb-3">
          {BIZ_TABS.map(tab => {
            const isActive = bizFilter === tab.key
            const c = counts[tab.key]
            const badge = c[statusFilter]
            return (
              <button
                key={tab.key}
                onClick={() => setBizFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all flex items-center gap-1.5 ${
                  isActive ? 'bg-white shadow-sm border-2 font-medium' : 'bg-white/50 border-gray-200 hover:bg-white'
                }`}
                style={isActive ? { borderColor: tab.color, color: tab.color } : {}}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 rounded-full"
                    style={{ backgroundColor: isActive ? tab.color : '#e5e7eb', color: isActive ? 'white' : '#374151' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ステータスタブ */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {STATUS_TABS.map(t => {
            const isActive = statusFilter === t.key
            return (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 text-sm transition-all -mb-px border-b-2 ${
                  isActive ? 'border-amber-500 text-amber-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-3xl mb-2">✨</p>
            <p className="text-sm text-gray-500">該当するタスクはありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const isCompleted = task.status === 'completed'
              const biz = bizColorOf(task.department)
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg border p-3 ${isCompleted ? 'opacity-60' : ''}`}
                  style={{ borderLeftWidth: '3px', borderLeftColor: biz.color }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      disabled={busy === task.id}
                      className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {isCompleted && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: biz.color + '20', color: biz.color }}>
                          {biz.emoji} {biz.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{task.department}</span>
                        {task.priority === 'high' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">高</span>
                        )}
                      </div>
                      <h3 className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        {task.due_date && <span>期日: {task.due_date}</span>}
                        {task.employee_name && <span>担当: {task.employee_name}</span>}
                      </div>
                      {task.completion_note && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded text-xs text-gray-700">
                          <span className="font-medium text-green-700">成果: </span>
                          {task.completion_note}
                        </div>
                      )}
                    </div>
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

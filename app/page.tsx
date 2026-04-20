'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { departments, allEmployeesList, products, productCategories } from './lib/data'
import type { Employee, Product } from './lib/data'
import { documents } from './lib/documents'
import type { Document } from './lib/documents'
import PixelCharacter from './components/PixelCharacter'
import ChatModal from './components/ChatModal'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 型定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Goal {
  id: string
  key: string
  label: string
  value: string
  category: string
  sort_order: number
}

interface ContextItem {
  id: string
  category: string
  title: string
  content: string
}

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通コンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatusBadge({ status }: { status: Employee['status'] }) {
  const config = {
    busy: { label: '激忙中', color: 'text-red-500', icon: '🔥' },
    working: { label: '作業中', color: 'text-green-600', icon: '💻' },
    idle: { label: '待機中', color: 'text-gray-400', icon: '💤' },
    meeting: { label: '会議中', color: 'text-yellow-600', icon: '📞' },
  }
  const c = config[status]
  return <span className={`text-xs ${c.color}`}>{c.icon} {c.label}</span>
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SNS投稿コピー機能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stripHtmlToText(html: string): string {
  let text = html
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<\/tr>/gi, '\n')
  text = text.replace(/<[^>]*>/g, '')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SNS投稿カード
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PostCard({ doc, onHide }: { doc: Document; onHide?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const plainText = stripHtmlToText(doc.contentHtml)
  const preview = plainText.slice(0, 120) + (plainText.length > 120 ? '...' : '')

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = plainText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    onHide?.(doc.id)
    setConfirming(false)
  }

  const categoryConfig: Record<string, { label: string; color: string }> = {
    btob: { label: 'BtoB', color: '#22D3EE' },
    sns: { label: 'SNS', color: '#EC4899' },
    product: { label: 'プロダクト', color: '#F59E0B' },
    meo: { label: 'MEO', color: '#10B981' },
    operations: { label: '運営', color: '#6366F1' },
  }
  const catConf = categoryConfig[doc.category] || { label: doc.category, color: '#999' }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: catConf.color + '15', color: catConf.color, border: `1px solid ${catConf.color}30` }}
            >
              {catConf.label}
            </span>
            <span className="text-[9px] text-gray-300">{doc.updatedAt}</span>
            {doc.status === 'draft' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">下書き</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                copied
                  ? 'bg-green-50 text-green-600 border-green-300'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
              }`}
            >
              {copied ? 'コピー済' : 'コピー'}
            </button>
            {onHide && (
              <button
                onClick={handleHide}
                className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                  confirming
                    ? 'bg-red-50 text-red-600 border-red-300'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-300'
                }`}
              >
                {confirming ? '本当に削除？' : '×'}
              </button>
            )}
          </div>
        </div>

        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{doc.title}</h4>

        {expanded ? (
          <div
            className="text-[11px] text-gray-600 leading-relaxed mt-3 prose-sm max-h-[60vh] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
          />
        ) : (
          <p className="text-[11px] text-gray-500 leading-relaxed">{preview}</p>
        )}
      </div>

      <div className="px-4 pb-2 text-[9px] text-gray-400">
        {expanded ? '▲ 閉じる' : '▼ 全文を表示'}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 事業別フィルタリング設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const goalFilterMap: Record<string, { categories: string[]; labelKeywords: string[] }> = {
  seitai: { categories: ['整体', '院'], labelKeywords: ['整体', '院', 'カルテ', '単価', 'サブスク', '来院', '物販'] },
  houmon: { categories: ['訪問', '鍼灸'], labelKeywords: ['訪問', '鍼灸', 'スタッフ', 'ケアマネ'] },
  'app-biz': { categories: ['アプリ', 'SaaS', 'BtoB', 'MRR'], labelKeywords: ['アプリ', 'SaaS', 'BtoB', 'MRR', '導入'] },
  consulting: { categories: ['コンサル'], labelKeywords: ['コンサル', '秘密基地', '勉強会'] },
  device: { categories: ['機器', '販売'], labelKeywords: ['機器', 'BR', '顕微鏡'] },
}

const contextFilterMap: Record<string, { categories: string[]; contentKeywords: string[] }> = {
  seitai: { categories: ['operations', 'yearly', 'campaign', 'work_design'], contentKeywords: ['整体', '院', '患者', '施術'] },
  houmon: { categories: [], contentKeywords: ['訪問', '鍼灸', 'ケアマネ', 'リハビリ'] },
  'app-biz': { categories: ['btob_sales'], contentKeywords: ['アプリ', 'BtoB', 'SaaS', 'カラダマップ', 'MEO'] },
  consulting: { categories: [], contentKeywords: ['コンサル', '秘密基地', '勉強会'] },
  device: { categories: [], contentKeywords: ['機器', 'BR', '顕微鏡'] },
}

const taskDeptMap: Record<string, string[]> = {
  seitai: ['整体'],
  houmon: ['訪問'],
  'app-biz': ['AI', 'BtoB', 'プロダクト', 'カスタマー'],
  consulting: ['コンサル'],
  device: ['機器'],
}

function filterGoals(goals: Goal[], businessId: string): Goal[] {
  const filter = goalFilterMap[businessId]
  if (!filter) return []
  return goals.filter(g => {
    const catMatch = filter.categories.some(kw => (g.category || '').includes(kw))
    const labelMatch = filter.labelKeywords.some(kw => (g.label || '').includes(kw))
    return catMatch || labelMatch
  })
}

function filterContexts(contexts: ContextItem[], businessId: string): ContextItem[] {
  const filter = contextFilterMap[businessId]
  if (!filter) return []
  return contexts.filter(c => {
    const catMatch = filter.categories.includes(c.category)
    const contentMatch = filter.contentKeywords.some(kw =>
      (c.title || '').includes(kw) || (c.content || '').includes(kw)
    )
    return catMatch || contentMatch
  })
}

function filterTasks(tasks: Task[], businessId: string): Task[] {
  const deptKeywords = taskDeptMap[businessId]
  if (!deptKeywords) return []
  return tasks.filter(t =>
    deptKeywords.some(kw => (t.department || '').includes(kw))
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 方針・KPIタブ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ContextKpiView({ businessId, color }: { businessId: string; color: string }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [contexts, setContexts] = useState<ContextItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/context').then(r => r.json()),
    ]).then(([goalsRes, contextRes]) => {
      setGoals(goalsRes.goals || [])
      setContexts(contextRes.contexts || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const bizGoals = filterGoals(goals, businessId)
  const bizContexts = filterContexts(contexts, businessId)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    )
  }

  const kpiColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {bizGoals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
            KPI / 目標
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bizGoals.map((goal, i) => {
              const cardColor = kpiColors[i % kpiColors.length]
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border p-3"
                  style={{ backgroundColor: cardColor + '08', borderColor: cardColor + '25' }}
                >
                  <p className="text-[10px] text-gray-500 leading-tight mb-1">{goal.label}</p>
                  <p className="text-sm font-bold" style={{ color: cardColor }}>{goal.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Context Items */}
      {bizContexts.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
            方針 / コンテキスト
          </h3>
          <div className="space-y-2">
            {bizContexts.map(ctx => (
              <div key={ctx.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <h4 className="text-xs font-bold text-gray-700 mb-1">{ctx.title}</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">{ctx.content}</p>
                <span className="text-[9px] text-gray-300 mt-1 inline-block">{ctx.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bizGoals.length === 0 && bizContexts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm text-gray-400">この事業のKPI・方針はまだ登録されていません</p>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タスクタブ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getDueDateBadge(dueDate: string | null): { label: string; className: string } | null {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = due.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return { label: `${Math.abs(days)}日超過`, className: 'bg-red-100 text-red-700 border-red-200' }
  if (days === 0) return { label: '今日', className: 'bg-red-50 text-red-600 border-red-200' }
  if (days <= 7) return { label: `${days}日後`, className: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
  return { label: dueDate.slice(5), className: 'bg-gray-50 text-gray-500 border-gray-200' }
}

function getPriorityBadge(priority: string): { label: string; className: string } {
  if (priority === 'high') return { label: '高', className: 'bg-red-50 text-red-600 border-red-200' }
  if (priority === 'low') return { label: '低', className: 'bg-gray-50 text-gray-400 border-gray-200' }
  return { label: '中', className: 'bg-blue-50 text-blue-500 border-blue-200' }
}

function getAssigneeBadge(task: Task): string {
  if (task.assignee_type === 'owner') return '大口'
  if (task.assignee_type === 'both') return '両方'
  if (task.employee_name) return task.employee_name
  return 'CC自動'
}

function TasksView({ businessId, color }: { businessId: string; color: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState('normal')
  const [adding, setAdding] = useState(false)

  const fetchTasks = useCallback(() => {
    setLoading(true)
    fetch('/api/auto-tasks?status=all')
      .then(r => r.json())
      .then(res => setTasks(res.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const bizTasks = filterTasks(tasks, businessId)
  const pendingTasks = bizTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const completedTasks = bizTasks.filter(t => t.status === 'completed')

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t))
    try {
      await fetch('/api/auto-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
    } catch {
      fetchTasks() // revert on error
    }
  }

  const addTask = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      // Determine department based on businessId
      const deptNames: Record<string, string> = {
        seitai: '整体院事業部',
        houmon: '訪問鍼灸事業部',
        'app-biz': 'AI開発部',
        consulting: 'コンサル事業部',
        device: '治療機器販売部',
      }
      const res = await fetch('/api/auto-tasks-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: deptNames[businessId] || '経営層',
          title: newTitle.trim(),
          description: '',
          priority: newPriority,
          due_date: newDueDate || null,
        }),
      })
      if (!res.ok) {
        // Fallback: try direct insert via a simple approach
        // The auto-tasks POST generates tasks via AI, so we need a separate endpoint
        // Let's just refetch
      }
      setNewTitle('')
      setNewDueDate('')
      setNewPriority('normal')
      fetchTasks()
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="新しいタスクを追加..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask() }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:border-amber-400 focus:outline-none"
              maxLength={25}
            />
          </div>
          <input
            type="date"
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            className="text-[10px] px-2 py-2 rounded-lg border border-gray-300 focus:border-amber-400 focus:outline-none"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            className="text-[10px] px-2 py-2 rounded-lg border border-gray-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="high">高</option>
            <option value="normal">中</option>
            <option value="low">低</option>
          </select>
          <button
            onClick={addTask}
            disabled={adding || !newTitle.trim()}
            className="text-xs px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50 transition"
            style={{ backgroundColor: color }}
          >
            {adding ? '...' : '追加'}
          </button>
        </div>
      </div>

      {/* Pending tasks */}
      <div>
        <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
          未完了タスク
          <span className="text-[9px] font-normal text-gray-400">({pendingTasks.length})</span>
        </h3>
        {pendingTasks.length === 0 ? (
          <p className="text-[11px] text-gray-400 py-4 text-center">未完了タスクはありません</p>
        ) : (
          <div className="space-y-1.5">
            {pendingTasks.map(task => {
              const dueBadge = getDueDateBadge(task.due_date)
              const priBadge = getPriorityBadge(task.priority)
              const assignee = getAssigneeBadge(task)
              return (
                <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-start gap-2.5 hover:shadow-sm transition">
                  <button
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 hover:border-amber-400 flex-shrink-0 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-snug">{task.title}</p>
                    {task.description && (
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {dueBadge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${dueBadge.className}`}>{dueBadge.label}</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${priBadge.className}`}>{priBadge.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-200">{assignee}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5 hover:text-gray-600 transition"
          >
            <span>{showCompleted ? '▼' : '▶'}</span>
            完了済み
            <span className="text-[9px] font-normal">({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-1.5">
              {completedTasks.map(task => {
                const priBadge = getPriorityBadge(task.priority)
                const assignee = getAssigneeBadge(task)
                return (
                  <div key={task.id} className="bg-gray-50 rounded-lg border border-gray-100 p-3 flex items-start gap-2.5 opacity-60">
                    <button
                      onClick={() => toggleTask(task)}
                      className="mt-0.5 w-4 h-4 rounded border-2 border-green-400 bg-green-400 flex-shrink-0 flex items-center justify-center transition"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 leading-snug line-through">{task.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${priBadge.className}`}>{priBadge.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-200">{assignee}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {bizTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-gray-400">この事業のタスクはまだありません</p>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 事業別ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type BusinessId = 'seitai' | 'houmon' | 'app-biz' | 'consulting' | 'device'

interface ChannelDef {
  id: string
  label: string
  icon: string
  // document matching: title/id keywords
  keywords: string[]
}

const businessConfig: Record<BusinessId, {
  name: string
  subtitle: string
  target: string
  icon: string
  color: string
  deptIds: string[]
  productCategories: string[]
  documentCategories: string[]
  channels: ChannelDef[]
}> = {
  seitai: {
    name: '大口神経整体院',
    subtitle: '重症症状専門。不調で止まった人生にもう一度光を灯す',
    target: '50-70代。病院で異常なし・手術を避けたい・他院で改善しなかった方',
    icon: '🏥',
    color: '#1565C0',
    deptIds: ['seitai'],
    productCategories: ['clinic-app'],
    documentCategories: ['operations', 'sns', 'meo'],
    channels: [
      { id: 'context', label: '方針・KPI', icon: '🎯', keywords: [] },
      { id: 'tasks', label: 'タスク', icon: '✅', keywords: [] },
      { id: 'instagram', label: 'Instagram', icon: '📸', keywords: ['instagram', 'insta'] },
      { id: 'gbp', label: 'GBP(MEO)', icon: '📍', keywords: ['gbp', 'google', 'gmb', 'meo'] },
      { id: 'blog', label: 'ブログ(SEO)', icon: '📝', keywords: ['blog', 'seo', 'ブログ', '記事'] },
      { id: 'line', label: 'LINE', icon: '💬', keywords: ['line'] },
      { id: 'note', label: 'note', icon: '📓', keywords: ['note'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  houmon: {
    name: '晴陽鍼灸院（訪問鍼灸）',
    subtitle: '鍼灸リハビリを通じて高齢者の「晴れ」を取り戻す',
    target: '歩行困難な方（年齢問わず）。ケアマネ・家族・整体院からの紹介',
    icon: '🏠',
    color: '#2E7D32',
    deptIds: ['houmon'],
    productCategories: ['houmon-app'],
    documentCategories: ['operations', 'sns', 'meo'],
    channels: [
      { id: 'context', label: '方針・KPI', icon: '🎯', keywords: [] },
      { id: 'tasks', label: 'タスク', icon: '✅', keywords: [] },
      { id: 'instagram', label: 'Instagram', icon: '📸', keywords: ['instagram', 'insta'] },
      { id: 'gbp', label: 'GBP(MEO)', icon: '📍', keywords: ['gbp', 'google', 'gmb', 'meo'] },
      { id: 'blog', label: 'ブログ(SEO)', icon: '📝', keywords: ['blog', 'seo', 'ブログ', '記事'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  'app-biz': {
    name: 'アプリ事業（BtoB SaaS）',
    subtitle: '現場を知る治療家が作ったアプリで、治療・教育・自分の時間に集中できる環境を作る',
    target: '自費の治療家。開業年数・院の規模は問わない',
    icon: '📱',
    color: '#263238',
    deptIds: ['ai_dev', 'btob', 'product_mgmt', 'customer_success'],
    productCategories: ['btob-saas'],
    documentCategories: ['btob', 'sns', 'product'],
    channels: [
      { id: 'context', label: '方針・KPI', icon: '🎯', keywords: [] },
      { id: 'tasks', label: 'タスク', icon: '✅', keywords: [] },
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'threads', label: 'Threads', icon: '🧵', keywords: ['threads'] },
      { id: 'oc', label: 'オープンチャット', icon: '💬', keywords: ['oc', 'オープンチャット'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  consulting: {
    name: 'コンサル事業',
    subtitle: '治療家が自分の強みを活かした経営ができ、共に成長できる環境・仲間を作る',
    target: '売上はあるが仕組み化できていない治療家。川口村以外にも拡大',
    icon: '🧭',
    color: '#FBC02D',
    deptIds: ['consulting'],
    productCategories: ['btob-saas', 'tool'],
    documentCategories: ['btob', 'operations'],
    channels: [
      { id: 'context', label: '方針・KPI', icon: '🎯', keywords: [] },
      { id: 'tasks', label: 'タスク', icon: '✅', keywords: [] },
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  device: {
    name: '治療機器販売',
    subtitle: 'メニューの幅を広げ売上の柱を増やし、患者に「見える変化」を届ける機器導入支援',
    target: 'コンサルメンバー＋知り合い中心。メニュー追加・単価アップしたい治療家',
    icon: '🔧',
    color: '#E53935',
    deptIds: ['device_sales'],
    productCategories: ['marketing', 'btob-saas'],
    documentCategories: ['btob', 'operations'],
    channels: [
      { id: 'context', label: '方針・KPI', icon: '🎯', keywords: [] },
      { id: 'tasks', label: 'タスク', icon: '✅', keywords: [] },
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
}

// Match a document to a channel by keywords in title/id
function matchChannel(doc: Document, channel: ChannelDef): boolean {
  // Direct channel match
  if (doc.channel && doc.channel === channel.id) return true
  // Keyword fallback
  if (channel.keywords.length === 0) return false
  const haystack = (doc.title + ' ' + doc.id).toLowerCase()
  return channel.keywords.some(kw => haystack.includes(kw))
}

function BusinessView({ businessId, setChatTarget }: { businessId: BusinessId; setChatTarget: (emp: Employee) => void }) {
  const config = businessConfig[businessId]
  const [activeChannel, setActiveChannel] = useState(config.channels[0].id)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [showHidden, setShowHidden] = useState(false)

  // Reset active channel when business changes
  useEffect(() => {
    setActiveChannel(config.channels[0].id)
  }, [businessId, config.channels])

  // Load hidden document IDs from localStorage + API
  useEffect(() => {
    const stored = localStorage.getItem('vo_hidden_docs')
    if (stored) setHiddenIds(JSON.parse(stored))
    fetch('/api/documents').then(r => r.json()).then(res => {
      if (res.hiddenIds?.length) {
        setHiddenIds(prev => {
          const merged = [...new Set([...prev, ...res.hiddenIds])]
          localStorage.setItem('vo_hidden_docs', JSON.stringify(merged))
          return merged
        })
      }
    }).catch(() => {})
  }, [])

  const hideDocument = useCallback((docId: string) => {
    setHiddenIds(prev => {
      const next = [...prev, docId]
      localStorage.setItem('vo_hidden_docs', JSON.stringify(next))
      return next
    })
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId }),
    }).catch(() => {})
  }, [])

  const restoreDocument = useCallback((docId: string) => {
    setHiddenIds(prev => {
      const next = prev.filter(id => id !== docId)
      localStorage.setItem('vo_hidden_docs', JSON.stringify(next))
      return next
    })
    fetch(`/api/documents?id=${docId}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  // Get data
  const bizProducts = config.productCategories.length > 0
    ? products.filter(p => config.productCategories.includes(p.category))
    : []
  const allBizDocuments = documents.filter(d => {
    // Direct business match
    if (d.business) return d.business === businessId || d.business === 'all'
    // Category fallback
    return config.documentCategories.includes(d.category)
  })
  const bizDocuments = allBizDocuments.filter(d => !hiddenIds.includes(d.id))
  const hiddenDocs = allBizDocuments.filter(d => hiddenIds.includes(d.id))
  const bizDepts = departments.filter(d => config.deptIds.includes(d.id))
  const bizEmployees = bizDepts.flatMap(d => d.employees)

  // Current channel
  const currentChannel = config.channels.find(c => c.id === activeChannel) || config.channels[0]
  const isAppsChannel = currentChannel.id === 'apps'
  const isContextChannel = currentChannel.id === 'context'
  const isTasksChannel = currentChannel.id === 'tasks'
  const isSpecialChannel = isAppsChannel || isContextChannel || isTasksChannel

  // Filter docs for current channel
  const channelDocs = isSpecialChannel ? [] : bizDocuments.filter(d => matchChannel(d, currentChannel))

  // Docs that don't match any channel (show in first content channel as fallback)
  const unmatchedDocs = bizDocuments.filter(d => !config.channels.some(c => c.id !== 'apps' && c.id !== 'context' && c.id !== 'tasks' && matchChannel(d, c)))

  // Count per channel
  const channelCounts: Record<string, number> = {}
  const firstContentChannel = config.channels.find(c => c.id !== 'apps' && c.id !== 'context' && c.id !== 'tasks')
  config.channels.forEach(ch => {
    if (ch.id === 'apps') {
      channelCounts[ch.id] = bizProducts.length
    } else if (ch.id === 'context' || ch.id === 'tasks') {
      // No count badge for these special tabs
      channelCounts[ch.id] = 0
    } else {
      let count = bizDocuments.filter(d => matchChannel(d, ch)).length
      if (ch.id === firstContentChannel?.id) {
        count += unmatchedDocs.length
      }
      channelCounts[ch.id] = count
    }
  })

  // Final docs to show
  const docsToShow = isSpecialChannel
    ? []
    : activeChannel === firstContentChannel?.id
      ? [...channelDocs, ...unmatchedDocs]
      : channelDocs

  return (
    <div className="space-y-0 pb-8">
      {/* Header */}
      <div className="bg-white rounded-t-2xl border-2 border-b-0 p-4 shadow-sm" style={{ borderColor: config.color + '33' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h2 className="text-base font-bold" style={{ color: config.color }}>{config.name}</h2>
            <p className="text-[10px] text-gray-400">
              {bizEmployees.length}名 | {bizProducts.length}アプリ | {bizDocuments.length}投稿
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: config.color + '15' }}>
          <p className="text-xs font-medium text-gray-700">{config.subtitle}</p>
          <p className="text-[10px] text-gray-400 mt-1">Target: {config.target}</p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="bg-white border-x-2 px-2 pb-2" style={{ borderColor: config.color + '33' }}>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {config.channels.map(ch => {
            const isActive = activeChannel === ch.id
            const count = channelCounts[ch.id] || 0
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'font-bold text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: config.color } : undefined}
              >
                <span>{ch.icon}</span>
                <span>{ch.label}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Channel content */}
      <div className="bg-white rounded-b-2xl border-2 border-t-0 p-4 shadow-sm min-h-[300px]" style={{ borderColor: config.color + '33' }}>
        {isContextChannel ? (
          <ContextKpiView businessId={businessId} color={config.color} />
        ) : isTasksChannel ? (
          <TasksView businessId={businessId} color={config.color} />
        ) : isAppsChannel ? (
          /* アプリ一覧 */
          bizProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">この事業に紐づくアプリはまだありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {bizProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-3 hover:shadow-md hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xl">{product.icon}</span>
                    <span
                      className="text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: product.rank === 'A' ? '#22C55E18' : product.rank === 'B' ? '#F59E0B18' : '#EF444418',
                        color: product.rank === 'A' ? '#16A34A' : product.rank === 'B' ? '#D97706' : '#DC2626',
                        border: `2px solid ${product.rank === 'A' ? '#22C55E' : product.rank === 'B' ? '#F59E0B' : '#EF4444'}`,
                      }}
                    >
                      {product.rank}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 leading-tight">{product.name}</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-[9px] text-amber-600 hover:text-amber-800 transition">
                      開く →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* SNS投稿一覧 */
          docsToShow.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">{currentChannel.icon}</p>
              <p className="text-sm text-gray-400">{currentChannel.label}の投稿はまだありません</p>
              <p className="text-[10px] text-gray-300 mt-1">ここに投稿が追加されると一覧表示されます</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docsToShow.map(doc => (
                <PostCard key={doc.id} doc={doc} onHide={hideDocument} />
              ))}
            </div>
          )
        )}

        {/* 非表示記事の管理 */}
        {hiddenDocs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              🗑️ 非表示の記事（{hiddenDocs.length}件）
              <span className="text-[9px]">{showHidden ? '▲' : '▼'}</span>
            </button>
            {showHidden && (
              <div className="mt-2 space-y-1">
                {hiddenDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-[10px] text-gray-400 truncate flex-1">{doc.title}</span>
                    <button
                      onClick={() => restoreDocument(doc.id)}
                      className="text-[9px] text-blue-500 hover:text-blue-700 ml-2 whitespace-nowrap"
                    >
                      ↩ 復元
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 担当AI社員（コンパクト） */}
      {bizEmployees.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[11px] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
            担当AI社員
          </h3>
          <div className="flex flex-wrap gap-2">
            {bizEmployees.map(emp => (
              <div
                key={emp.id}
                className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-amber-50/50 hover:shadow-sm transition-all"
                onClick={() => setChatTarget(emp)}
              >
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={28} />
                <div>
                  <span className="text-[10px] font-bold" style={{ color: emp.color }}>{emp.name}</span>
                  <StatusBadge status={emp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ホーム画面（簡素化版）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ContextInput() {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedInfo, setSavedInfo] = useState<{
    splitCount: number
    blocks: {category: string; promoted: boolean; business_tags: string[]; department_tags: string[]; title: string}[]
  } | null>(null)
  const [mode, setMode] = useState<'quick' | 'plaud'>('quick')

  const detectDepartments = (input: string): string[] => {
    const tags: string[] = []
    if (/整体|院|患者|施術/.test(input)) tags.push('整体院事業部')
    if (/訪問|鍼灸|ケアマネ|リハビリ/.test(input)) tags.push('訪問鍼灸事業部')
    if (/アプリ|SaaS|BtoB|カラダマップ|MEO勝ち上げ/.test(input)) { tags.push('AI開発部'); tags.push('BtoB営業部') }
    if (/コンサル|秘密基地|勉強会/.test(input)) tags.push('コンサル事業部')
    if (/機器|BR|顕微鏡/.test(input)) tags.push('治療機器販売部')
    return tags.length > 0 ? tags : ['経営層']
  }

  const detectCategory = (input: string): string => {
    if (/決めた|やる|やらない|方針|戦略|絶対|必ず/.test(input)) return 'direction'
    if (/気づき|発見|なるほど|わかった|学んだ|知った/.test(input)) return 'insight'
    return 'general'
  }

  const detectBusinesses = (input: string): string[] => {
    const tags: string[] = []
    if (/整体/.test(input)) tags.push('整体院')
    if (/訪問|鍼灸|晴陽/.test(input)) tags.push('訪問鍼灸')
    if (/アプリ|カラダマップ|クリニックコア|Clinic|ポイント管理/.test(input)) tags.push('アプリ事業')
    if (/コンサル|秘密基地|西村/.test(input)) tags.push('コンサル')
    if (/BR|機器|血管/.test(input)) tags.push('治療機器')
    return tags
  }

  const categoryLabel: Record<string, string> = {
    direction: '方針・決定',
    insight: '気づき・発見',
    general: '一般メモ',
  }

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      if (mode === 'plaud') {
        const res = await fetch('/api/plaud-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text.trim(),
            title: title.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSavedInfo({
            splitCount: data.split_count || 1,
            blocks: data.blocks || [{
              category: data.category,
              promoted: data.promoted,
              business_tags: detectBusinesses(text),
              department_tags: detectDepartments(text).map((d: string) => d),
              title: text.slice(0, 50),
            }],
          })
        }
      } else {
        const deptTags = detectDepartments(text)
        await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: text.trim(),
            category: 'context',
            source: 'web',
            department_tags: deptTags,
          }),
        })
        setSavedInfo(null)
      }
      setText('')
      setTitle('')
      setSaved(true)
      setTimeout(() => { setSaved(false); setSavedInfo(null) }, 5000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const currentCategory = detectCategory(text)
  const currentDepts = detectDepartments(text)
  const currentBiz = detectBusinesses(text)

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          {mode === 'plaud' ? 'Plaudメモ取り込み' : 'コンテキスト入力'}
        </h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode('quick')}
            className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition ${mode === 'quick' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}
          >
            クイック
          </button>
          <button
            onClick={() => setMode('plaud')}
            className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition ${mode === 'plaud' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
          >
            Plaud
          </button>
        </div>
      </div>

      {mode === 'plaud' && (
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="タイトル（省略可）"
          className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none mb-2"
        />
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={mode === 'plaud'
          ? 'Plaudの文字起こしをここに貼り付け...\n内容を読み取って自動で事業・部署に振り分けます'
          : '事業に関するメモや方針を入力すると、キーワードで自動的に該当事業部に振り分けられます...'
        }
        className={`w-full text-xs px-3 py-2.5 rounded-lg border focus:outline-none resize-none ${mode === 'plaud' ? 'border-indigo-200 focus:border-indigo-400' : 'border-gray-200 focus:border-amber-400'}`}
        rows={mode === 'plaud' ? 8 : 3}
      />

      {/* 自動分類プレビュー */}
      {text.trim() && !saved && (
        <div className={`mt-2 p-2 rounded-lg text-[10px] ${mode === 'plaud' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-full font-bold ${currentCategory === 'direction' ? 'bg-red-100 text-red-700' : currentCategory === 'insight' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
              {categoryLabel[currentCategory]}
            </span>
            {currentDepts.map(d => (
              <span key={d} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{d}</span>
            ))}
            {currentBiz.map(b => (
              <span key={b} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{b}</span>
            ))}
          </div>
          {mode === 'plaud' && (currentCategory === 'direction' || currentCategory === 'insight') && (
            <p className="mt-1 text-indigo-600 font-bold">→ company_contextに自動昇格されます</p>
          )}
        </div>
      )}

      {/* 保存結果 */}
      {saved && savedInfo && (
        <div className="mt-2 p-2.5 rounded-lg bg-green-50 border border-green-200 text-[10px]">
          <p className="font-bold text-green-700 mb-1">
            {savedInfo.splitCount > 1
              ? `${savedInfo.splitCount}トピックに分割して保存しました`
              : '保存完了'}
          </p>
          {savedInfo.blocks.map((block, i) => (
            <div key={i} className={`${i > 0 ? 'mt-2 pt-2 border-t border-green-200' : ''}`}>
              {savedInfo.splitCount > 1 && (
                <p className="text-[9px] text-gray-500 mb-1">#{i + 1} {block.title.slice(0, 30)}...</p>
              )}
              <div className="flex flex-wrap gap-1">
                <span className={`px-2 py-0.5 rounded-full font-bold ${block.category === 'direction' ? 'bg-red-100 text-red-700' : block.category === 'insight' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {categoryLabel[block.category] || block.category}
                </span>
                {block.business_tags.map(b => {
                  const bizLabel: Record<string, string> = { seitai: '整体院', houmon: '訪問鍼灸', app_sales: 'アプリ事業', consulting: 'コンサル', device: '治療機器' }
                  return <span key={b} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{bizLabel[b] || b}</span>
                })}
              </div>
              {block.promoted && <p className="mt-0.5 text-green-700 font-bold text-[9px]">→ company_contextに昇格</p>}
            </div>
          ))}
        </div>
      )}
      {saved && !savedInfo && (
        <p className="mt-2 text-[10px] text-green-600 font-medium">保存しました</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div>
          {text.trim() && (
            <span className="text-[9px] text-gray-400">{text.length}文字</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className={`text-xs px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50 transition ${mode === 'plaud' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-amber-500 hover:bg-amber-600'}`}
        >
          {saving ? '保存中...' : mode === 'plaud' ? '取り込み' : '保存'}
        </button>
      </div>
    </div>
  )
}

function HomeView() {
  const quickApps = [
    { name: '顧客管理', icon: '👥', url: 'https://customer-mgmt.vercel.app', color: '#F59E0B' },
    { name: '予約管理', icon: '📅', url: 'https://reservation-app-steel.vercel.app', color: '#3B82F6' },
    { name: 'WEB問診', icon: '📝', url: 'https://web-monshin.vercel.app', color: '#8B5CF6' },
    { name: '検査シート', icon: '🔬', url: 'https://kensa-sheet-app.vercel.app', color: '#10B981' },
    { name: 'MEO勝ち上げくん', icon: '🏆', url: 'https://meo-kachiagekun.vercel.app', color: '#EF4444' },
    { name: 'プロジェクト管理', icon: '📋', url: 'https://project-hub-three-chi.vercel.app', color: '#6366F1' },
    { name: 'アプリ管理', icon: '📊', url: 'https://clinic-saas-lp.vercel.app/admin', color: '#8B5CF6' },
  ]

  const totalEmployees = allEmployeesList.length
  const busyCount = allEmployeesList.filter(e => e.status === 'busy').length
  const workingCount = allEmployeesList.filter(e => e.status === 'working').length

  return (
    <div className="space-y-6 pb-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI Solutions</h2>
            <p className="text-sm text-gray-500">会長：大口 陽平</p>
          </div>
        </div>

        {/* 理念・ビジョン・ミッション */}
        <div className="mt-4 pt-4 border-t border-amber-100 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-3 py-2 border border-amber-100">
              <p className="text-[9px] font-bold text-amber-500 tracking-wider">VISION</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">挑戦を諦めない人が増え、温かく支え合える社会</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg px-3 py-2 border border-orange-100">
              <p className="text-[9px] font-bold text-orange-500 tracking-wider">MISSION</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">「できない」を「できる」に変え、光を灯す</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg px-3 py-2 border border-yellow-100">
              <p className="text-[9px] font-bold text-yellow-600 tracking-wider">VALUE</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">想いを創造し、チャレンジを楽しむ</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-3 py-2 border border-emerald-100">
              <p className="text-[9px] font-bold text-emerald-500 tracking-wider">ROLE</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">想いに寄り添い、共に成長できる環境を創るサポーター</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 tracking-wider">PURPOSE</p>
            <p className="text-xs text-gray-600 mt-0.5">痛みや不調で止まった人生に「自由にやりたい事をやってもいい」という選択肢を渡す</p>
          </div>
        </div>

        {/* ステータスサマリー */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-amber-100">
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{totalEmployees}</p>
            <p className="text-[10px] text-gray-400">AI社員</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">{busyCount}</p>
            <p className="text-[10px] text-gray-400">激忙中</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{workingCount}</p>
            <p className="text-[10px] text-gray-400">作業中</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">5</p>
            <p className="text-[10px] text-gray-400">事業</p>
          </div>
        </div>
      </div>

      {/* よく使うアプリ（6個に絞る） */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          よく使うアプリ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickApps.map(app => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-200 hover:shadow-md hover:scale-[1.03] transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
              <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{app.name}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: app.color + '15', color: app.color }}>
                開く →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* 5事業クイックアクセス */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          5事業
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(businessConfig) as [BusinessId, typeof businessConfig[BusinessId]][]).map(([id, biz]) => {
            const depts = departments.filter(d => biz.deptIds.includes(d.id))
            const empCount = depts.reduce((sum, d) => sum + d.employees.length, 0)
            const prodCount = biz.productCategories.length > 0
              ? products.filter(p => biz.productCategories.includes(p.category)).length
              : 0
            return (
              <div
                key={id}
                className="bg-white rounded-xl border-2 p-4 shadow-sm"
                style={{ borderColor: biz.color + '33' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{biz.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: biz.color }}>{biz.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{empCount}名</span>
                  {prodCount > 0 && <span>{prodCount}アプリ</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* コンテキスト入力エリア */}
      <ContextInput />

      {/* 組織図 */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          組織図
        </h3>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          {/* 会長 */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl px-5 py-3 text-center shadow-sm">
              <p className="text-lg">👑</p>
              <p className="text-xs font-bold text-amber-800">会長</p>
              <p className="text-[10px] text-gray-500">大口 陽平</p>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-px h-4 bg-gray-300" />
          </div>

          {/* 経営層 */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {departments.filter(d => d.parentDivision === 'executive' || d.parentDivision === 'finance').map(dept => (
              <div key={dept.id} className="border rounded-lg px-3 py-2 text-center min-w-[80px]" style={{ borderColor: dept.color + '50', backgroundColor: dept.color + '08' }}>
                <p className="text-sm">{dept.icon}</p>
                <p className="text-[9px] font-bold" style={{ color: dept.color }}>{dept.name}</p>
                <p className="text-[8px] text-gray-400">{dept.employees.length}名</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-px h-4 bg-gray-300" />
          </div>

          {/* 事業部 */}
          <div className="mb-3">
            <p className="text-[9px] font-bold text-gray-400 text-center mb-2">事業部</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {departments.filter(d => ['seitai', 'houmon', 'consulting', 'device_sales'].includes(d.id)).map(dept => (
                <div key={dept.id} className="border rounded-lg px-3 py-2 text-center min-w-[80px]" style={{ borderColor: dept.color + '50', backgroundColor: dept.color + '08' }}>
                  <p className="text-sm">{dept.icon}</p>
                  <p className="text-[9px] font-bold" style={{ color: dept.color }}>{dept.name}</p>
                  <p className="text-[8px] text-gray-400">{dept.employees.length}名</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-px h-4 bg-gray-300" />
          </div>

          {/* AI・開発・営業 */}
          <div className="mb-3">
            <p className="text-[9px] font-bold text-gray-400 text-center mb-2">AI・開発・営業</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {departments.filter(d => ['ai_dev', 'btob', 'product_mgmt', 'customer_success', 'ad_operations', 'research'].includes(d.id)).map(dept => (
                <div key={dept.id} className="border rounded-lg px-2.5 py-1.5 text-center min-w-[70px]" style={{ borderColor: dept.color + '50', backgroundColor: dept.color + '08' }}>
                  <p className="text-sm">{dept.icon}</p>
                  <p className="text-[8px] font-bold" style={{ color: dept.color }}>{dept.name}</p>
                  <p className="text-[8px] text-gray-400">{dept.employees.length}名</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-px h-4 bg-gray-300" />
          </div>

          {/* コンテンツ・メディア */}
          <div>
            <p className="text-[9px] font-bold text-gray-400 text-center mb-2">コンテンツ・メディア</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {departments.filter(d => ['media', 'lp_web', 'design'].includes(d.id)).map(dept => (
                <div key={dept.id} className="border rounded-lg px-2.5 py-1.5 text-center min-w-[70px]" style={{ borderColor: dept.color + '50', backgroundColor: dept.color + '08' }}>
                  <p className="text-sm">{dept.icon}</p>
                  <p className="text-[8px] font-bold" style={{ color: dept.color }}>{dept.name}</p>
                  <p className="text-[8px] text-gray-400">{dept.employees.length}名</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 全AI社員一覧 */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          AI社員一覧（{allEmployeesList.length}名）
        </h3>
        <div className="space-y-3">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: dept.color + '0A', borderBottom: `1px solid ${dept.color}20` }}>
                <span className="text-sm">{dept.icon}</span>
                <span className="text-[11px] font-bold" style={{ color: dept.color }}>{dept.name}</span>
                <span className="text-[9px] text-gray-400 ml-auto">{dept.employees.length}名</span>
              </div>
              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {dept.employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition">
                    <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold" style={{ color: emp.color }}>{emp.name}</span>
                        <StatusBadge status={emp.status} />
                      </div>
                      <p className="text-[9px] text-gray-500 truncate">{emp.role}</p>
                      <p className="text-[8px] text-gray-400 truncate">{emp.currentTask}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ViewType = 'home' | 'seitai' | 'houmon' | 'app-biz' | 'consulting' | 'device'

const sidebarItems: { key: ViewType; label: string; icon: string }[] = [
  { key: 'home', label: '全社ダッシュボード', icon: '🏠' },
  { key: 'seitai', label: '整体院', icon: '🏥' },
  { key: 'houmon', label: '訪問鍼灸', icon: '🏠' },
  { key: 'app-biz', label: 'アプリ事業', icon: '📱' },
  { key: 'consulting', label: 'コンサル', icon: '🧭' },
  { key: 'device', label: '治療機器', icon: '🔧' },
]

export default function VirtualOffice() {
  const [now, setNow] = useState('')
  const [view, setView] = useState<ViewType>('home')
  const [chatTarget, setChatTarget] = useState<Employee | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleString('ja-JP'))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const totalEmployees = allEmployeesList.length

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-800 font-sans">
      {/* ヘッダー */}
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-amber-50 transition text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm shadow-sm">
                🏢
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-800">AI Solutions</h1>
                <p className="text-[9px] text-gray-400">{now}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              5事業
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {totalEmployees}名
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* モバイルオーバーレイ */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* サイドバー */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-[57px] left-0 z-40 lg:z-10
          h-full lg:h-[calc(100vh-57px)]
          w-56 bg-white border-r border-amber-200/60
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
          pt-4 lg:pt-4
        `}>
          <nav className="px-3 space-y-1">
            {sidebarItems.map(item => {
              const isActive = view === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => { setView(item.key); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 font-medium border border-amber-200'
                      : 'text-gray-500 hover:bg-amber-50/50 hover:text-gray-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}

            {/* 区切り線 */}
            <div className="border-t border-gray-100 my-2" />

            {/* 資料リンク */}
            <Link
              href="/documents"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-gray-500 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base">📄</span>
              <span>資料</span>
            </Link>

            {/* Threadsリンク */}
            <Link
              href="/threads"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-gray-500 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base">🧵</span>
              <span>Threads</span>
            </Link>
          </nav>

          <div className="mt-6 mx-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-[10px] text-amber-700 font-medium">AI Solutions v5.0</p>
            <p className="text-[9px] text-gray-400 mt-0.5">5事業 / AI社員{totalEmployees}名</p>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full">
          {view === 'home' ? (
            <HomeView />
          ) : (
            <BusinessView businessId={view as BusinessId} setChatTarget={setChatTarget} />
          )}
        </main>
      </div>

      {/* チャットモーダル */}
      {chatTarget && (
        <ChatModal employee={chatTarget} onClose={() => setChatTarget(null)} />
      )}

      <footer className="border-t border-amber-200/60 bg-white/60 py-4 text-center">
        <p className="text-[10px] text-gray-400">
          AI Solutions v5.0 — 5事業 / AI社員{totalEmployees}名体制
        </p>
      </footer>
    </div>
  )
}

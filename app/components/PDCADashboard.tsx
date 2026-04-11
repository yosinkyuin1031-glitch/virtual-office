'use client'

import { useState, useEffect, useCallback } from 'react'

interface PDCAReport {
  id: string
  cycle_type: string
  executed_at: string
  kpi_status?: string
  morning_message?: string
  daily_summary?: Record<string, unknown>
  department_reports?: string
  completion_rate?: number
  priority_tasks?: string
  priority_recalculation?: Array<Record<string, string>>
  weekly_review_message?: string
  weekly_kpi_trend?: unknown[]
  corrective_tasks?: Array<Record<string, unknown>>
}

interface TaskStats {
  total: number
  completed: number
  in_progress: number
  pending: number
  rate: number
}

export default function PDCADashboard() {
  const [reports, setReports] = useState<PDCAReport[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, completed: 0, in_progress: 0, pending: 0, rate: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [reportsRes, tasksRes] = await Promise.all([
        fetch('/api/pdca/reports?limit=10'),
        fetch('/api/auto-tasks?status=all'),
      ])

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setReports(data.reports || [])
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        const tasks = data.tasks || []
        const completed = tasks.filter((t: Record<string, string>) => t.status === 'completed').length
        const in_progress = tasks.filter((t: Record<string, string>) => t.status === 'in_progress').length
        const pending = tasks.filter((t: Record<string, string>) => t.status === 'pending').length
        const total = completed + in_progress + pending
        setTaskStats({
          total,
          completed,
          in_progress,
          pending,
          rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        })
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 60000)
    return () => clearInterval(timer)
  }, [fetchData])

  const latestMorning = reports.find(r => r.cycle_type === 'morning')
  const latestEvening = reports.find(r => r.cycle_type === 'evening')
  const latestWeekly = reports.find(r => r.cycle_type === 'weekly')

  const healthMatch = latestMorning?.kpi_status?.match(/(\d)\s*\/\s*5/)
  const healthScore = healthMatch ? parseInt(healthMatch[1]) : null

  const getHealthColor = (score: number) => {
    if (score >= 4) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' }
    if (score >= 3) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500' }
    if (score >= 2) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' }
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' }
  }

  const getTimeLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diffMin < 60) return `${diffMin}分前`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}時間前`
    return `${Math.floor(diffMin / 1440)}日前`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-48 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ステータスカード */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
            組織稼働状況
          </h3>
          <span className="text-[10px] text-gray-400">自動更新中</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className={`rounded-xl p-3 border ${healthScore ? getHealthColor(healthScore).bg : 'bg-gray-50'} ${healthScore ? getHealthColor(healthScore).border : 'border-gray-200'}`}>
            <p className="text-[10px] text-gray-500 mb-1">組織健全度</p>
            <div className="flex items-end gap-1">
              <span className={`text-2xl font-bold ${healthScore ? getHealthColor(healthScore).text : 'text-gray-400'}`}>
                {healthScore || '—'}
              </span>
              <span className="text-xs text-gray-400 mb-1">/ 5</span>
            </div>
            {healthScore && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getHealthColor(healthScore).bar}`} style={{ width: `${healthScore * 20}%` }} />
              </div>
            )}
          </div>

          <div className="rounded-xl p-3 border bg-blue-50 border-blue-200">
            <p className="text-[10px] text-gray-500 mb-1">タスク消化率</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-blue-700">{taskStats.rate}</span>
              <span className="text-xs text-gray-400 mb-1">%</span>
            </div>
            <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${taskStats.rate}%` }} />
            </div>
            <p className="text-[9px] text-gray-400 mt-1">{taskStats.completed}/{taskStats.total}件完了</p>
          </div>

          <div className="rounded-xl p-3 border bg-amber-50 border-amber-200">
            <p className="text-[10px] text-gray-500 mb-1">進行中</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-amber-700">{taskStats.in_progress}</span>
              <span className="text-xs text-gray-400 mb-1">件</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">AI社員が実行中</p>
          </div>

          <div className="rounded-xl p-3 border bg-gray-50 border-gray-200">
            <p className="text-[10px] text-gray-500 mb-1">待機中</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-gray-600">{taskStats.pending}</span>
              <span className="text-xs text-gray-400 mb-1">件</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">10分ごとに自動消化</p>
          </div>
        </div>
      </div>

      {/* PDCAレポート - 3つとも常に展開表示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 朝礼（レイア） */}
        <div className="rounded-xl border border-amber-200 overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌅</span>
                <div>
                  <p className="text-xs font-bold text-amber-800">朝礼</p>
                  <p className="text-[10px] text-gray-400">レイア</p>
                </div>
              </div>
              {latestMorning ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] text-gray-400">{getTimeLabel(latestMorning.executed_at)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-300">未実行</span>
              )}
            </div>
          </div>
          <div className="p-4">
            {latestMorning ? (
              <div className="space-y-3">
                {latestMorning.morning_message && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 mb-1">レイアからのメッセージ</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {latestMorning.morning_message}
                    </p>
                  </div>
                )}
                {latestMorning.priority_tasks && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 mb-1">今日の最優先事項</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {typeof latestMorning.priority_tasks === 'string'
                        ? latestMorning.priority_tasks
                        : JSON.stringify(latestMorning.priority_tasks)}
                    </p>
                  </div>
                )}
                {latestMorning.corrective_tasks && Array.isArray(latestMorning.corrective_tasks) && (
                  <p className="text-[10px] text-gray-400">
                    是正タスク {latestMorning.corrective_tasks.length}件を自動生成
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">レポートなし</p>
            )}
          </div>
        </div>

        {/* 日報（ミコ） */}
        <div className="rounded-xl border border-purple-200 overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-xs font-bold text-purple-800">日報</p>
                  <p className="text-[10px] text-gray-400">ミコ</p>
                </div>
              </div>
              {latestEvening ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[10px] text-gray-400">{getTimeLabel(latestEvening.executed_at)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-300">未実行</span>
              )}
            </div>
          </div>
          <div className="p-4">
            {latestEvening ? (
              <div className="space-y-3">
                {latestEvening.department_reports && (
                  <div>
                    <p className="text-[10px] font-bold text-purple-700 mb-1">部署別レポート</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {typeof latestEvening.department_reports === 'string'
                        ? latestEvening.department_reports
                        : JSON.stringify(latestEvening.department_reports)}
                    </p>
                  </div>
                )}
                {latestEvening.completion_rate !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">完了率:</span>
                    <span className="text-sm font-bold text-purple-700">{latestEvening.completion_rate}%</span>
                  </div>
                )}
                {latestEvening.priority_recalculation && Array.isArray(latestEvening.priority_recalculation) && latestEvening.priority_recalculation.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-purple-700 mb-1">明日の優先タスク</p>
                    <ul className="space-y-1">
                      {latestEvening.priority_recalculation.map((t, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1">
                          <span className={`text-[10px] px-1 rounded ${t.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {t.priority}
                          </span>
                          <span>{t.department}: {t.task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">レポートなし</p>
            )}
          </div>
        </div>

        {/* 週次レビュー（レイア） */}
        <div className="rounded-xl border border-blue-200 overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-xs font-bold text-blue-800">週次レビュー</p>
                  <p className="text-[10px] text-gray-400">レイア</p>
                </div>
              </div>
              {latestWeekly ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] text-gray-400">{getTimeLabel(latestWeekly.executed_at)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-300">未実行</span>
              )}
            </div>
          </div>
          <div className="p-4">
            {latestWeekly ? (
              <div className="space-y-3">
                {latestWeekly.weekly_review_message && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-700 mb-1">レイアの週次メッセージ</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {latestWeekly.weekly_review_message}
                    </p>
                  </div>
                )}
                {latestWeekly.weekly_kpi_trend && (
                  <p className="text-[10px] text-gray-400">
                    KPIスナップショット {Array.isArray(latestWeekly.weekly_kpi_trend) ? latestWeekly.weekly_kpi_trend.length : 0}日分を分析
                  </p>
                )}
                {latestWeekly.corrective_tasks && Array.isArray(latestWeekly.corrective_tasks) && latestWeekly.corrective_tasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-700 mb-1">是正タスク</p>
                    <ul className="space-y-1">
                      {latestWeekly.corrective_tasks.map((t, i) => (
                        <li key={i} className="text-xs text-gray-600">
                          {String(t.title || t.task || JSON.stringify(t))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">レポートなし</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

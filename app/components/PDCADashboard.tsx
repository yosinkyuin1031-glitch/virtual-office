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
  const [expanded, setExpanded] = useState<string | null>(null)
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
    const timer = setInterval(fetchData, 60000) // 1分ごと更新
    return () => clearInterval(timer)
  }, [fetchData])

  const latestMorning = reports.find(r => r.cycle_type === 'morning')
  const latestEvening = reports.find(r => r.cycle_type === 'evening')
  const latestWeekly = reports.find(r => r.cycle_type === 'weekly')

  // 健全度を抽出（CEOブレインの結果から）
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

        {/* 4つのメトリクスカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* 健全度 */}
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

          {/* タスク消化率 */}
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

          {/* 進行中タスク */}
          <div className="rounded-xl p-3 border bg-amber-50 border-amber-200">
            <p className="text-[10px] text-gray-500 mb-1">進行中</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-amber-700">{taskStats.in_progress}</span>
              <span className="text-xs text-gray-400 mb-1">件</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">AI社員が実行中</p>
          </div>

          {/* 待機タスク */}
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

      {/* PDCAレポートカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 朝礼（レイア） */}
        <ReportCard
          title="朝礼"
          icon="🌅"
          speaker="レイア"
          color="amber"
          report={latestMorning}
          expanded={expanded === 'morning'}
          onToggle={() => setExpanded(expanded === 'morning' ? null : 'morning')}
          getTimeLabel={getTimeLabel}
          renderContent={() => (
            <div className="space-y-3">
              {latestMorning?.morning_message && (
                <div>
                  <p className="text-[10px] font-bold text-amber-700 mb-1">レイアからのメッセージ</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {latestMorning.morning_message}
                  </p>
                </div>
              )}
              {latestMorning?.priority_tasks && (
                <div>
                  <p className="text-[10px] font-bold text-amber-700 mb-1">今日の最優先事項</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {typeof latestMorning.priority_tasks === 'string'
                      ? latestMorning.priority_tasks
                      : JSON.stringify(latestMorning.priority_tasks)}
                  </p>
                </div>
              )}
              {latestMorning?.corrective_tasks && Array.isArray(latestMorning.corrective_tasks) && (
                <p className="text-[10px] text-gray-400">
                  是正タスク {latestMorning.corrective_tasks.length}件を自動生成
                </p>
              )}
            </div>
          )}
        />

        {/* 日報（ミコ） */}
        <ReportCard
          title="日報"
          icon="🌙"
          speaker="ミコ"
          color="purple"
          report={latestEvening}
          expanded={expanded === 'evening'}
          onToggle={() => setExpanded(expanded === 'evening' ? null : 'evening')}
          getTimeLabel={getTimeLabel}
          renderContent={() => (
            <div className="space-y-3">
              {latestEvening?.department_reports && (
                <div>
                  <p className="text-[10px] font-bold text-purple-700 mb-1">部署別レポート</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {typeof latestEvening.department_reports === 'string'
                      ? latestEvening.department_reports
                      : JSON.stringify(latestEvening.department_reports)}
                  </p>
                </div>
              )}
              {latestEvening?.completion_rate !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">完了率:</span>
                  <span className="text-sm font-bold text-purple-700">{latestEvening.completion_rate}%</span>
                </div>
              )}
            </div>
          )}
        />

        {/* 週次（レイア） */}
        <ReportCard
          title="週次レビュー"
          icon="📊"
          speaker="レイア"
          color="blue"
          report={latestWeekly}
          expanded={expanded === 'weekly'}
          onToggle={() => setExpanded(expanded === 'weekly' ? null : 'weekly')}
          getTimeLabel={getTimeLabel}
          renderContent={() => (
            <div className="space-y-3">
              {latestWeekly?.weekly_review_message && (
                <div>
                  <p className="text-[10px] font-bold text-blue-700 mb-1">レイアの週次メッセージ</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {latestWeekly.weekly_review_message}
                  </p>
                </div>
              )}
              {latestWeekly?.weekly_kpi_trend && (
                <p className="text-[10px] text-gray-400">
                  KPIスナップショット {Array.isArray(latestWeekly.weekly_kpi_trend) ? latestWeekly.weekly_kpi_trend.length : 0}日分を分析
                </p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  )
}

// レポートカードコンポーネント
function ReportCard({
  title,
  icon,
  speaker,
  color,
  report,
  expanded,
  onToggle,
  getTimeLabel,
  renderContent,
}: {
  title: string
  icon: string
  speaker: string
  color: 'amber' | 'purple' | 'blue'
  report: PDCAReport | undefined
  expanded: boolean
  onToggle: () => void
  getTimeLabel: (s: string) => string
  renderContent: () => React.ReactNode
}) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-400' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-400' },
  }
  const c = colorMap[color]

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden bg-white shadow-sm`}>
      <button
        onClick={onToggle}
        className={`w-full p-4 text-left hover:${c.bg} transition`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <p className={`text-xs font-bold ${c.text}`}>{title}</p>
              <p className="text-[10px] text-gray-400">{speaker}</p>
            </div>
          </div>
          {report ? (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
              <span className="text-[10px] text-gray-400">{getTimeLabel(report.executed_at)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-300">未実行</span>
          )}
        </div>
      </button>

      {expanded && report && (
        <div className={`px-4 pb-4 border-t ${c.border} ${c.bg}`}>
          <div className="pt-3">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  )
}

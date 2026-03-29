'use client'

import { useState, useEffect, useCallback } from 'react'

interface ChannelStatus {
  name: string
  lastUpload: string | null
  lastStatus: 'success' | 'failed' | 'unknown'
  lastVideoId: string | null
  lastTitle: string | null
  cronSchedule: string
}

interface LiveStreamStatus {
  running: boolean
  pid: number | null
  channel: string
}

interface YouTubeStatus {
  channels: ChannelStatus[]
  liveStream: LiveStreamStatus
  timestamp: string
}

export default function YouTubeDashboard() {
  const [status, setStatus] = useState<YouTubeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/youtube-status')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setStatus(data)
      setError(null)
    } catch {
      setError('取得失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // 1分ごと更新
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleRestartLive = async () => {
    if (restarting) return
    setRestarting(true)
    try {
      const res = await fetch('/api/youtube-status/restart-live', {
        method: 'POST',
        headers: { 'x-cron-secret': 'manual-restart' },
      })
      const data = await res.json()
      if (data.success) {
        setTimeout(fetchStatus, 3000)
      }
    } catch {
      // silent
    } finally {
      setRestarting(false)
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'success': return <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">正常</span>
      case 'failed': return <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">失敗</span>
      default: return <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded text-[10px] font-bold">不明</span>
    }
  }

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '不明'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    return `${Math.floor(diffHours / 24)}日前`
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 animate-pulse">YouTube状態を取得中...</p>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-red-400">{error || 'データなし'}</p>
        <button onClick={fetchStatus} className="text-[10px] text-indigo-400 mt-1">再取得</button>
      </div>
    )
  }

  const failedCount = status.channels.filter(c => c.lastStatus === 'failed').length
  const allOk = failedCount === 0 && status.liveStream.running

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📺</span>
          <span className="text-sm font-bold text-white">YouTube管理</span>
          {allOk ? (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold">全正常</span>
          ) : (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold animate-pulse">
              {failedCount > 0 && `${failedCount}ch異常`}
              {!status.liveStream.running && ' ライブ停止'}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* ライブ配信 */}
          <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
            status.liveStream.running
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status.liveStream.running ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
              <div>
                <p className="text-xs font-bold text-white">
                  24時間ライブ
                  {status.liveStream.running ? ' 配信中' : ' 停止中'}
                </p>
                <p className="text-[10px] text-gray-500">{status.liveStream.channel} | PID: {status.liveStream.pid || '-'}</p>
              </div>
            </div>
            {!status.liveStream.running && (
              <button
                onClick={handleRestartLive}
                disabled={restarting}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {restarting ? '起動中...' : '再起動'}
              </button>
            )}
          </div>

          {/* チャンネル一覧 */}
          <div className="space-y-1.5">
            {status.channels.map((ch) => (
              <div key={ch.name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-gray-200 truncate">{ch.name}</p>
                    {getStatusBadge(ch.lastStatus)}
                  </div>
                  <p className="text-[9px] text-gray-500 truncate mt-0.5">
                    {ch.lastTitle || 'タイトル不明'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-[10px] text-gray-400">{getTimeAgo(ch.lastUpload)}</p>
                  <p className="text-[9px] text-gray-600">{ch.cronSchedule.split(' / ')[0]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] text-gray-600">
              更新: {new Date(status.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button onClick={fetchStatus} className="text-[10px] text-indigo-400 hover:text-indigo-300">
              更新
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

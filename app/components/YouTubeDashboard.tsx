'use client'

import { useState, useEffect, useCallback } from 'react'

// === 既存の型定義 ===
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

// === アナリティクス型定義 ===
interface VideoInfo {
  video_id: string
  title: string
  views: number
  likes: number
  comments?: number
  is_shorts?: boolean
  published_at?: string
  channel?: string
}

interface ChannelAnalytics {
  stats: {
    channel_id: string
    title: string
    subscriber_count: number
    total_views: number
    video_count: number
  }
  recent_videos: VideoInfo[]
  top_videos: VideoInfo[]
  growth: {
    subscriber_growth_daily: number
    subscriber_growth_weekly: number
    views_growth_daily: number
    views_growth_weekly: number
    trend: string
  }
  recommendations: {
    text: string
    category: string
    priority: number
  }[]
  collected_at: string
}

interface AnalyticsData {
  summary: {
    total_subscribers: number
    total_views: number
    total_videos: number
    channel_count: number
  }
  channels: Record<string, ChannelAnalytics>
  histories: Record<string, { date: string; subscriber_count: number; total_views: number; video_count: number }[]>
  top_recommendations: { text: string; category: string; priority: number; channel: string }[]
  top_videos: VideoInfo[]
  collected_at: string | null
}

type TabType = 'status' | 'analytics' | 'strategy'

export default function YouTubeDashboard() {
  const [status, setStatus] = useState<YouTubeStatus | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('status')
  const [collecting, setCollecting] = useState(false)

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

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/youtube-analytics')
      if (!res.ok) return
      const data = await res.json()
      setAnalytics(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchAnalytics()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchAnalytics])

  const handleRestartLive = async () => {
    if (restarting) return
    setRestarting(true)
    try {
      const res = await fetch('/api/youtube-status/restart-live', {
        method: 'POST',
        headers: { 'x-cron-secret': 'manual-restart' },
      })
      const data = await res.json()
      if (data.success) setTimeout(fetchStatus, 3000)
    } catch {
      // silent
    } finally {
      setRestarting(false)
    }
  }

  const handleCollectAnalytics = async () => {
    if (collecting) return
    setCollecting(true)
    try {
      await fetch('/api/youtube-analytics', { method: 'POST' })
      setTimeout(fetchAnalytics, 3000)
    } catch {
      // silent
    } finally {
      setCollecting(false)
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'success': return <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">OK</span>
      case 'failed': return <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">NG</span>
      default: return <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded text-[10px] font-bold">--</span>
    }
  }

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '不明'
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    return `${Math.floor(diffHours / 24)}日前`
  }

  const formatNumber = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case '加速中': return '🚀'
      case '成長中': return '📈'
      case '横ばい': return '➡️'
      case '減少中': return '📉'
      default: return '📊'
    }
  }

  const getPriorityColor = (p: number) => {
    if (p >= 9) return 'text-red-400 bg-red-500/10 border-red-500/30'
    if (p >= 7) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
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
          {analytics?.summary && (
            <span className="text-[10px] text-gray-400">
              {formatNumber(analytics.summary.total_subscribers)}人 / {formatNumber(analytics.summary.total_views)}回
            </span>
          )}
          {allOk ? (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold">正常</span>
          ) : (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold animate-pulse">
              {failedCount > 0 && `${failedCount}ch異常`}
              {!status.liveStream.running && ' LIVE停止'}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* タブ切り替え */}
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-0.5">
            {([
              { id: 'status' as TabType, label: '稼働状態' },
              { id: 'analytics' as TabType, label: 'アナリティクス' },
              { id: 'strategy' as TabType, label: '成長戦略' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* === 稼働状態タブ === */}
          {activeTab === 'status' && (
            <div className="space-y-2">
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
                      24時間ライブ {status.liveStream.running ? '配信中' : '停止中'}
                    </p>
                    <p className="text-[10px] text-gray-500">{status.liveStream.channel} | PID: {status.liveStream.pid || '-'}</p>
                  </div>
                </div>
                {!status.liveStream.running && (
                  <button
                    onClick={handleRestartLive}
                    disabled={restarting}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-500 disabled:opacity-50"
                  >
                    {restarting ? '起動中...' : '再起動'}
                  </button>
                )}
              </div>

              {/* チャンネル一覧 */}
              {status.channels.map((ch) => (
                <div key={ch.name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-medium text-gray-200 truncate">{ch.name}</p>
                      {getStatusBadge(ch.lastStatus)}
                    </div>
                    <p className="text-[9px] text-gray-500 truncate mt-0.5">{ch.lastTitle || '-'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-[10px] text-gray-400">{getTimeAgo(ch.lastUpload)}</p>
                    <p className="text-[9px] text-gray-600">{ch.cronSchedule.split(' / ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === アナリティクスタブ === */}
          {activeTab === 'analytics' && (
            <div className="space-y-3">
              {analytics?.summary ? (
                <>
                  {/* サマリーカード */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">総登録者</p>
                      <p className="text-lg font-bold text-white">{analytics.summary.total_subscribers}</p>
                      <p className="text-[9px] text-gray-500">{analytics.summary.channel_count}ch合計</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">総再生数</p>
                      <p className="text-lg font-bold text-white">{formatNumber(analytics.summary.total_views)}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">総動画数</p>
                      <p className="text-lg font-bold text-white">{analytics.summary.total_videos}</p>
                    </div>
                  </div>

                  {/* チャンネル別詳細 */}
                  <div className="space-y-2">
                    {Object.entries(analytics.channels).map(([name, ch]) => (
                      <div key={name} className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-bold text-white">{name}</p>
                            <span className="text-[10px]">{getTrendIcon(ch.growth.trend)}</span>
                            <span className="text-[9px] text-gray-400">{ch.growth.trend}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400">
                            {ch.stats.subscriber_count}人
                          </span>
                        </div>

                        {/* 数値バー */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[9px] text-gray-500">登録者</p>
                            <p className="text-xs font-bold text-white">{ch.stats.subscriber_count}</p>
                            <p className={`text-[9px] ${ch.growth.subscriber_growth_daily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {ch.growth.subscriber_growth_daily >= 0 ? '+' : ''}{ch.growth.subscriber_growth_daily}/日
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500">再生数</p>
                            <p className="text-xs font-bold text-white">{formatNumber(ch.stats.total_views)}</p>
                            <p className={`text-[9px] ${ch.growth.views_growth_daily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              +{formatNumber(ch.growth.views_growth_daily)}/日
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500">動画数</p>
                            <p className="text-xs font-bold text-white">{ch.stats.video_count}</p>
                            <p className="text-[9px] text-gray-500">本</p>
                          </div>
                        </div>

                        {/* 最近の人気動画 */}
                        {ch.top_videos.length > 0 && (
                          <div>
                            <p className="text-[9px] text-gray-500 mb-1">TOP動画</p>
                            {ch.top_videos.slice(0, 2).map((v, i) => (
                              <div key={v.video_id} className="flex items-center justify-between py-0.5">
                                <p className="text-[9px] text-gray-300 truncate flex-1">
                                  {i + 1}. {v.title.slice(0, 40)}
                                </p>
                                <span className="text-[9px] text-indigo-400 ml-1 flex-shrink-0">
                                  {formatNumber(v.views)}回
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 収集ボタン */}
                  <button
                    onClick={handleCollectAnalytics}
                    disabled={collecting}
                    className="w-full py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-[10px] font-bold hover:bg-indigo-600/30 disabled:opacity-50"
                  >
                    {collecting ? '収集中...' : '最新データを収集'}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-500 mb-2">アナリティクスデータなし</p>
                  <button
                    onClick={handleCollectAnalytics}
                    disabled={collecting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {collecting ? '収集中...' : '初回データを収集'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === 成長戦略タブ === */}
          {activeTab === 'strategy' && (
            <div className="space-y-3">
              {analytics?.top_recommendations && analytics.top_recommendations.length > 0 ? (
                <>
                  {/* 推奨アクション */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold mb-2">AI推奨アクション</p>
                    <div className="space-y-1.5">
                      {analytics.top_recommendations.map((rec, i) => (
                        <div key={i} className={`p-2.5 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold flex-shrink-0">
                              P{rec.priority}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] leading-relaxed">{rec.text}</p>
                              <p className="text-[9px] opacity-60 mt-0.5">{rec.channel}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 全チャンネル横断TOP動画 */}
                  {analytics.top_videos && analytics.top_videos.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold mb-2">全チャンネルTOP動画</p>
                      <div className="space-y-1">
                        {analytics.top_videos.map((v, i) => (
                          <div key={v.video_id} className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
                            <span className={`text-xs font-bold flex-shrink-0 w-5 text-center ${
                              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'
                            }`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-white truncate">{v.title}</p>
                              <p className="text-[9px] text-gray-500">{v.channel}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] font-bold text-indigo-400">{formatNumber(v.views)}回</p>
                              <p className="text-[9px] text-gray-500">{v.likes || 0} like</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 収益化までの道のり */}
                  {analytics.summary && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-[10px] text-yellow-400 font-bold mb-2">収益化への進捗</p>
                      <div className="space-y-2">
                        {/* 登録者1000人 */}
                        <div>
                          <div className="flex justify-between text-[9px] mb-0.5">
                            <span className="text-gray-400">登録者 1,000人</span>
                            <span className="text-yellow-400">
                              {Math.min(100, Math.round(analytics.summary.total_subscribers / 10))}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, analytics.summary.total_subscribers / 10)}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                            あと{Math.max(0, 1000 - analytics.summary.total_subscribers)}人
                          </p>
                        </div>
                        {/* 総再生4000時間 */}
                        <div>
                          <div className="flex justify-between text-[9px] mb-0.5">
                            <span className="text-gray-400">視聴時間 4,000時間</span>
                            <span className="text-yellow-400">データ収集中</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-600 rounded-full w-[5%]" />
                          </div>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                            YouTube Studioで確認
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BGM系チャンネル投稿戦略 */}
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 font-bold mb-2">現在の投稿戦略</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">本編投稿</span>
                        <span className="text-white">1本/日 x 4ch = 4本/日</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Shorts投稿</span>
                        <span className="text-white">3本/日 x 4ch = 12本/日</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">24時間ライブ</span>
                        <span className="text-white">月光ヒーリング (1ch)</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">週間合計</span>
                        <span className="text-indigo-400 font-bold">112本/週</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-500 mb-2">データを収集すると戦略提案が表示されます</p>
                  <button
                    onClick={handleCollectAnalytics}
                    disabled={collecting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    {collecting ? '収集中...' : 'データを収集'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* フッター */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] text-gray-600">
              {analytics?.collected_at
                ? `Analytics: ${new Date(analytics.collected_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : ''}
              {' | '}
              Status: {new Date(status.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button onClick={() => { fetchStatus(); fetchAnalytics() }} className="text-[10px] text-indigo-400 hover:text-indigo-300">
              更新
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ANALYTICS_DIR = '/Users/ooguchiyouhei/youtube-analytics/data'

interface ChannelAnalytics {
  stats: {
    channel_id: string
    title: string
    subscriber_count: number
    total_views: number
    video_count: number
  }
  recent_videos: {
    video_id: string
    title: string
    published_at: string
    views: number
    likes: number
    comments: number
    is_shorts: boolean
    duration: string
  }[]
  top_videos: {
    video_id: string
    title: string
    views: number
    likes: number
  }[]
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

interface HistoryEntry {
  date: string
  subscriber_count: number
  total_views: number
  video_count: number
}

export async function GET() {
  try {
    // 最新のアナリティクスデータ読み込み
    const latestPath = path.join(ANALYTICS_DIR, 'latest_analytics.json')
    let latestData: Record<string, ChannelAnalytics> = {}

    try {
      const raw = await fs.readFile(latestPath, 'utf-8')
      latestData = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'アナリティクスデータなし', channels: {} }, { status: 200 })
    }

    // 各チャンネルの履歴データも読み込み（グラフ用）
    const channelNames = Object.keys(latestData)
    const histories: Record<string, HistoryEntry[]> = {}

    await Promise.all(
      channelNames.map(async (name) => {
        try {
          const histPath = path.join(ANALYTICS_DIR, `${name}_history.json`)
          const raw = await fs.readFile(histPath, 'utf-8')
          histories[name] = JSON.parse(raw)
        } catch {
          histories[name] = []
        }
      })
    )

    // サマリー計算
    const totalSubscribers = Object.values(latestData).reduce(
      (sum, ch) => sum + (ch.stats?.subscriber_count || 0), 0
    )
    const totalViews = Object.values(latestData).reduce(
      (sum, ch) => sum + (ch.stats?.total_views || 0), 0
    )
    const totalVideos = Object.values(latestData).reduce(
      (sum, ch) => sum + (ch.stats?.video_count || 0), 0
    )

    // 全チャンネル横断の推奨事項（優先度順TOP5）
    const allRecs = Object.entries(latestData).flatMap(([name, ch]) =>
      (ch.recommendations || []).map(r => ({ ...r, channel: name }))
    ).sort((a, b) => b.priority - a.priority).slice(0, 8)

    // ベストパフォーマンス動画（全チャンネル横断）
    const allTopVideos = Object.entries(latestData).flatMap(([name, ch]) =>
      (ch.top_videos || []).map(v => ({ ...v, channel: name }))
    ).sort((a, b) => b.views - a.views).slice(0, 5)

    return NextResponse.json({
      summary: {
        total_subscribers: totalSubscribers,
        total_views: totalViews,
        total_videos: totalVideos,
        channel_count: channelNames.length,
      },
      channels: latestData,
      histories,
      top_recommendations: allRecs,
      top_videos: allTopVideos,
      collected_at: Object.values(latestData)[0]?.collected_at || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Analytics fetch failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// 手動でアナリティクス収集をトリガー
export async function POST() {
  try {
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)

    const { stdout, stderr } = await execAsync(
      'cd /Users/ooguchiyouhei/youtube-analytics && /usr/bin/python3 collect_analytics.py',
      { timeout: 120000 }
    )

    return NextResponse.json({
      success: true,
      output: (stdout || '').trim().slice(-2000),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

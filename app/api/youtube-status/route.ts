import { NextResponse } from 'next/server'
import { getSupabase } from '../../lib/pdca-utils'

export const runtime = 'nodejs'

// チャンネル定義（4チャンネル）
const CHANNELS = [
  {
    name: '月光ヒーリング',
    cronSchedule: '本編18:00 / Shorts 9:00,14:00,20:00',
    hasLive: true,
  },
  {
    name: 'Lo-Fi Cafe BGM',
    cronSchedule: '本編18:00 / Shorts 12:00,21:00',
    hasLive: false,
  },
  {
    name: 'Nature Sound ASMR',
    cronSchedule: '本編17:00 / Shorts 10:00,19:00',
    hasLive: false,
  },
  {
    name: 'ゆるり瞑想',
    cronSchedule: '本編16:00 / Shorts 8:00,22:00',
    hasLive: false,
  },
]

export async function GET() {
  try {
    const supabase = getSupabase()

    // 各チャンネルの最新投稿をDBから取得（本編・Shorts別に最新1件ずつ）
    const channelResults = await Promise.all(
      CHANNELS.map(async (channel) => {
        // 最新の本編投稿
        const { data: latestMain } = await supabase
          .from('vo_youtube_posts')
          .select('*')
          .eq('channel', channel.name)
          .eq('video_type', 'main')
          .order('posted_at', { ascending: false })
          .limit(1)

        // 最新のShorts投稿
        const { data: latestShorts } = await supabase
          .from('vo_youtube_posts')
          .select('*')
          .eq('channel', channel.name)
          .eq('video_type', 'shorts')
          .order('posted_at', { ascending: false })
          .limit(1)

        // 今日の投稿数
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        todayStart.setHours(todayStart.getHours() - 9) // JST→UTC

        const { data: todayPosts } = await supabase
          .from('vo_youtube_posts')
          .select('id, video_type, status')
          .eq('channel', channel.name)
          .gte('posted_at', todayStart.toISOString())

        const todayMain = (todayPosts || []).filter(p => p.video_type === 'main' && p.status === 'success').length
        const todayShorts = (todayPosts || []).filter(p => p.video_type === 'shorts' && p.status === 'success').length
        const todayFailed = (todayPosts || []).filter(p => p.status === 'failed').length

        const main = latestMain?.[0] || null
        const shorts = latestShorts?.[0] || null

        // 最新の投稿（本編 or Shorts で新しい方）
        const latest = main && shorts
          ? (new Date(main.posted_at) > new Date(shorts.posted_at) ? main : shorts)
          : main || shorts

        return {
          name: channel.name,
          cronSchedule: channel.cronSchedule,
          hasLive: channel.hasLive,
          lastUpload: latest?.posted_at || null,
          lastStatus: latest?.status === 'success' ? 'success' as const
            : latest?.status === 'failed' ? 'failed' as const
            : 'unknown' as const,
          lastVideoId: latest?.video_id || null,
          lastTitle: latest?.title || null,
          today: {
            main: todayMain,
            shorts: todayShorts,
            failed: todayFailed,
          },
          latestMain: main ? {
            title: main.title,
            video_id: main.video_id,
            status: main.status,
            posted_at: main.posted_at,
          } : null,
          latestShorts: shorts ? {
            title: shorts.title,
            video_id: shorts.video_id,
            status: shorts.status,
            posted_at: shorts.posted_at,
          } : null,
        }
      })
    )

    return NextResponse.json({
      channels: channelResults,
      liveStream: {
        running: false, // ライブ状態はローカルでしか確認できないため、別途対応
        pid: null,
        channel: '月光ヒーリング',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get YouTube status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

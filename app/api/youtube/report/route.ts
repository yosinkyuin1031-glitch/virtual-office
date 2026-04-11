import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../lib/pdca-utils'

export const runtime = 'nodejs'

// チャンネル表示名マッピング
const CHANNEL_LABELS: Record<string, string> = {
  'youtube-healing-music': '月光ヒーリング',
  'youtube-lofi-bgm': 'Lo-Fi Cafe BGM',
  'youtube-nature-asmr': 'Nature Sound ASMR',
  'youtube-meditation': 'ゆるり瞑想',
  'youtube-healing-english': 'Healing English',
  'youtube-sleep-global': 'Sleep Global',
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  main: '本編',
  shorts: 'Shorts',
  live: 'ライブ',
}

// POST: 各チャンネルのmain.pyから投稿完了報告を受信
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      channel,       // youtube-healing-music, youtube-lofi-bgm, etc.
      video_type,    // main, shorts
      title,         // 動画タイトル
      video_id,      // YouTubeの動画ID
      category,      // sleep, focus, meditation, autonomic
      status,        // success, failed
      duration_seconds,
      file_size_mb,
      processing_time_minutes,
    } = body

    if (!channel) {
      return NextResponse.json({ error: 'channel is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const channelLabel = CHANNEL_LABELS[channel] || channel
    const typeLabel = VIDEO_TYPE_LABELS[video_type] || video_type || '動画'
    const postStatus = status || 'success'

    // DB保存
    await supabase.from('vo_youtube_posts').insert({
      channel: channelLabel,
      video_type: video_type || 'main',
      title: title || null,
      video_id: video_id || null,
      category: category || null,
      status: postStatus,
      duration_seconds: duration_seconds || null,
      file_size_mb: file_size_mb || null,
      processing_time_minutes: processing_time_minutes || null,
    })

    // LINE個別通知は廃止（22時の日報にまとめて報告）

    return NextResponse.json({ status: 'ok', channel: channelLabel, recorded: true })
  } catch (error) {
    console.error('YouTube report error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// GET: 投稿履歴を取得（ダッシュボード用）
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '7')
    const channel = url.searchParams.get('channel')

    const since = new Date()
    since.setDate(since.getDate() - days)

    let query = supabase
      .from('vo_youtube_posts')
      .select('*')
      .gte('posted_at', since.toISOString())
      .order('posted_at', { ascending: false })
      .limit(100)

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data: posts } = await query

    // 日別・チャンネル別の集計
    const summary: Record<string, { main: number; shorts: number; failed: number }> = {}
    for (const post of posts || []) {
      const ch = post.channel
      if (!summary[ch]) summary[ch] = { main: 0, shorts: 0, failed: 0 }
      if (post.status === 'failed') {
        summary[ch].failed++
      } else if (post.video_type === 'shorts') {
        summary[ch].shorts++
      } else {
        summary[ch].main++
      }
    }

    // 今日の投稿数
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const todayPosts = (posts || []).filter(p => p.posted_at?.startsWith(todayStr))

    return NextResponse.json({
      posts: posts || [],
      summary,
      today: {
        total: todayPosts.length,
        success: todayPosts.filter(p => p.status === 'success').length,
        failed: todayPosts.filter(p => p.status === 'failed').length,
      },
    })
  } catch (error) {
    console.error('YouTube posts fetch error:', error)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}

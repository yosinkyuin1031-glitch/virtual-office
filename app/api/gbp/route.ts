import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 60

const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const OGUCHI_NAME = '大口神経整体院'
const OGUCHI_AREA = '大阪市住吉区長居'

function jstDate(d: Date = new Date()): string {
  const jst = new Date(d.getTime() + 9 * 3600 * 1000)
  return jst.toISOString().slice(0, 10)
}

function pickByDate<T>(arr: T[], dateStr: string): T | undefined {
  if (arr.length === 0) return undefined
  const seed = parseInt(dateStr.replace(/-/g, '').slice(-4))
  return arr[seed % arr.length]
}

async function generatePostText(keyword: string, videoTitle: string | null, videoUrl: string | null): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const client = new Anthropic({ apiKey })

  const videoBlock = videoUrl && videoTitle
    ? `\n\n【動画CTA】末尾に「詳しくは院内ブログでお話ししてます！」と動画リンクを掲載：\n${videoUrl}（${videoTitle}）`
    : ''

  const prompt = `あなたは${OGUCHI_NAME}（${OGUCHI_AREA}）の院長「大口陽平」本人として、Googleビジネスプロフィール（GBP）の毎日投稿文を書いてください。

【症状テーマ】${keyword}

【院情報】
- 院名: ${OGUCHI_NAME}
- 立地: ${OGUCHI_AREA}（長居駅すぐ）
- 強み: 重症慢性痛・神経痛専門、神経学的検査による根本原因アプローチ

【投稿のルール】
- 文字数: 250〜350文字
- 一人称は「私」または「僕」（自然なほうを選ぶ）
- AI感が出る記号・絵文字・引用符は使わない
- 見出し冒頭に「こんにちは！${OGUCHI_NAME}の大口です！」必須
- 「${keyword}」というキーワードは本文中に2回程度自然に登場させる
- 地域名「${OGUCHI_AREA}」または「住吉区」「長居」のいずれか1つ自然に挿入
- 押し売りNG。患者目線で寄り添う
- 嘘・誇張禁止（「治ります」「完治」など断定NG）${videoBlock}

【出力】
本文のみ。冒頭挨拶を含む。動画リンクがある場合は末尾の独立行に貼る。`

  // 単純な投稿生成 → Haiku（コスト1/3）。品質低下時のみ Sonnet に戻す
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  return text
}

async function generateForDate(dateStr: string, force = false): Promise<{ ok: boolean; post?: unknown; reason?: string }> {
  // 既存チェック
  const { data: existing } = await supabase
    .from('office_gbp_posts')
    .select('*')
    .eq('clinic_id', OGUCHI_CLINIC_ID)
    .eq('scheduled_date', dateStr)
    .maybeSingle()
  if (existing && !force) return { ok: true, post: existing, reason: 'already_exists' }

  // キーワード選択（symptom）
  const { data: kws } = await supabase
    .from('office_keyword_settings')
    .select('keyword')
    .eq('clinic_id', OGUCHI_CLINIC_ID)
    .eq('category', 'symptom')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  const keywords = (kws || []).map((k) => k.keyword)
  if (keywords.length === 0) return { ok: false, reason: 'no_keywords' }
  const keyword = pickByDate(keywords, dateStr) || keywords[0]

  // 動画選択
  const { data: vids } = await supabase
    .from('office_gbp_videos')
    .select('title,url')
    .eq('clinic_id', OGUCHI_CLINIC_ID)
    .eq('active', true)
    .order('sort_order', { ascending: true })
  const videos = vids || []
  const video = videos.length > 0 ? pickByDate(videos, dateStr) : null

  const text = await generatePostText(keyword, video?.title || null, video?.url || null)

  const insertRow = {
    clinic_id: OGUCHI_CLINIC_ID,
    scheduled_date: dateStr,
    post_text: text,
    keyword,
    video_url: video?.url || null,
    video_title: video?.title || null,
    status: 'pending' as const,
  }

  let saved
  if (existing && force) {
    const { data, error } = await supabase
      .from('office_gbp_posts')
      .update({ post_text: text, keyword, video_url: insertRow.video_url, video_title: insertRow.video_title, status: 'pending' })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return { ok: false, reason: error.message }
    saved = data
  } else {
    const { data, error } = await supabase.from('office_gbp_posts').insert(insertRow).select().single()
    if (error) return { ok: false, reason: error.message }
    saved = data
  }
  return { ok: true, post: saved }
}

// =================== GET: 投稿一覧＋動画一覧 ===================
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const limit = Math.min(parseInt(sp.get('limit') || '30'), 100)

    const { data: posts } = await supabase
      .from('office_gbp_posts')
      .select('*')
      .eq('clinic_id', OGUCHI_CLINIC_ID)
      .order('scheduled_date', { ascending: false })
      .limit(limit)

    const { data: videos } = await supabase
      .from('office_gbp_videos')
      .select('*')
      .eq('clinic_id', OGUCHI_CLINIC_ID)
      .order('sort_order', { ascending: true })

    const today = jstDate()
    const todayPost = (posts || []).find((p) => p.scheduled_date === today)

    return NextResponse.json({ posts: posts || [], videos: videos || [], today, todayPost: todayPost || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// =================== POST: 生成・動画追加・cron ===================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action === 'generate') {
      const date = body.date || jstDate()
      const force = !!body.force
      const r = await generateForDate(date, force)
      return NextResponse.json(r)
    }

    if (action === 'cron') {
      // Vercel Cron 経由（X-Cron-Secret で認証）
      const secret = req.headers.get('x-cron-secret')
      if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
      const date = jstDate()
      const r = await generateForDate(date, false)
      return NextResponse.json(r)
    }

    if (action === 'add_video') {
      const title: string = (body.title || '').trim()
      const url: string = (body.url || '').trim()
      if (!title || !url) return NextResponse.json({ error: 'title and url required' }, { status: 400 })
      const { data: maxRow } = await supabase
        .from('office_gbp_videos')
        .select('sort_order')
        .eq('clinic_id', OGUCHI_CLINIC_ID)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      const next = (maxRow?.sort_order || 0) + 1
      const { data, error } = await supabase
        .from('office_gbp_videos')
        .insert({ clinic_id: OGUCHI_CLINIC_ID, title, url, sort_order: next, active: true })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, video: data })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// =================== PATCH: 投稿編集・ステータス／動画編集 ===================
export async function PATCH(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const id = sp.get('id')
    const target = sp.get('target') || 'post' // 'post' | 'video'
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()

    if (target === 'video') {
      const update: Record<string, unknown> = {}
      if (typeof body.title === 'string') update.title = body.title
      if (typeof body.url === 'string') update.url = body.url
      if (typeof body.active === 'boolean') update.active = body.active
      if (typeof body.sort_order === 'number') update.sort_order = body.sort_order
      const { error } = await supabase.from('office_gbp_videos').update(update).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // post
    const update: Record<string, unknown> = {}
    if (typeof body.post_text === 'string') update.post_text = body.post_text
    if (typeof body.status === 'string') {
      update.status = body.status
      if (body.status === 'posted') update.posted_at = new Date().toISOString()
    }
    const { error } = await supabase.from('office_gbp_posts').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// =================== DELETE: 動画削除 ===================
export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const id = sp.get('id')
    const target = sp.get('target') || 'video'
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (target === 'video') {
      const { error } = await supabase.from('office_gbp_videos').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from('office_gbp_posts').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'
export const maxDuration = 60

// 大口神経整体院 固定（Phase1）
const OGUCHI_CLINIC_ID = 'clinic-1773989199882'
const OGUCHI_CLINIC_NAME = '大口神経整体院'
const OGUCHI_OWNER = '大口陽平'
const OGUCHI_AREA = '大阪市住吉区長居'

// LLMO/MEOキーワードは office_keyword_settings から取得（編集可）。フォールバック用の最小デフォルト。
const FALLBACK_KW = {
  symptoms: ['坐骨神経痛', '脊柱管狭窄症', '神経痛'],
  areas: ['大阪市住吉区', '長居'],
  strengths: ['神経整体'],
}

async function loadKeywordPool() {
  const { data } = await supabase
    .from('office_keyword_settings')
    .select('category,keyword')
    .eq('clinic_id', OGUCHI_CLINIC_ID)
    .eq('active', true)
    .order('sort_order', { ascending: true })
  const pool = { symptoms: [] as string[], areas: [] as string[], strengths: [] as string[] }
  for (const r of data || []) {
    if (r.category === 'symptom') pool.symptoms.push(r.keyword)
    else if (r.category === 'area') pool.areas.push(r.keyword)
    else if (r.category === 'strength') pool.strengths.push(r.keyword)
  }
  if (pool.symptoms.length === 0) pool.symptoms = FALLBACK_KW.symptoms
  if (pool.areas.length === 0) pool.areas = FALLBACK_KW.areas
  if (pool.strengths.length === 0) pool.strengths = FALLBACK_KW.strengths
  return pool
}

function pickLlmoKeywords(reviewText: string, pool: Awaited<ReturnType<typeof loadKeywordPool>>) {
  const matched = {
    symptoms: pool.symptoms.filter((k) => reviewText.includes(k)),
    areas: pool.areas.filter((k) => reviewText.includes(k)),
    strengths: pool.strengths.filter((k) => reviewText.includes(k)),
  }
  // 言及がなければ主力を補完（症状は本文の文脈マッチ無しでも入れない／地域・強みは入れる）
  if (matched.areas.length === 0) matched.areas = [pool.areas[0]]
  if (matched.strengths.length === 0) matched.strengths = [pool.strengths[0]]
  // 症状はマッチがあれば使う・無ければ補完しない（無関係な症状を入れない）
  return matched
}

function buildReplyPrompt(reviewText: string, rating: number, authorName: string | null, llmo: { symptoms: string[]; areas: string[]; strengths: string[] }) {
  const tone =
    rating >= 4
      ? '感謝の気持ちを込めた温かいトーンで、来院いただいたことへのお礼と今後も寄り添う姿勢を伝える'
      : rating === 3
      ? '感謝しつつも、改善への真摯な姿勢を示す。ご指摘を前向きに受け止め、今後の対応に具体的に触れる'
      : '誠実で丁寧なトーンで、ご不満へのお詫びと改善に向けた具体的な姿勢を示す。感情的にならずプロフェッショナルに'

  return `あなたは${OGUCHI_CLINIC_NAME}（${OGUCHI_AREA}）の院長「${OGUCHI_OWNER}」として、Googleクチコミへの返信を1案だけ作成してください。

【院情報】
- 院名: ${OGUCHI_CLINIC_NAME}
- 場所: ${OGUCHI_AREA}（住吉区長居駅すぐ）
- 院長: ${OGUCHI_OWNER}
- 強み: 重症慢性痛・神経痛専門の自費整体／神経学的検査で原因を見つけて根本改善

【口コミ】
- 投稿者: ${authorName || '匿名'}様
- 星評価: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}（${rating}/5）
- 本文:
${reviewText}

【返信のルール】
- ${tone}
- 文字数: 120〜220文字
- 一人称は「私」（院長として返信）
- 冒頭は「${authorName || ''}様」のような呼びかけ + お礼から
- 口コミの内容に具体的に触れる（テンプレ感を出さない）
- 嘘や誇張は禁止。「治ります」など断定NG（医療関連法）
- 絵文字・記号装飾は使わない
- 末尾は「またのご来院お待ちしております」系で締める

【LLMO・MEO最適化（重要・自然に織り込む）】
ChatGPT・Gemini・Google AI検索で「${OGUCHI_AREA} 整体」等の検索時に引用される手がかりになります。

▼ 必ず1つ含める：地域ワード
${llmo.areas.join('、')}
（自然な言い回しで例：「${OGUCHI_AREA}でこのような症状でお悩みの方の…」「長居駅近くで…」）

▼ 1つ含める：強みワード
${llmo.strengths.join('、')}

▼ 口コミに該当症状が明示されている場合のみ：症状ワード
${llmo.symptoms.length > 0 ? llmo.symptoms.join('、') : '（口コミ本文に該当症状の言及なし → 症状名は無理に入れない）'}

ただし「キーワードを並べただけ」のSEO感は厳禁。文脈に溶け込ませてください。
口コミ本文と無関係な症状ワードを入れるのは禁止。

【出力】
返信文のみ（説明・前置きなし、見出しなし）。`
}

// =================== GET: 口コミ一覧 ===================
async function handleList(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const clinicId = sp.get('clinic_id') || OGUCHI_CLINIC_ID
  const filter = sp.get('filter') || 'all' // all | unreplied | replied | low
  const limit = Math.min(parseInt(sp.get('limit') || '50'), 200)

  let q = supabase
    .from('meo_clinic_reviews')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('fetched_at', { ascending: false })
    .limit(limit)

  if (filter === 'unreplied') q = q.in('reply_status', ['unreplied', 'draft'])
  if (filter === 'replied') q = q.in('reply_status', ['approved', 'posted'])
  if (filter === 'low') q = q.lte('rating', 3)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // サマリー
  const { data: all } = await supabase
    .from('meo_clinic_reviews')
    .select('rating, reply_status')
    .eq('clinic_id', clinicId)
  const summary = {
    total: all?.length || 0,
    avgRating: all && all.length > 0 ? all.reduce((s, r) => s + (r.rating || 0), 0) / all.length : 0,
    unreplied: (all || []).filter((r) => !r.reply_status || r.reply_status === 'unreplied').length,
    draft: (all || []).filter((r) => r.reply_status === 'draft').length,
    approved: (all || []).filter((r) => r.reply_status === 'approved').length,
    posted: (all || []).filter((r) => r.reply_status === 'posted').length,
    low: (all || []).filter((r) => (r.rating || 5) <= 3).length,
  }

  return NextResponse.json({ reviews: data || [], summary, clinic: { id: clinicId, name: OGUCHI_CLINIC_NAME } })
}

// =================== POST: 返信生成 / 一括生成 / 同期 ===================
async function handleGenerate(reviewId: string) {
  const { data: review, error } = await supabase
    .from('meo_clinic_reviews')
    .select('*')
    .eq('id', reviewId)
    .single()
  if (error || !review) return NextResponse.json({ error: 'review not found' }, { status: 404 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 })

  const client = new Anthropic({ apiKey })
  const pool = await loadKeywordPool()
  const llmo = pickLlmoKeywords(review.review_text, pool)
  const prompt = buildReplyPrompt(review.review_text, review.rating || 5, review.author_name, llmo)

  const res = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''

  await supabase
    .from('meo_clinic_reviews')
    .update({
      ai_reply_draft: text,
      reply_text: text,
      reply_status: 'draft',
      reply_generated_at: new Date().toISOString(),
      llmo_keywords: llmo,
    })
    .eq('id', reviewId)

  return NextResponse.json({ ok: true, reply: text, llmo })
}

async function handleBulkGenerate(clinicId: string) {
  const { data: targets } = await supabase
    .from('meo_clinic_reviews')
    .select('id')
    .eq('clinic_id', clinicId)
    .or('reply_status.is.null,reply_status.eq.unreplied')
    .order('fetched_at', { ascending: false })
    .limit(20)

  if (!targets || targets.length === 0) return NextResponse.json({ ok: true, generated: 0, message: '未返信なし' })

  let count = 0
  for (const t of targets) {
    try {
      await handleGenerate(t.id)
      count++
    } catch (e) {
      console.error('bulk-generate error', e)
    }
  }
  return NextResponse.json({ ok: true, generated: count })
}

// =================== PATCH: 返信編集・ステータス更新 ===================
async function handleUpdate(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const id = sp.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (typeof body.reply_text === 'string') update.reply_text = body.reply_text
  if (typeof body.reply_status === 'string') {
    update.reply_status = body.reply_status
    if (body.reply_status === 'approved') update.reply_approved_at = new Date().toISOString()
    if (body.reply_status === 'posted') update.reply_posted_at = new Date().toISOString()
  }
  if (typeof body.owner_note === 'string') update.owner_note = body.owner_note

  const { error } = await supabase.from('meo_clinic_reviews').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// =================== Routes ===================
export async function GET(req: NextRequest) {
  try {
    return await handleList(req)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action
    if (action === 'generate') {
      if (!body.review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 })
      return await handleGenerate(body.review_id)
    }
    if (action === 'bulk-generate') {
      const clinicId = body.clinic_id || OGUCHI_CLINIC_ID
      return await handleBulkGenerate(clinicId)
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    return await handleUpdate(req)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

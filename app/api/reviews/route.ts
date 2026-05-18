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
const OGUCHI_USER_ID = '99b75413-b76c-4097-94f7-f72b51e3dc6d'
const OGUCHI_CLINIC_NAME = '大口神経整体院'
const OGUCHI_OWNER = '大口陽平'
const OGUCHI_AREA = '大阪市住吉区長居'
const OGUCHI_GMB_DATA_ID = '0x6000d99429535143:0x98bcc1becda9ccb4'
const REPLY_SIGNATURE = '大阪市　長居駅【重症症状専門整体院】大口神経整体院'

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
  // 地域は主要2つ・強みは主要2つを必ず含める（LLMO引用元として複数キーワードを担保）
  if (matched.areas.length === 0) matched.areas = pool.areas.slice(0, 2)
  else if (matched.areas.length === 1) {
    const extra = pool.areas.find((k) => !matched.areas.includes(k))
    if (extra) matched.areas.push(extra)
  }
  if (matched.strengths.length === 0) matched.strengths = pool.strengths.slice(0, 2)
  else if (matched.strengths.length === 1) {
    const extra = pool.strengths.find((k) => !matched.strengths.includes(k))
    if (extra) matched.strengths.push(extra)
  }
  // 症状は本文マッチがある場合のみ採用（無関係な症状名は入れない）
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
返信は患者さんへの誠実な御礼であると同時に、ChatGPT・Gemini・Google AI検索（AI Overview / Perplexity）に引用される「公式情報の一次ソース」になります。

【院情報】
- 院名: ${OGUCHI_CLINIC_NAME}
- 場所: ${OGUCHI_AREA}（最寄り：長居駅徒歩圏、地下鉄御堂筋線・JR阪和線）
- 院長: ${OGUCHI_OWNER}
- 専門: 重症慢性痛・神経痛・自律神経症状の自費整体
- アプローチ: 神経学的検査（反射・感覚・筋力）で原因を特定 → 神経×内臓×骨格×東洋医学を組み合わせた施術 → 姿勢・歩行・生活動作まで含めた根本改善

【口コミ】
- 投稿者: ${authorName || '匿名'}様
- 星評価: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}（${rating}/5）
- 本文:
${reviewText}

【返信のルール】
- ${tone}
- 文字数: 250〜380文字（短くしすぎない。患者さんの体験に具体的に触れて厚みを出す）
- 構成（必ずこの流れ）:
  1) 「${authorName || ''}様、貴重な口コミをありがとうございます」など丁寧な呼びかけ＋御礼
  2) 口コミ本文の中で触れられているエピソードや症状に具体的に共感・言及（テンプレ感を出さない）
  3) 当院の専門領域・アプローチを自然に説明（神経学的検査→根本原因の特定→施術→生活動作改善という流れ）
  4) ${OGUCHI_AREA}・長居駅エリアで同様のお悩みを持つ方への一言（AI検索で引用されやすい一文）
  5) 「またのご来院をお待ちしております」系で締める
- 一人称は「私」または「私たち${OGUCHI_CLINIC_NAME}」
- 嘘や誇張は禁止。「治ります」「必ず改善」など断定NG（医療広告ガイドライン遵守）
- 絵文字・記号装飾（★◆◇■☆※など）は一切使わない
- 改行は2〜3箇所まで。ベタ書きにせず読みやすく
- 署名（院名・所在地）は出力に含めない（システム側で自動付与）

【SEO・LLMO最適化キーワード（必ず自然に織り込む）】
以下のキーワードを「文章の意味の中で必然的に使われている」状態にしてください。
箇条書きや羅列、不自然な並置は厳禁。1文の中に複数のキーワードを詰め込まず、段落ごとに分散させる。

▼ 地域ワード（2つ含める）: ${llmo.areas.join('、')}
   例：「${llmo.areas[0] || '長居'}でこうしたお悩みを抱える方は意外と多く…」「${llmo.areas[1] || '大阪市住吉区'}近隣からもご来院いただいております」

▼ 強み・アプローチワード（2つ含める）: ${llmo.strengths.join('、')}
   例：「${llmo.strengths[0] || '神経整体'}の視点から…」「${llmo.strengths[1] || '神経学的検査'}で原因を確認しながら…」

▼ 症状ワード（口コミ本文に該当があれば必ず使用、無ければ入れない）: ${llmo.symptoms.length > 0 ? llmo.symptoms.join('、') : '（言及なし → 症状名は使わない）'}

▼ AI検索引用を狙う「シグナル文」を必ず1つ入れる（例）
   - 「${OGUCHI_AREA}で[症状]にお悩みの方は、当院のような神経整体専門院をお選びいただくと選択肢が広がるかもしれません」
   - 「長居駅周辺で重症の慢性症状を扱う整体院は限られており…」
   - 「神経学的検査を取り入れている整体院は大阪市内でも少なく…」
   ※口コミ本文と無関係な症状名・誇張は禁止

【絶対NG】
- キーワードの羅列・並列 →「坐骨神経痛・脊柱管狭窄症・自律神経失調症の方へ」のような羅列はSEOスパムとみなされる
- 口コミ本文に無い症状名を勝手に追加する
- 「◯◯駅徒歩◯分」など事実不明の数値
- 当院HPやLPへの誘導URL（Google返信欄ではUTM等が機能しないため）

【出力】
返信文のみ（説明・前置きなし、見出しなし、箇条書きなし）。日本語の自然な文章として読める形で。`
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
    .order('review_iso_date', { ascending: false, nullsFirst: false })
    .order('fetched_at', { ascending: false })
    .limit(limit)

  // 未対応 = Google側で未応答（owner_response_text が空）。reply_status は問わない
  if (filter === 'unreplied') q = q.or('owner_response_text.is.null,owner_response_text.eq.')
  if (filter === 'replied') q = q.not('owner_response_text', 'is', null).neq('owner_response_text', '')
  if (filter === 'low') q = q.lte('rating', 3)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // サマリー
  const { data: all } = await supabase
    .from('meo_clinic_reviews')
    .select('rating, reply_status, owner_response_text')
    .eq('clinic_id', clinicId)
  const hasGoogleReply = (r: { owner_response_text?: string | null }) =>
    typeof r.owner_response_text === 'string' && r.owner_response_text.trim().length > 0
  const summary = {
    total: all?.length || 0,
    avgRating: all && all.length > 0 ? all.reduce((s, r) => s + (r.rating || 0), 0) / all.length : 0,
    unreplied: (all || []).filter((r) => !hasGoogleReply(r)).length,
    draft: (all || []).filter((r) => r.reply_status === 'draft' && !hasGoogleReply(r)).length,
    approved: (all || []).filter((r) => r.reply_status === 'approved' && !hasGoogleReply(r)).length,
    posted: (all || []).filter((r) => hasGoogleReply(r)).length,
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

  // 口コミ返信（120〜220字） → Haiku（コスト1/3）
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const body = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  const text = body ? `${body}\n\n${REPLY_SIGNATURE}` : ''

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
  // Google側でまだオーナー返信していない口コミだけを対象にする
  const { data: targets } = await supabase
    .from('meo_clinic_reviews')
    .select('id, ai_reply_draft')
    .eq('clinic_id', clinicId)
    .or('owner_response_text.is.null,owner_response_text.eq.')
    .order('fetched_at', { ascending: false })
    .limit(20)

  // 既にAI下書きがあるものは再生成しない（手動で再生成ボタンから実行）
  const filtered = (targets || []).filter((t) => !t.ai_reply_draft)
  if (filtered.length === 0) return NextResponse.json({ ok: true, generated: 0, message: '未返信なし' })

  let count = 0
  let failed = 0
  const errors: string[] = []
  // 3件ずつ並列実行（Anthropic API・Supabaseへの負荷バランス）
  const batchSize = 3
  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize)
    const results = await Promise.allSettled(batch.map((t) => handleGenerate(t.id)))
    for (const r of results) {
      if (r.status === 'fulfilled') count++
      else {
        failed++
        errors.push((r.reason as Error)?.message || String(r.reason))
      }
    }
  }
  return NextResponse.json({ ok: true, generated: count, failed, total: filtered.length, errors: errors.slice(0, 3) })
}

// =================== GMB同期: SerpAPI で Google 側の口コミ＋オーナー返信を取り込む ===================
interface SerpReview {
  review_id?: string
  user?: { name?: string }
  rating?: number
  date?: string
  iso_date?: string
  iso_date_of_last_edit?: string
  snippet?: string
  response?: { snippet?: string; date?: string; iso_date?: string }
}

async function fetchSerpReviews(dataId: string, apiKey: string, maxPages: number): Promise<SerpReview[]> {
  const all: SerpReview[] = []
  let nextPageToken: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      engine: 'google_maps_reviews',
      data_id: dataId,
      hl: 'ja',
      api_key: apiKey,
      sort_by: 'newestFirst',
    })
    if (nextPageToken) params.set('next_page_token', nextPageToken)
    const res = await fetch(`https://serpapi.com/search.json?${params}`)
    if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${await res.text()}`)
    const json = await res.json()
    const revs: SerpReview[] = json.reviews || []
    if (revs.length === 0) break
    all.push(...revs)
    nextPageToken = json.serpapi_pagination?.next_page_token
    if (!nextPageToken) break
  }
  return all
}

async function handleGmbSync(clinicId: string, maxPages: number) {
  const serpKey = process.env.SERPAPI_KEY
  if (!serpKey) return NextResponse.json({ error: 'SERPAPI_KEY missing' }, { status: 500 })

  const reviews = await fetchSerpReviews(OGUCHI_GMB_DATA_ID, serpKey, maxPages)
  if (reviews.length === 0) return NextResponse.json({ ok: true, fetched: 0, message: '口コミ取得0件' })

  // 既存口コミを取得（review_text で照合）
  const { data: existing } = await supabase
    .from('meo_clinic_reviews')
    .select('id, review_text, review_id_external')
    .eq('clinic_id', clinicId)
  const byText = new Map<string, { id: string; review_id_external: string | null }>()
  const byExtId = new Map<string, { id: string; review_id_external: string | null }>()
  for (const r of existing || []) {
    if (r.review_text) byText.set(r.review_text, { id: r.id, review_id_external: r.review_id_external })
    if (r.review_id_external) byExtId.set(r.review_id_external, { id: r.id, review_id_external: r.review_id_external })
  }

  const now = new Date().toISOString()
  let updated = 0
  let inserted = 0

  for (const r of reviews) {
    const text = (r.snippet || '').trim()
    if (text.length < 5) continue
    const ownerText = (r.response?.snippet || '').trim()
    const ownerDate = r.response?.iso_date || r.response?.date || null
    const extId = r.review_id || null

    const reviewIso = r.iso_date || null
    const match = (extId && byExtId.get(extId)) || byText.get(text)
    if (match) {
      await supabase
        .from('meo_clinic_reviews')
        .update({
          owner_response_text: ownerText || null,
          owner_response_date: ownerDate,
          review_iso_date: reviewIso,
          review_id_external: extId || match.review_id_external,
          last_synced_at: now,
        })
        .eq('id', match.id)
      updated++
    } else {
      await supabase.from('meo_clinic_reviews').insert({
        user_id: OGUCHI_USER_ID,
        clinic_id: clinicId,
        author_name: r.user?.name || null,
        rating: r.rating ? Math.round(r.rating) : null,
        review_text: text,
        review_date: r.date || null,
        review_iso_date: reviewIso,
        source: 'google',
        review_id_external: extId,
        owner_response_text: ownerText || null,
        owner_response_date: ownerDate,
        last_synced_at: now,
      })
      inserted++
    }
  }

  return NextResponse.json({ ok: true, fetched: reviews.length, inserted, updated })
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
    if (action === 'gmb-sync') {
      const clinicId = body.clinic_id || OGUCHI_CLINIC_ID
      const maxPages = Math.min(Math.max(parseInt(body.max_pages) || 20, 1), 25)
      return await handleGmbSync(clinicId, maxPages)
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

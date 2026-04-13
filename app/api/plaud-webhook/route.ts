import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '../../lib/pdca-utils'
import {
  detectCategory,
  detectDepartmentTags,
  detectBusinessTags,
} from '../../lib/memo-utils'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Webhook認証（PLAUD_WEBHOOK_SECRET）
function verifyWebhookAuth(request: NextRequest): boolean {
  const secret = process.env.PLAUD_WEBHOOK_SECRET
  if (!secret) return true // 未設定時はスキップ（開発用）

  // Authorizationヘッダー or クエリパラメータで認証
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) return true

  return false
}

// メモを保存し、必要なら company_context へ昇格
async function processMemo(
  supabase: ReturnType<typeof createClient>,
  content: string,
  title: string
): Promise<{ memoId: string; category: string; promoted: boolean }> {
  const { category, cleaned } = detectCategory(content)
  const department_tags = detectDepartmentTags(cleaned)
  const business_tags = detectBusinessTags(cleaned)

  const { data: memo, error: memoError } = await supabase
    .from('chairman_memos')
    .insert({
      content: cleaned,
      category,
      source: 'plaud',
      department_tags,
    })
    .select()
    .single()

  if (memoError || !memo) {
    throw new Error(`chairman_memos 保存失敗: ${memoError?.message}`)
  }

  let promoted = false
  if (category === 'direction' || category === 'insight') {
    const { error: ctxError } = await supabase.from('company_context').insert({
      title: title.slice(0, 50) || cleaned.slice(0, 50),
      content: cleaned,
      category,
      department_tags,
      business_tags,
      source: 'plaud',
      source_memo_id: memo.id,
    })
    if (!ctxError) {
      promoted = true
      await supabase
        .from('chairman_memos')
        .update({ promoted_to_context: true })
        .eq('id', memo.id)
    }
  }

  return { memoId: memo.id, category, promoted }
}

/**
 * POST: Plaud Webhook受信（Zapier / Plaud API / 手動送信対応）
 *
 * Body形式:
 * {
 *   "transcript": "文字起こしテキスト",
 *   "summary": "要約テキスト（任意）",
 *   "title": "タイトル（任意）",
 *   "recorded_at": "録音日時（任意）",
 *   "duration": 120（秒、任意）
 * }
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // 文字起こし or 要約のどちらかが必須
    const transcript = body.transcript || body.text || body.content || ''
    const summary = body.summary || ''
    const title = body.title || body.name || ''
    const recordedAt = body.recorded_at || body.recordedAt || body.date || null
    const duration = body.duration || null

    if (!transcript.trim() && !summary.trim()) {
      return NextResponse.json(
        { error: 'transcript または summary が必要です' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // 文字起こし全文をメモとして保存
    const contentParts: string[] = []
    if (title) contentParts.push(`【${title}】`)
    if (summary) contentParts.push(`[要約] ${summary}`)
    if (transcript) contentParts.push(transcript)
    const fullContent = contentParts.join('\n\n')

    const { memoId, category, promoted } = await processMemo(
      supabase,
      fullContent,
      title || (transcript.slice(0, 30) + '...')
    )

    // plaud_synced_files にも記録（重複防止用）
    const fileId = `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await supabase.from('plaud_synced_files').insert({
      drive_file_id: fileId,
      file_name: title || `Plaud録音_${new Date().toISOString().slice(0, 10)}`,
      memo_id: memoId,
      content_preview: fullContent.slice(0, 200),
    })

    // 活動ログ
    await logActivity(
      'CC-PlaudWebhook',
      'AI開発部',
      'plaud_webhook',
      `Plaud録音受信: ${title || '無題'} (${category})${promoted ? ' → company_context昇格' : ''}`
    )

    return NextResponse.json({
      success: true,
      memo_id: memoId,
      category,
      promoted,
      message: 'Plaud録音を会長メモに保存しました',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Plaud webhook エラー:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: ヘルスチェック（Zapier接続テスト用）
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'plaud-webhook',
    description: 'Plaud録音の文字起こし・要約をWebhookで受信するエンドポイント',
    usage: {
      method: 'POST',
      body: {
        transcript: '（必須）文字起こし全文',
        summary: '（任意）要約テキスト',
        title: '（任意）タイトル',
        recorded_at: '（任意）録音日時',
        duration: '（任意）録音時間（秒）',
      },
    },
  })
}

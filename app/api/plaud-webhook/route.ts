import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../lib/pdca-utils'
import {
  detectCategory,
  detectDepartmentTags,
  detectBusinessTags,
  splitByTopics,
} from '../../lib/memo-utils'
import type { TopicBlock } from '../../lib/memo-utils'
import Anthropic from '@anthropic-ai/sdk'

// Webhook認証（PLAUD_WEBHOOK_SECRET）
function verifyWebhookAuth(request: NextRequest): boolean {
  const secret = process.env.PLAUD_WEBHOOK_SECRET
  if (!secret) return true // 未設定時はスキップ（開発用）

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) return true

  return false
}

// AIで分類して office_pending_imports に投入（承認待ち）
async function classifyAndQueueForApproval(content: string, title: string, sourceRef: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const client = new Anthropic({ apiKey })
  const prompt = `Plaudで録音した会長の音声メモを、AIオフィスのどのカテゴリに保存すべきか分類してください。

【メモ内容】
${title ? `タイトル: ${title}\n\n` : ''}${content.slice(0, 4000)}

【分類ルール】
type は3種類のいずれか：
- "knowledge"（ナレッジ）：永続的な知見・哲学・マニュアル・ペルソナ・症状解説など、1ヶ月後も変わらない情報
- "context"（コンテキスト）：今週の状況・進行中キャンペーン・KPI更新・競合動向など、すぐ古くなる情報
- "task"（タスク）：今すぐ動く必要があるアクション項目

business_id は: 'all'（全社）/ 'seitai'（整体院）/ 'houmon'（訪問鍼灸）/ 'app-biz'（アプリ事業）/ 'consulting'（コンサル）/ 'device'（機器販売）

category は type ごと：
- knowledge: identity / persona / method / episode / symptom / product / talk / manual / reference / sns / misc
- context: kpi / campaign / closing / competitor / priority / note
- task: （department名を business_id に対応させる：seitai→整体院事業部、houmon→訪問鍼灸事業部、app-biz→AI開発部 等）

【出力形式】JSONのみ（説明や前置きは不要）
{
  "type": "knowledge | context | task",
  "business_id": "all | seitai | houmon | app-biz | consulting | device",
  "category": "（typeに応じたカテゴリ）",
  "title": "（30文字以内のタイトル）",
  "content_proposal": "（整理した本文・原文を要約・整形）",
  "tags": ["タグ1", "タグ2"],
  "reasoning": "（なぜこの分類にしたか30字以内）"
}`

  // Plaud分類（JSONを返すだけの単純判定） → Haiku
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(jsonMatch[0]) } catch { return }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('office_pending_imports').insert({
    source: 'plaud',
    source_ref: sourceRef,
    raw_content: content,
    ai_classification: parsed,
  })
}

// メモを保存し、必要なら company_context へ昇格
async function processMemo(
  content: string,
  title: string
): Promise<{ memoId: string; category: string; promoted: boolean }> {
  const { category, cleaned } = detectCategory(content)
  const department_tags = detectDepartmentTags(cleaned)
  const business_tags = detectBusinessTags(cleaned)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memo, error: memoError } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: ctxError } = await (supabase as any).from('company_context').insert({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
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

    // 文字起こし全文を組み立て
    const contentParts: string[] = []
    if (summary) contentParts.push(`[要約] ${summary}`)
    if (transcript) contentParts.push(transcript)
    const fullContent = contentParts.join('\n\n')

    // トピックごとに分割
    const blocks = splitByTopics(fullContent)

    const results: {
      memoId: string
      category: string
      promoted: boolean
      business_tags: string[]
      department_tags: string[]
      title: string
    }[] = []

    if (blocks.length > 1) {
      // 複数トピック：それぞれ個別に保存
      for (const block of blocks) {
        const result = await processMemo(
          block.content,
          title ? `${title} - ${block.business_tags.join('/')}` : block.title
        )
        results.push({
          ...result,
          business_tags: block.business_tags,
          department_tags: block.department_tags,
          title: block.title,
        })
      }
    } else {
      // 単一トピック：従来通り
      const singleContent = title ? `【${title}】\n\n${fullContent}` : fullContent
      const result = await processMemo(
        singleContent,
        title || (transcript.slice(0, 30) + '...')
      )
      const block: TopicBlock = blocks[0] || {
        content: fullContent,
        business_tags: detectBusinessTags(fullContent),
        department_tags: detectDepartmentTags(fullContent),
        category: result.category,
        title: (title || transcript.slice(0, 50)),
      }
      results.push({
        ...result,
        business_tags: block.business_tags,
        department_tags: block.department_tags,
        title: block.title,
      })
    }

    // plaud_synced_files にも記録（重複防止用）
    const fileId = `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('plaud_synced_files').insert({
      drive_file_id: fileId,
      file_name: title || `Plaud録音_${new Date().toISOString().slice(0, 10)}`,
      memo_id: results[0]?.memoId,
      content_preview: fullContent.slice(0, 200),
    })

    // AI分類して承認待ちキューへ追加（office_pending_imports）
    try {
      await classifyAndQueueForApproval(fullContent, title || '', fileId)
    } catch (e) {
      console.error('AI分類エラー（保存は成功）:', e)
    }

    // 活動ログ
    const promotedCount = results.filter(r => r.promoted).length
    await logActivity(
      'CC-PlaudWebhook',
      'AI開発部',
      'plaud_webhook',
      `Plaud録音受信: ${title || '無題'} (${results.length}トピックに分割${promotedCount > 0 ? `, ${promotedCount}件昇格` : ''})`
    )

    return NextResponse.json({
      success: true,
      split_count: results.length,
      blocks: results.map(r => ({
        memo_id: r.memoId,
        category: r.category,
        promoted: r.promoted,
        business_tags: r.business_tags,
        department_tags: r.department_tags,
        title: r.title,
      })),
      // 後方互換
      memo_id: results[0]?.memoId,
      category: results[0]?.category,
      promoted: results.some(r => r.promoted),
      message: results.length > 1
        ? `${results.length}トピックに分割して保存しました`
        : 'Plaud録音を会長メモに保存しました',
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

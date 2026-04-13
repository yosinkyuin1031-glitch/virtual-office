import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import {
  detectCategory,
  detectDepartmentTags,
  detectBusinessTags,
} from '../../lib/memo-utils'

// Proud アプリ（音声文字起こし）からのテキストを受け取る
//
// iOSショートカットから POST する想定:
//   URL:     https://virtual-office-pearl.vercel.app/api/voice-memo
//   Headers: Authorization: Bearer <VOICE_MEMO_TOKEN>
//   Body:    { "text": "読み取ったテキスト", "title"?: "タイトル" }
//
// 受け取ったテキストを chairman_memos に source='proud' で保存し、
// 方針・気づきに該当する内容であれば company_context へも自動昇格する。

export async function POST(request: NextRequest) {
  // Bearer 認証
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.VOICE_MEMO_TOKEN
  if (!expectedToken) {
    return NextResponse.json({ error: 'VOICE_MEMO_TOKEN 未設定' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = (body.text || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'text が空です' }, { status: 400 })
  }

  const { category, cleaned } = detectCategory(text)
  const department_tags = detectDepartmentTags(cleaned)
  const business_tags = detectBusinessTags(cleaned)

  // chairman_memos に保存
  const { data: memo, error: memoError } = await supabase
    .from('chairman_memos')
    .insert({
      content: cleaned,
      category,
      source: 'proud',
      department_tags,
    })
    .select()
    .single()

  if (memoError || !memo) {
    return NextResponse.json({ error: memoError?.message || '保存失敗' }, { status: 500 })
  }

  // direction / insight の場合は company_context へ即時昇格
  let promoted = false
  if (category === 'direction' || category === 'insight') {
    const catMap: Record<string, string> = { direction: 'direction', insight: 'insight' }
    const { error: ctxError } = await supabase.from('company_context').insert({
      title: body.title || cleaned.slice(0, 50),
      content: cleaned,
      category: catMap[category],
      department_tags,
      business_tags,
      source: 'proud',
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

  return NextResponse.json({
    success: true,
    memo_id: memo.id,
    category,
    department_tags,
    business_tags,
    promoted_to_context: promoted,
  })
}

// ヘルスチェック
export async function GET() {
  return NextResponse.json({
    status: 'active',
    description: 'Proud音声メモ受信エンドポイント',
    method: 'POST',
    auth: 'Bearer VOICE_MEMO_TOKEN',
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// Proud アプリ（音声文字起こし）からのテキストを受け取る
//
// iOSショートカットから POST する想定:
//   URL:     https://virtual-office-pearl.vercel.app/api/voice-memo
//   Headers: Authorization: Bearer <VOICE_MEMO_TOKEN>
//   Body:    { "text": "読み取ったテキスト", "title"?: "タイトル" }
//
// 受け取ったテキストを chairman_memos に source='proud' で保存し、
// 方針・気づきに該当する内容であれば company_context へも自動昇格する。

const BUSINESS_KEYWORDS: Record<string, string> = {
  '整体': 'seitai',
  '訪問': 'houmon',
  '鍼灸': 'houmon',
  '晴陽': 'houmon',
  'アプリ': 'app_sales',
  'カラダマップ': 'app_sales',
  'クリニックコア': 'app_sales',
  'Clinic Core': 'app_sales',
  'ポイント管理': 'app_sales',
  'BR': 'device',
  '機器': 'device',
  '血管': 'device',
  'コンサル': 'consulting',
  '秘密基地': 'consulting',
  '西村': 'consulting',
}

const DEPT_KEYWORDS: Record<string, string> = {
  '整体': '整体院事業部',
  '訪問': '訪問鍼灸事業部',
  'AI': 'AI開発部',
  'BtoB': 'BtoB営業部',
  'YouTube': 'メディア部',
  '動画': 'メディア部',
  'LP': 'LP・Web制作部',
  'SEO': 'LP・Web制作部',
  'デザイン': '動画・デザイン制作部',
  '財務': '財務部',
  '経理': '財務部',
  'リサーチ': 'リサーチ・ナレッジ部',
  '競合': 'リサーチ・ナレッジ部',
  'ヒアリング': 'リサーチ・ナレッジ部',
  'コンサル': 'コンサル事業部',
  '秘密基地': 'コンサル事業部',
  '機器': '治療機器販売部',
  'BR': '治療機器販売部',
  '広告': '広告運用部',
  'Meta': '広告運用部',
}

function detectBusinessTags(text: string): string[] {
  const tags = new Set<string>()
  for (const [kw, tag] of Object.entries(BUSINESS_KEYWORDS)) {
    if (text.includes(kw)) tags.add(tag)
  }
  return Array.from(tags)
}

function detectDepartmentTags(text: string): string[] {
  const tags = new Set<string>()
  for (const [kw, dept] of Object.entries(DEPT_KEYWORDS)) {
    if (text.includes(kw)) tags.add(dept)
  }
  return Array.from(tags)
}

// カテゴリ判定: 先頭キーワード or 自動推定
function detectCategory(text: string): { category: string; cleaned: string } {
  const trimmed = text.trim()
  if (trimmed.startsWith('方針:') || trimmed.startsWith('方針：')) {
    return { category: 'direction', cleaned: trimmed.replace(/^方針[:：]\s*/, '') }
  }
  if (trimmed.startsWith('気づき:') || trimmed.startsWith('気づき：')) {
    return { category: 'insight', cleaned: trimmed.replace(/^気づき[:：]\s*/, '') }
  }
  if (trimmed.startsWith('タスク:') || trimmed.startsWith('タスク：')) {
    return { category: 'task', cleaned: trimmed.replace(/^タスク[:：]\s*/, '') }
  }
  // キーワードベースで自動推定
  if (/決めた|やる|やらない|方針|戦略|絶対|必ず/.test(trimmed)) {
    return { category: 'direction', cleaned: trimmed }
  }
  if (/気づき|発見|なるほど|わかった|学んだ|知った/.test(trimmed)) {
    return { category: 'insight', cleaned: trimmed }
  }
  return { category: 'general', cleaned: trimmed }
}

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

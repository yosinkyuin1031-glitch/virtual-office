import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// chairman_memos を company_context に昇格
//
// POST /api/memos/promote
//   body: { memo_id: string, title?: string, category?: string, business_tags?: string[] }
//   単一メモを指定して昇格
//
// POST /api/memos/promote?mode=batch
//   body: { category?: string, since?: string }
//   direction/insight の未昇格メモを一括昇格
//
// GET /api/memos/promote?pending=1
//   昇格候補（category='direction' or 'insight' で未昇格）を取得

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pending = searchParams.get('pending') === '1'

  if (pending) {
    const { data, error } = await supabase
      .from('chairman_memos')
      .select('*')
      .in('category', ['direction', 'insight'])
      .eq('promoted_to_context', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidates: data })
  }

  // 全 company_context を返す
  const { data, error } = await supabase
    .from('company_context')
    .select('*')
    .order('promoted_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ context: data })
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'single'
  const body = await request.json().catch(() => ({}))

  // 業種タグ自動判定キーワード
  const businessKeywords: Record<string, string> = {
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

  const detectBusinessTags = (text: string): string[] => {
    const tags = new Set<string>()
    for (const [kw, tag] of Object.entries(businessKeywords)) {
      if (text.includes(kw)) tags.add(tag)
    }
    return Array.from(tags)
  }

  const categoryMap: Record<string, string> = {
    direction: 'direction',
    insight: 'insight',
    feedback: 'rule',
    general: 'other',
  }

  if (mode === 'batch') {
    // 未昇格の方針・気づきを一括昇格
    const { data: memos, error: fetchError } = await supabase
      .from('chairman_memos')
      .select('*')
      .in('category', ['direction', 'insight'])
      .eq('promoted_to_context', false)
      .limit(50)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!memos || memos.length === 0) {
      return NextResponse.json({ promoted: 0, message: '昇格候補がありません' })
    }

    const rows = memos.map(m => ({
      title: (m.content as string).slice(0, 50),
      content: m.content,
      category: categoryMap[m.category] || 'other',
      department_tags: m.department_tags || [],
      business_tags: detectBusinessTags(m.content),
      source: m.source === 'proud' ? 'proud' : 'promoted',
      source_memo_id: m.id,
    }))

    const { error: insertError } = await supabase.from('company_context').insert(rows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // 昇格済みマーク
    const ids = memos.map(m => m.id)
    await supabase
      .from('chairman_memos')
      .update({ promoted_to_context: true })
      .in('id', ids)

    return NextResponse.json({ promoted: memos.length })
  }

  // 単一メモ昇格
  const { memo_id, title, category, business_tags } = body
  if (!memo_id) {
    return NextResponse.json({ error: 'memo_id が必要です' }, { status: 400 })
  }

  const { data: memo, error: memoError } = await supabase
    .from('chairman_memos')
    .select('*')
    .eq('id', memo_id)
    .single()

  if (memoError || !memo) {
    return NextResponse.json({ error: 'メモが見つかりません' }, { status: 404 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('company_context')
    .insert({
      title: title || (memo.content as string).slice(0, 50),
      content: memo.content,
      category: category || categoryMap[memo.category] || 'other',
      department_tags: memo.department_tags || [],
      business_tags: business_tags || detectBusinessTags(memo.content),
      source: memo.source === 'proud' ? 'proud' : 'promoted',
      source_memo_id: memo.id,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await supabase
    .from('chairman_memos')
    .update({ promoted_to_context: true })
    .eq('id', memo_id)

  return NextResponse.json({ context: inserted })
}

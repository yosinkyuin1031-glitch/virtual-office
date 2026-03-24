import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// LINE Webhook - ユーザーからの返信をメモとして保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events = body.events || []

    for (const event of events) {
      // テキストメッセージのみ処理
      if (event.type !== 'message' || event.message.type !== 'text') continue

      const text = event.message.text.trim()
      if (!text) continue

      // カテゴリ自動判別（先頭のキーワードで分類）
      let category: string = 'general'
      let content = text

      if (text.startsWith('方針:') || text.startsWith('方針：')) {
        category = 'direction'
        content = text.replace(/^方針[:：]\s*/, '')
      } else if (text.startsWith('気づき:') || text.startsWith('気づき：')) {
        category = 'insight'
        content = text.replace(/^気づき[:：]\s*/, '')
      } else if (text.startsWith('タスク:') || text.startsWith('タスク：')) {
        category = 'task'
        content = text.replace(/^タスク[:：]\s*/, '')
      } else if (text.startsWith('FB:') || text.startsWith('FB：')) {
        category = 'feedback'
        content = text.replace(/^FB[:：]\s*/, '')
      }

      // 部署タグ自動検出
      const deptKeywords: Record<string, string> = {
        '整体': '整体院事業部',
        '訪問': '訪問鍼灸事業部',
        'AI': 'AI開発部',
        'BtoB': 'BtoB営業部',
        'YouTube': 'メディア部',
        '動画': 'メディア部',
        'LP': 'LP・Web制作部',
        'SEO': 'LP・Web制作部',
        'デザイン': '動画・デザイン制作部',
        'チラシ': '動画・デザイン制作部',
        '財務': '財務部',
        '経理': '財務部',
      }

      const department_tags: string[] = []
      for (const [keyword, dept] of Object.entries(deptKeywords)) {
        if (content.includes(keyword) && !department_tags.includes(dept)) {
          department_tags.push(dept)
        }
      }

      // Supabaseに保存
      await supabase.from('chairman_memos').insert({
        content,
        category,
        source: 'line',
        department_tags,
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('LINE Webhook error:', error)
    return NextResponse.json({ status: 'ok' }) // LINEには常に200を返す
  }
}

// LINE Webhook検証用（GET）
export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook is active' })
}

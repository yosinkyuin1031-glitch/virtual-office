import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply'

// LINE返信
async function replyLINE(replyToken: string, message: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  await fetch(LINE_REPLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: message }],
    }),
  }).catch(() => {})
}

// LINE Webhook - ユーザーからの返信をメモ保存 + タスク自動追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events = body.events || []

    for (const event of events) {
      // テキストメッセージのみ処理
      if (event.type !== 'message' || event.message.type !== 'text') continue

      const text = event.message.text.trim()
      if (!text) continue

      const replyToken = event.replyToken

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

      // Supabaseにメモ保存
      await supabase.from('chairman_memos').insert({
        content,
        category,
        source: 'line',
        department_tags,
      })

      // タスクカテゴリの場合 → vo_tasksにも追加
      if (category === 'task') {
        const now = new Date()
        const jstOffset = 9 * 60 * 60 * 1000
        const jstNow = new Date(now.getTime() + jstOffset)
        const today = jstNow.toISOString().split('T')[0]

        // 部署を自動判定（見つからなければ経営層）
        const department = department_tags[0] || '経営層'

        const { error } = await supabase.from('vo_tasks').insert({
          department,
          employee_name: null,
          title: content.length > 25 ? content.substring(0, 25) : content,
          description: content,
          priority: 'high',
          status: 'pending',
          due_date: today,
          batch_id: `line_${Date.now()}`,
          generated_by: 'line',
        })

        if (!error) {
          await replyLINE(replyToken, `タスクを追加しました\n${content}\n\n部署: ${department}\n期限: ${today}`)
        } else {
          await replyLINE(replyToken, `タスクの追加に失敗しました: ${error.message}`)
        }
      } else {
        // タスク以外のメモは受領確認だけ返す
        const categoryLabels: Record<string, string> = {
          direction: '方針',
          insight: '気づき',
          feedback: 'フィードバック',
          general: 'メモ',
        }
        await replyLINE(replyToken, `${categoryLabels[category] || 'メモ'}として記録しました\n${content}`)
      }
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

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// モデルフォールバック（MEO勝ち上げくんと同じ方式）
const MODEL_CANDIDATES = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
]

// 社員ごとのシステムプロンプト
function getSystemPrompt(employeeName: string, employeeRole: string, department: string): string {
  const baseContext = `あなたは「大口ヘルスケアグループ」のAI社員「${employeeName}」です。
役職: ${employeeRole}
所属: ${department}

会長の大口陽平さんからの指示に対して、あなたの専門領域で即座に対応してください。

【会社概要】
- 大口神経整体院（大阪市住吉区長居）: 神経整体、重症・難治性専門
- 晴陽鍼灸院: 訪問鍼灸リハビリ
- MEO事業: MEOチェッカー、MEO勝ち上げくん
- EC事業: サプリ・健康商品
- AI事業: 治療家AIマスター、整体院AIツール、BtoB SaaS
- メディア事業: YouTube月光ヒーリング

【対応ルール】
- 会長への報告形式で、簡潔かつ具体的に回答する
- 自分の担当領域の専門家として振る舞う
- 実行可能なアクションを提案する
- 「承知しました、会長」のような挨拶から始める
- 日本語で対応する`

  const deptContext: Record<string, string> = {
    '経営層': '経営戦略・全社方針・KPI管理・スケジュール管理・タスク整理が専門。会長の事業全体（整体院・訪問鍼灸・AI会社）の戦略立案と執行管理をサポート。',
    '財務部': '決済管理（Stripe）・キャッシュフロー・請求書/領収書管理・投資判断が専門。月次PL、資金計画、全事業の財務を一元管理。',
    '整体院事業部': '整体院のマーケティング・MEO対策・GBP投稿・広告運用・SNS投稿・LINE配信・SEO・口コミ返信が専門。また予約管理・顧客管理・WEB問診・検査シート・メニュー管理・睡眠管理・物販ECなど全アプリの運用管理も担当。',
    '訪問鍼灸事業部': '訪問鍼灸のマーケティング・MEO対策・ケアマネ営業・Instagram投稿が専門。またスタッフ管理・レセプト管理・営業管理アプリの運用と物販も担当。',
    'AI開発部': 'AI会社の収益中核部署。BtoB SaaS（治療家AIマスター・整体院AIツール・MEO勝ち上げくん・検査アプリクラウド版）の開発・販売・保守が専門。年間売上目標1,500万円の達成を牽引。Vercel/Supabase/GitHubのインフラ管理も担当。',
    'メディア部': 'YouTube月光ヒーリングの運営・動画戦略・サムネ改善・BGMトレンド分析が専門。全社横断でコンテンツ生成（動画・画像・文章）を支援する。',
  }

  return baseContext + '\n\n【部署専門領域】\n' + (deptContext[department] || '')
}

export async function POST(request: NextRequest) {
  try {
    const { message, employeeName, employeeRole, department, history, apiKey } = await request.json()

    if (!message || !employeeName) {
      return NextResponse.json({ error: 'メッセージと社員名が必要です' }, { status: 400 })
    }

    if (!apiKey || apiKey.trim().length < 50) {
      return NextResponse.json({ error: 'APIキーが設定されていません。設定画面からAPIキーを入力してください。' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: apiKey.trim() })
    const systemPrompt = getSystemPrompt(employeeName, employeeRole, department)

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        messages.push({ role: h.role, content: h.content })
      }
    }
    messages.push({ role: 'user', content: message })

    // モデルフォールバック
    let lastError: Error | null = null
    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await client.messages.create({
          model,
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        })
        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        return NextResponse.json({ response: text })
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        const msg = err.message.toLowerCase()
        if (msg.includes('authentication') || msg.includes('api_key') || msg.includes('invalid x-api-key') || msg.includes('invalid api key')) {
          return NextResponse.json({ error: 'APIキーが無効です。設定画面から正しいキーを入力してください。' }, { status: 401 })
        }
        lastError = err
      }
    }

    return NextResponse.json({ error: lastError?.message || 'AI社員が応答できません' }, { status: 500 })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'AI社員が応答できません' }, { status: 500 })
  }
}

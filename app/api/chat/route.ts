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
    '経営層': '経営戦略・全社方針・KPI管理が専門。数値に基づいた経営判断をサポート。',
    '財務部': '財務・収益管理・キャッシュフロー・投資判断が専門。月次PL、コスト削減、資金計画を担当。',
    '整体院事業部': '整体院の予約管理・顧客管理・LP最適化・検査シート・睡眠分析が専門。院の運営をITでサポート。',
    '訪問鍼灸事業部': '訪問鍼灸のスケジュール管理・レセプト・営業・SNS投稿が専門。訪問事業の効率化を担当。',
    'マーケ・コンテンツ部': '広告運用・SEO・GBP投稿・LINE配信・SNS投稿・コピーライティング・競合分析が専門。集客全般を担当。',
    'MEO事業部': 'MEO対策・Googleマップ順位・ツール開発・BtoB販売が専門。MEO事業の収益拡大を担当。',
    'EC事業部': 'ECサイト運営・サブスク管理・商品企画・物販が専門。オンライン販売を担当。',
    'AI・技術開発部': 'AI開発・サイト運営・インフラ管理・Vercel/Supabase運用が専門。技術基盤を担当。',
    'メディア事業部': 'YouTube運営・動画戦略・サムネ改善・BGMトレンド分析が専門。メディア事業を担当。',
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

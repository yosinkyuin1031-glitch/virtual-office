import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { allEmployeesList } from '../../lib/data'
import { supabase } from '../../lib/supabase'
import type { ChairmanMemo } from '../../lib/supabase'

// モデルフォールバック（MEO勝ち上げくんと同じ方式）
const MODEL_CANDIDATES = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
]

// 社員ごとのシステムプロンプト（専門知識込み）
function getSystemPrompt(employeeName: string, employeeRole: string, department: string): string {
  // 該当社員のexpertiseを取得
  const employee = allEmployeesList.find(e => e.name === employeeName)
  const expertiseContext = employee?.expertise || ''

  const baseContext = `あなたは「大口ヘルスケアグループ」のAI社員「${employeeName}」です。
役職: ${employeeRole}
所属: ${department}

あなたはこの分野のプロフェッショナルです。会長の大口陽平さんからの指示に対して、あなたの深い専門知識を活かして即座に対応してください。

【会社概要】
大口ヘルスケアグループは4つの事業柱を持つ会社です。
①大口神経整体院（大阪市住吉区長居）：神経整体×内臓×骨格×東洋医学。重症・慢性症状に特化。「病院と整体院のあいだ」のポジション。
②晴陽鍼灸院：訪問鍼灸リハビリ。健康保険ベースの在宅治療。スタッフ拡大でスケール。
③AI事業（収益中核）：治療家AIマスター、整体院AIツール、MEO勝ち上げくん、検査シートSaaS等のBtoB販売。年間売上目標1,500万円。
④メディア事業：YouTube月光ヒーリング（登録500名・動画180本）。

【会長プロフィール】
大口陽平。整体院経営者・治療家・アプリ開発者。
野球少年時代の怪我→母の自律神経不調が原点。コロナ禍開業→裁判トラブル→交通事故を乗り越えた。
理念：「痛みや不調で止まった人生に、もう一度自由にやりたい事をやってもいいという選択肢を渡す」
在り方：「自由に楽しみながらチャレンジし続ける」「結果は関係なく自分にも人にも本気で向き合う」

【顧客対応5原則（全社員共通）】
①判断を奪わない：選択肢を出して「どうしたいですか？」で締める
②人生を否定しない：過去の治療・選択を肯定する
③誠実に伝える：良いこと＋厳しいことをセットで
④尊厳を守る：成果＝価値にしない
⑤人生のベクトルを忘れない：ゴールは生活・人生の中に置く

【対応ルール】
- 会長への報告形式で、簡潔かつ具体的に回答する
- 自分の担当領域のプロとして自信を持って振る舞う
- 具体的な数値・事実に基づいて提案する
- 実行可能なアクションを必ず含める
- 「承知しました、会長」のような挨拶から始める
- 必ず日本語のみで対応する

【文体ルール（厳守）】
- #や##などの見出し記号は絶対に使わない
- **太字**や*斜体*のマークダウン記号は絶対に使わない
- 箇条書きの「-」「*」「・」は使わず、普通の文章で書く
- 番号付きリスト（1. 2. 3.）も使わない
- 人間の社員がチャットで報告するような、自然な話し言葉で書く
- 長くなりすぎず、要点を絞って伝える`

  return baseContext + (expertiseContext ? '\n\n【あなたの専門知識（プロとしての深い理解）】\n' + expertiseContext : '')
}

// 会長メモをSupabaseから取得してプロンプトに追加
async function getChairmanMemosContext(department: string, isLeader: boolean): Promise<string> {
  try {
    // レイア（CEO）は全メモ取得、他社員は関連部署のメモ + 方針メモ
    let query = supabase
      .from('chairman_memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (isLeader) {
      query = query.limit(30) // レイアは直近30件
    } else {
      // 方針メモは全社員共通、他は部署タグが一致するもの
      query = query.limit(20)
    }

    const { data: memos } = await query

    if (!memos || memos.length === 0) return ''

    // 部署フィルタ（レイア以外）
    let filtered = memos as ChairmanMemo[]
    if (!isLeader) {
      filtered = memos.filter((m: ChairmanMemo) =>
        m.category === 'direction' || // 方針は全員
        m.department_tags.length === 0 || // タグなしは全員
        m.department_tags.includes(department)
      )
    }

    if (filtered.length === 0) return ''

    const categoryLabels: Record<string, string> = {
      direction: '方針', insight: '気づき', task: 'タスク', feedback: 'FB', general: 'メモ',
    }

    const lines = filtered.slice(0, 15).map((m: ChairmanMemo) => {
      const date = new Date(m.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      const src = m.source === 'line' ? '[LINE]' : ''
      return `${date}${src}【${categoryLabels[m.category] || 'メモ'}】${m.content}`
    })

    return '\n\n【会長の最新メモ（これを踏まえて対応すること）】\n' + lines.join('\n')
  } catch {
    return '' // メモ取得失敗時はスキップ
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, employeeName, employeeRole, department, history, apiKey } = await request.json()

    if (!message || !employeeName) {
      return NextResponse.json({ error: 'メッセージと社員名が必要です' }, { status: 400 })
    }

    // サーバー側の環境変数を優先、なければブラウザから送られたキーを使用
    const resolvedKey = process.env.ANTHROPIC_API_KEY || (apiKey && apiKey.trim())
    if (!resolvedKey || resolvedKey.length < 50) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: resolvedKey })
    const isLeader = employeeName === 'レイア' || employeeName === 'ソラト' || employeeName === 'ミコ'
    const memosContext = await getChairmanMemosContext(department, isLeader)
    const systemPrompt = getSystemPrompt(employeeName, employeeRole, department) + memosContext

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

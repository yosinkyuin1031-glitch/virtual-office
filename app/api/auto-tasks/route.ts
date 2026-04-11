import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { sendLINEBroadcast } from '../../lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export const runtime = 'nodejs'
export const maxDuration = 120

// GET: タスク一覧取得
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')

    let query = supabase
      .from('vo_tasks')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ tasks: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: KPI・週間設計・キャンペーンに基づくデイリータスク自動生成
export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 })
    }

    // 現在のKPIを取得
    const { data: goals, error: goalsError } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    if (goalsError) throw goalsError

    // コンテキストを取得
    const { data: contexts } = await supabase
      .from('vo_context')
      .select('*')
      .order('sort_order', { ascending: true })

    const goalsText = (goals || []).map(g => `- ${g.label}: ${g.value}`).join('\n')

    // カテゴリ別にコンテキストを整理
    const contextByCategory: Record<string, string[]> = {}
    for (const c of contexts || []) {
      if (!contextByCategory[c.category]) contextByCategory[c.category] = []
      contextByCategory[c.category].push(`${c.title}: ${c.content}`)
    }
    const contextText = Object.entries(contextByCategory)
      .map(([cat, items]) => `\n=== ${cat} ===\n${items.join('\n')}`)
      .join('\n')

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
    const month = now.getMonth() + 1

    // 曜日別の会長スケジュール
    const weeklyDesign: Record<string, string> = {
      '月': '新規のみ・作業（10人）→ 判断・評価の日。新規患者の評価とリピート判断を行う',
      '火': '施術（10人）→ 安定稼働の日。既存患者中心の施術',
      '水': '思考・構築（0人）→ 院にいない日。HP・ブログ・動画・サービス見直し・数字確認',
      '木': '施術（10人）→ 安定稼働の日。既存患者中心の施術',
      '金': '施術（10人）→ 安定稼働の日。既存患者中心の施術',
      '土': '施術・学び（0〜8人）→ 余白。セミナーや勉強会も',
      '日': '完全オフ（0人）→ 回復日。仕事しない',
    }
    const todaySchedule = weeklyDesign[dayOfWeek] || '不明'

    // 当月キャンペーン
    const campaignMap: Record<number, string> = {
      1: 'ダイエット＋お年玉キャンペーン（新規・既存）正月太りリセット',
      2: '冷え×神経痛ケアキャンペーン（新規・掘り起こし）',
      3: '腸内環境・ファスティングキャンペーン（既存）花粉・アレルギー対策',
      4: '自律神経ケアキャンペーン（新規）新生活疲労・朝がしんどい・気持ちが落ち着かない',
      5: 'GW明け疲労・5月病キャンペーン（新規）寝ても回復しない・気力が戻らない',
      6: '梅雨×頭痛ケアキャンペーン（新規）気圧変動・首まわりの緊張',
      7: 'ダイエット＋熱中症予防キャンペーン（新規・既存）冷房病対策',
      8: '睡眠の質改善キャンペーン（新規）熱中症予防・睡眠の質',
      9: '抜け毛・薄毛ケアキャンペーン（既存）夏ダメージ×抜け毛',
      10: '痛み・痺れ早期対策キャンペーン（新規）年末に向けた早期対策',
      11: '腸内環境・冷え性予防キャンペーン（既存）',
      12: '関節痛・神経痛ケアキャンペーン（新規）寒さによる関節痛対策',
    }
    const currentCampaign = campaignMap[month] || '—'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      system: `あなたは治療院経営×AIアプリ開発企業「AI Solutions」の経営参謀AIです。
会長（大口陽平）のKPI・週間設計・当月キャンペーン・事業コンテキストを総合的に分析し、
**今日やるべき具体的なタスク**を各部署のAI社員に割り振ってください。

━━━ 今日の情報 ━━━
日付: ${today}（${dayOfWeek}曜日）
会長の本日のスケジュール: ${todaySchedule}
当月キャンペーン: ${currentCampaign}

━━━ 部署・担当者一覧 ━━━
経営層: レイア（CEO・戦略）、ソラト（COO・進捗管理）、ミコ（秘書・タスク整理）、ルカ（書類・仕組み化）
財務部: ミサ（CFO・決済・PL）
整体院事業部: ハル（MEO・広告・集客）、ナギ（アプリ管理）、フミ（コピーライティング）
訪問鍼灸事業部: アキ（訪問営業）、ユキ（レセプト・労務）、サク（SNS・営業リスト）
AI開発部: テツ（BtoB SaaS戦略）、コウ（AI開発）、リク（SaaS開発・課金）、タク（インフラ）
メディア部: ツキ（YouTube）、ルナ（コンテンツ分析）
LP・Web制作部: マヤ（LP設計）、リン（HP・SEO）、ノア（高額商品LP）
BtoB営業部: ジン（BtoB営業・提案書）、セナ（リサーチ・競合分析）、リオ（FB運用・ローンチ）
動画・デザイン制作部: ヒカ（動画編集）、スイ（デザイン・POP）
プロダクト管理部: カナ（PM）、ミオ（UX/UI）、レン（QA）
カスタマーサクセス部: アオイ（導入支援）、ショウ（BtoB集客）

━━━ タスク生成ルール ━━━
1. 曜日に合わせたタスクを出す（施術日は院内業務中心、思考日は戦略タスク、オフ日はAI社員だけが動く）
2. 当月キャンペーンに紐づいたマーケティングタスクを必ず含める
3. KPIのギャップ（目標vs現在値）が大きいものを優先的に扱う
4. 「今日中にやる」レベルの具体的なアクションにする
5. 抽象的な「検討する」「考える」ではなく「○○を作成する」「○○を3件送る」等
6. 会長がやることとAI社員がやることを明確に分ける
7. titleは必ず25文字以内。途中で切れたタスクは絶対NG
8. descriptionは100文字以内で簡潔に
9. MEO勝ち上げくん: モニター11名稼働中だが大口さんの運用作業はない。「モニターFB確認」「安定性チェック」程度に留める
10. YouTube自動投稿: 4ch完全自動運用中。投稿タスクは出さない。「分析確認」「戦略見直し」程度
11. Facebook投稿タスクはアプリ事業（BtoB SaaS・アプリ販売）のみ生成。整体院・訪問鍼灸・治療機器販売・治療家コミュニティのFB投稿タスクは生成しない

━━━ KPIギャップの優先度 ━━━
最優先: カルテ65枚（現61枚）、既存単価12,000円（現9,500円）、サブスク80万（現54-61万）
重要: BtoB導入50院（現10院）、訪問スタッフ3名（現2名）、物販月15万円
成長: MRR125万円（現8.9万円）、来院頻度3.5回（現3.0回）

━━━ 出力フォーマット ━━━
JSON配列のみ出力。他テキスト不要。
[
  {
    "department": "部署名",
    "employee_name": "担当AI社員名",
    "title": "タスク名（25文字以内）",
    "description": "具体的なアクション内容（何をどうするか）",
    "priority": "high/normal/low",
    "due_date": "${today}"
  }
]

合計20〜30件。highは30%程度。due_dateは基本今日だが、週内に終わればいいものは数日後でもOK。`,
      messages: [{
        role: 'user',
        content: `【現在のKPI・目標】
${goalsText}

【事業コンテキスト（カテゴリ別）】
${contextText}

━━━━━━━━━━━━━━━━━━━━━━━━
今日は${today}（${dayOfWeek}曜日）です。
会長のスケジュール: ${todaySchedule}
当月キャンペーン: ${currentCampaign}

上記の全情報を踏まえて、**今日やるべきタスク**を各部署のAI社員ごとに生成してください。
KPIのギャップが大きい項目（カルテ枚数・単価UP・サブスク・BtoB導入）を最優先で扱ってください。`,
      }],
    })

    const resultText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    // JSONをパース
    const jsonMatch = resultText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIからのレスポンスをパースできませんでした', raw: resultText }, { status: 500 })
    }

    const tasks = JSON.parse(jsonMatch[0])
    const batchId = `batch_${Date.now()}`

    // 既存のpendingタスクをキャンセル（新しいバッチに置き換え）
    await supabase
      .from('vo_tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('status', 'pending')
      .eq('generated_by', 'ai')

    // 新しいタスクを一括挿入
    const tasksToInsert = tasks.map((t: Record<string, string>) => ({
      department: t.department,
      employee_name: t.employee_name || null,
      title: t.title,
      description: t.description,
      priority: t.priority || 'normal',
      status: 'pending',
      due_date: t.due_date || null,
      batch_id: batchId,
      generated_by: 'ai',
    }))

    const { data: insertedTasks, error: insertError } = await supabase
      .from('vo_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      tasks: insertedTasks,
      batch_id: batchId,
      count: insertedTasks?.length || 0,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT: タスク更新（ステータス・優先度）
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, priority } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, string> = { updated_at: new Date().toISOString() }
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const { data, error } = await supabase
      .from('vo_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // タスク完了時にLINE通知
    if (status === 'completed' && data) {
      const completedTask = data as Record<string, unknown>
      await sendLINEBroadcast(
        `タスク完了\n━━━━━━━━━━━━━\n${completedTask.department}: ${completedTask.title}\n${(completedTask.description as string || '').substring(0, 100)}\n━━━━━━━━━━━━━`
      ).catch(() => {})
    }

    return NextResponse.json({ task: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: タスク削除
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vo_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

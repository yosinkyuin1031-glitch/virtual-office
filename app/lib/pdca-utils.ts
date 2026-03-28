// PDCA自動サイクル 共通ユーティリティ
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Supabaseクライアント（サービスロールキー優先）
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Claude APIクライアント
export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が未設定です')
  return new Anthropic({ apiKey })
}

// モデル候補（フォールバック付き）
const MODEL_CANDIDATES = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
]

// Claude API呼び出し（モデルフォールバック付き）
export async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096
): Promise<string> {
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n')
      return text
    } catch {
      continue
    }
  }
  throw new Error('全モデルでAPI呼び出しに失敗しました')
}

// JSONをテキストから抽出
export function extractJSON(text: string): unknown | null {
  // 配列パターン
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]) } catch { /* ignore */ }
  }
  // オブジェクトパターン
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch { /* ignore */ }
  }
  return null
}

// セクション分割（区切り文字で分離）
export function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const parts = text.split(/===(\w+)===/g)
  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i]] = (parts[i + 1] || '').trim()
  }
  return sections
}

// CRON認証チェック
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

// JST今日の日付範囲を取得
export function getJSTDateRange() {
  const now = new Date()
  // JSTはUTC+9
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const jstToday = jstNow.toISOString().split('T')[0]

  // JSTの今日00:00をUTCに変換
  const todayStartJST = new Date(`${jstToday}T00:00:00+09:00`)
  const todayEndJST = new Date(`${jstToday}T23:59:59+09:00`)

  return {
    today: jstToday,
    startUTC: todayStartJST.toISOString(),
    endUTC: todayEndJST.toISOString(),
    jstNow,
  }
}

// 活動ログに記録
export async function logActivity(
  employeeName: string,
  department: string,
  action: string,
  detail: string
) {
  const supabase = getSupabase()
  await supabase.from('activity_log').insert({
    employee_name: employeeName,
    department,
    action,
    detail: detail.substring(0, 2000),
  })
}

// PDCAレポートを保存
export async function savePDCAReport(
  cycleType: 'morning' | 'evening' | 'weekly',
  data: Record<string, unknown>
) {
  const supabase = getSupabase()
  await supabase.from('vo_pdca_reports').insert({
    cycle_type: cycleType,
    ...data,
  })
}

// 重複実行防止チェック（同日同タイプのレポートが既にあるか）
export async function isDuplicateExecution(cycleType: string): Promise<boolean> {
  const supabase = getSupabase()
  const { today } = getJSTDateRange()

  const { data } = await supabase
    .from('vo_pdca_reports')
    .select('id')
    .eq('cycle_type', cycleType)
    .gte('executed_at', `${today}T00:00:00+09:00`)
    .lte('executed_at', `${today}T23:59:59+09:00`)
    .limit(1)

  return (data && data.length > 0) || false
}

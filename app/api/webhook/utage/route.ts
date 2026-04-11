import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, logActivity } from '../../../lib/pdca-utils'
import { sendLINEBroadcast } from '../../../lib/line-notify'

export const runtime = 'nodejs'

// 宴（UTAGE）からのWebhook受信エンドポイント
// UTAGEのファネル・メール・LINE連携などからPOSTを受け取り、自動化アクションに変換
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabase()

    // UTAGEからのペイロードを解析
    const {
      event,        // イベント種別（purchase, opt_in, tag_added, etc.）
      customer_id,  // 顧客ID（UTAGE側）
      email,        // メールアドレス
      name,         // 顧客名
      product,      // 商品名
      tag,          // タグ名
      data: extraData,  // 追加データ
    } = body

    // ログ記録
    await logActivity('システム', '経営層', 'UTAGE Webhook受信',
      `event=${event || 'unknown'}, name=${name || ''}, email=${email || ''}, product=${product || ''}`)

    // event_triggerの自動化ルールを検索して実行
    const { data: automations } = await supabase
      .from('vo_automations')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'event_trigger')

    const matched = (automations || []).filter((auto: { trigger_config: Record<string, unknown> }) => {
      const config = auto.trigger_config
      return config.event_type === `utage_${event}` || config.event_type === 'utage_any'
    })

    const results: string[] = []

    for (const auto of matched) {
      try {
        // 自動化ルールのautomation APIに委譲
        const res = await fetch(new URL('/api/automation', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: `utage_${event}`,
            customer_id: customer_id || email,
            data: { name, email, product, tag, ...extraData },
          }),
        })
        results.push(`automation: ${res.status}`)
      } catch {
        results.push(`automation: error`)
      }
    }

    // マッチする自動化がなくても、大口さんに通知
    if (matched.length === 0 && event) {
      await sendLINEBroadcast(
        `🔔 UTAGE通知\n\nイベント: ${event}\n名前: ${name || '不明'}\nメール: ${email || '不明'}\n商品: ${product || '-'}`
      )
    }

    return NextResponse.json({
      status: 'ok',
      event,
      automations_triggered: matched.length,
      results,
    })
  } catch (error) {
    console.error('UTAGE Webhook error:', error)
    return NextResponse.json({ status: 'ok' })
  }
}

// Webhook疎通確認用
export async function GET() {
  return NextResponse.json({ status: 'UTAGE Webhook endpoint is active' })
}

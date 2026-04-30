import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getJSTDateRange,
  logActivity,
} from '../../lib/pdca-utils'
import { sendLINEBroadcast } from '../../lib/line-notify'

export const runtime = 'nodejs'
export const maxDuration = 60

// トリガー種別
type TriggerType = 'date_trigger' | 'time_trigger' | 'event_trigger'

// アクション種別
type ActionType = 'line_message' | 'utage_webhook' | 'gmb_post' | 'sns_post' | 'task_create' | 'notify_owner'

interface Automation {
  id: string
  name: string
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  action_type: ActionType
  action_config: Record<string, unknown>
  is_active: boolean
}

// GET: cron実行 - time_trigger/date_triggerを評価して該当する自動化を実行
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const { today, jstNow } = getJSTDateRange()
    const hour = jstNow.getUTCHours()
    const dayOfMonth = jstNow.getUTCDate()
    const dayOfWeek = jstNow.getUTCDay() // 0=日
    const month = jstNow.getUTCMonth() + 1

    // アクティブな自動化ルールを取得
    const { data: automations } = await supabase
      .from('vo_automations')
      .select('*')
      .eq('is_active', true)
      .in('trigger_type', ['time_trigger', 'date_trigger'])

    if (!automations || automations.length === 0) {
      return NextResponse.json({ message: 'No active automations' })
    }

    const results: Array<{ id: string; name: string; status: string; error?: string }> = []

    for (const auto of automations as Automation[]) {
      let shouldRun = false
      const config = auto.trigger_config

      if (auto.trigger_type === 'time_trigger') {
        // 時間トリガー評価
        const triggerHour = config.hour as number | undefined
        const triggerDayOfMonth = config.day_of_month as number | undefined
        const triggerDayOfWeek = config.day_of_week as number | undefined
        const triggerFrequency = (config.frequency as string) || 'daily'

        if (triggerHour !== undefined && triggerHour !== hour) continue

        if (triggerFrequency === 'daily') {
          shouldRun = true
        } else if (triggerFrequency === 'weekly' && triggerDayOfWeek !== undefined) {
          shouldRun = dayOfWeek === triggerDayOfWeek
        } else if (triggerFrequency === 'monthly' && triggerDayOfMonth !== undefined) {
          shouldRun = dayOfMonth === triggerDayOfMonth
        }
      } else if (auto.trigger_type === 'date_trigger') {
        // 日付トリガー評価（誕生日・記念日など）
        const triggerMonth = config.month as number | undefined
        const triggerDay = config.day as number | undefined
        const triggerDate = config.date as string | undefined // YYYY-MM-DD形式

        if (triggerDate) {
          shouldRun = triggerDate === today
        } else if (triggerMonth !== undefined && triggerDay !== undefined) {
          shouldRun = month === triggerMonth && dayOfMonth === triggerDay
        }
      }

      if (!shouldRun) continue

      // 重複実行チェック（同日同ID）
      const { data: alreadyRun } = await supabase
        .from('vo_automation_logs')
        .select('id')
        .eq('automation_id', auto.id)
        .gte('executed_at', `${today}T00:00:00+09:00`)
        .lte('executed_at', `${today}T23:59:59+09:00`)
        .limit(1)

      if (alreadyRun && alreadyRun.length > 0) continue

      // アクション実行
      try {
        const result = await executeAction(supabase, auto)
        await supabase.from('vo_automation_logs').insert({
          automation_id: auto.id,
          status: 'success',
          result: typeof result === 'string' ? result : JSON.stringify(result),
        })
        results.push({ id: auto.id, name: auto.name, status: 'success' })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        await supabase.from('vo_automation_logs').insert({
          automation_id: auto.id,
          status: 'error',
          error: errMsg,
        })
        results.push({ id: auto.id, name: auto.name, status: 'error', error: errMsg })
      }
    }

    return NextResponse.json({ success: true, date: today, executed: results.length, results })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// POST: 外部イベントトリガー（event_trigger）/ 顧客ID指定の自動化実行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, customer_id, data: eventData } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // event_triggerタイプの自動化ルールを検索
    const { data: automations } = await supabase
      .from('vo_automations')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'event_trigger')

    // event_typeが一致するものを抽出
    const matched = (automations || []).filter((auto: Automation) => {
      const config = auto.trigger_config
      return config.event_type === event_type
    }) as Automation[]

    if (matched.length === 0) {
      return NextResponse.json({ message: 'No matching automations', event_type })
    }

    const results: Array<{ id: string; name: string; status: string }> = []

    for (const auto of matched) {
      try {
        // customer_idがあればaction_configにマージ
        const enrichedAuto = customer_id
          ? { ...auto, action_config: { ...auto.action_config, customer_id, event_data: eventData } }
          : { ...auto, action_config: { ...auto.action_config, event_data: eventData } }

        const result = await executeAction(supabase, enrichedAuto)

        await supabase.from('vo_automation_logs').insert({
          automation_id: auto.id,
          status: 'success',
          result: JSON.stringify({ customer_id, result }),
        })
        results.push({ id: auto.id, name: auto.name, status: 'success' })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        await supabase.from('vo_automation_logs').insert({
          automation_id: auto.id,
          status: 'error',
          error: errMsg,
        })
        results.push({ id: auto.id, name: auto.name, status: 'error' })
      }
    }

    return NextResponse.json({ success: true, event_type, customer_id, executed: results.length, results })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// アクション実行
async function executeAction(
  supabase: ReturnType<typeof getSupabase>,
  auto: Automation
): Promise<string> {
  const config = auto.action_config
  const { today } = getJSTDateRange()

  switch (auto.action_type) {
    case 'line_message': {
      const message = (config.message as string) || auto.name
      const sent = await sendLINEBroadcast(message, 'automation')
      return sent ? 'LINE送信成功' : 'LINE送信失敗'
    }

    case 'notify_owner': {
      const message = (config.message as string) || `🔔 ${auto.name}`
      const customerId = config.customer_id as string | undefined
      const prefix = customerId ? `[顧客ID: ${customerId}] ` : ''
      const sent = await sendLINEBroadcast(`${prefix}${message}`, 'urgent')
      return sent ? '通知送信成功' : '通知送信失敗'
    }

    case 'utage_webhook': {
      const webhookUrl = config.webhook_url as string
      if (!webhookUrl) throw new Error('webhook_url未設定')
      const payload = config.payload || {}
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return `UTAGE Webhook: ${res.status}`
    }

    case 'task_create': {
      const taskTitle = (config.title as string) || auto.name
      const department = (config.department as string) || '経営層'
      await supabase.from('vo_tasks').insert({
        department,
        title: taskTitle.substring(0, 30),
        description: (config.description as string) || taskTitle,
        priority: (config.priority as string) || 'normal',
        status: 'pending',
        due_date: today,
        batch_id: `automation_${auto.id}`,
        generated_by: 'automation',
      })
      return `タスク生成: ${taskTitle}`
    }

    case 'gmb_post': {
      // GMB投稿は原稿作成まで（外部投稿は手動方針）
      const content = (config.content as string) || ''
      await logActivity('ハル', '整体院事業部', 'GMB投稿原稿生成', content.substring(0, 500))
      return `GMB原稿作成完了`
    }

    case 'sns_post': {
      // SNS投稿も原稿作成まで
      const content = (config.content as string) || ''
      const platform = (config.platform as string) || 'instagram'
      await logActivity('サク', '訪問鍼灸事業部', `${platform}投稿原稿生成`, content.substring(0, 500))
      return `${platform}原稿作成完了`
    }

    default:
      throw new Error(`未対応のアクション: ${auto.action_type}`)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getJSTDateRange,
  logActivity,
} from '../../../lib/pdca-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

// KPI自動追跡: 実データからKPIの「current」値を自動更新
// 朝のPDCAサイクルの前（毎朝6:50 JST = UTC 21:50）に実行
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const { today } = getJSTDateRange()
    const updated: Array<{ key: string; old: string; new: string }> = []

    // 1. vo_goalsの全KPIを取得
    const { data: goals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!goals || goals.length === 0) {
      return NextResponse.json({ message: 'KPIが未設定です' })
    }

    // 2. 各KPIに対して実データを収集
    for (const goal of goals) {
      const key = (goal.key || goal.label || '').toLowerCase()
      let newCurrent: string | null = null

      // --- タスク完了率 ---
      if (key.includes('タスク') || key.includes('完了率')) {
        const { data: tasks } = await supabase
          .from('vo_tasks')
          .select('status')
          .in('status', ['pending', 'in_progress', 'completed'])
        if (tasks) {
          const total = tasks.length
          const completed = tasks.filter(t => t.status === 'completed').length
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0
          newCurrent = `${completed}/${total}件 (${rate}%)`
        }
      }

      // --- BtoB導入院数（commandsやactivity_logから推定） ---
      if (key.includes('導入院') || key.includes('btob') && key.includes('院')) {
        // モニター管理テーブルがある場合はそこから、なければ現状値維持
        // 将来的にStripeの顧客数から自動取得
      }

      // --- サブスク会員数 ---
      if (key.includes('サブスク') && key.includes('会員')) {
        // Stripe APIから自動取得（STRIPE_SECRET_KEY設定時のみ）
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (stripeKey) {
          try {
            const res = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
              headers: { 'Authorization': `Bearer ${stripeKey}` },
            })
            const data = await res.json()
            if (data.data) {
              const activeCount = data.data.length
              // MRRも計算
              const mrr = data.data.reduce((sum: number, sub: { items: { data: Array<{ price: { unit_amount: number } }> } }) => {
                return sum + (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100
              }, 0)
              newCurrent = `${activeCount}人（月${Math.round(mrr).toLocaleString()}円）`
            }
          } catch { /* Stripe接続エラーは無視 */ }
        }
      }

      // --- MRR（BtoB） ---
      if (key.includes('mrr')) {
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (stripeKey) {
          try {
            const res = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
              headers: { 'Authorization': `Bearer ${stripeKey}` },
            })
            const data = await res.json()
            if (data.data) {
              const mrr = data.data.reduce((sum: number, sub: { items: { data: Array<{ price: { unit_amount: number } }> } }) => {
                return sum + (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100
              }, 0)
              newCurrent = `${Math.round(mrr).toLocaleString()}円`
            }
          } catch { /* ignore */ }
        }
      }

      // --- プロダクト数 ---
      if (key.includes('プロダクト') || key.includes('開発')) {
        // Vercelプロジェクト数から自動取得
        const vercelToken = process.env.VERCEL_TOKEN
        if (vercelToken) {
          try {
            const res = await fetch('https://api.vercel.com/v9/projects?limit=100', {
              headers: { 'Authorization': `Bearer ${vercelToken}` },
            })
            const data = await res.json()
            if (data.projects) {
              newCurrent = `${data.projects.length}個`
            }
          } catch { /* ignore */ }
        }
      }

      // --- 活動量ベースのKPI（PDCAサイクルの稼働状況） ---
      if (key.includes('pdca') || key.includes('自動化')) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: reports } = await supabase
          .from('vo_pdca_reports')
          .select('cycle_type')
          .gte('executed_at', weekAgo)
        if (reports) {
          const morning = reports.filter(r => r.cycle_type === 'morning').length
          const evening = reports.filter(r => r.cycle_type === 'evening').length
          const weekly = reports.filter(r => r.cycle_type === 'weekly').length
          newCurrent = `朝${morning}回・夜${evening}回・週次${weekly}回（7日間）`
        }
      }

      // KPIの値が変わった場合のみ更新
      if (newCurrent && newCurrent !== goal.current) {
        const oldValue = goal.current || '未測定'
        await supabase
          .from('vo_goals')
          .update({
            current: newCurrent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', goal.id)

        updated.push({
          key: goal.label,
          old: oldValue,
          new: newCurrent,
        })
      }
    }

    // 更新があった場合は活動ログに記録
    if (updated.length > 0) {
      const detail = updated.map(u => `${u.key}: ${u.old} → ${u.new}`).join('\n')
      await logActivity('ソラト', '経営層', 'KPI自動更新',
        `${updated.length}件のKPIを実データから更新\n${detail}`)
    }

    // KPIスナップショットも更新
    const { data: latestGoals } = await supabase
      .from('vo_goals')
      .select('*')
      .order('sort_order', { ascending: true })

    await supabase.from('vo_kpi_snapshots').upsert({
      snapshot_date: today,
      goals_snapshot: latestGoals || [],
      activity_count: 0,
    }, { onConflict: 'snapshot_date' })

    return NextResponse.json({
      success: true,
      date: today,
      updated: updated.length,
      details: updated,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

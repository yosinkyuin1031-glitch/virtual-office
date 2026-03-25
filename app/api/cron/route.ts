import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

// Vercel Cron: 5分ごとにpending指令をサーバー側で処理
// vercel.json の crons 設定で自動呼び出し
// ローカルworkerが動いていない時のフォールバック

const MODEL_CANDIDATES = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
]

export async function GET(request: NextRequest) {
  // Vercel Cronからの呼び出し確認（セキュリティ）
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // CRON_SECRETが設定されている場合は認証必須
    // 設定されていない場合はスキップ（開発中）
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // pending の指令を最大3件取得
    const { data: commands } = await supabase
      .from('commands')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true }) // urgent=最優先
      .order('created_at', { ascending: true })
      .limit(3)

    if (!commands || commands.length === 0) {
      // ついでにクリーンアップ
      await cleanup()
      return NextResponse.json({ message: 'No pending commands', cleaned: true })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: `${commands.length} commands pending, no API key for server execution` })
    }

    const client = new Anthropic({ apiKey })
    const results = []

    for (const cmd of commands) {
      // running に更新
      await supabase.from('commands').update({
        status: 'running',
        started_at: new Date().toISOString(),
      }).eq('id', cmd.id)

      // 活動ログ
      await supabase.from('activity_log').insert({
        employee_name: cmd.assigned_employee || 'システム',
        department: cmd.assigned_department || '全社',
        action: '指令受付（サーバー）',
        detail: cmd.instruction.substring(0, 200),
        command_id: cmd.id,
      })

      try {
        // Claude APIで実行
        const prompt = buildPrompt(cmd)
        let response = null

        for (const model of MODEL_CANDIDATES) {
          try {
            response = await client.messages.create({
              model,
              max_tokens: 2000,
              messages: [{ role: 'user', content: prompt }],
            })
            break
          } catch {
            continue
          }
        }

        const result = response?.content?.[0]?.type === 'text'
          ? response.content[0].text
          : '応答を取得できませんでした'

        // 完了
        await supabase.from('commands').update({
          status: 'completed',
          result: result.substring(0, 10000),
          completed_at: new Date().toISOString(),
        }).eq('id', cmd.id)

        // 活動ログ
        await supabase.from('activity_log').insert({
          employee_name: cmd.assigned_employee || 'システム',
          department: cmd.assigned_department || '全社',
          action: '指令完了（サーバー）',
          detail: `${cmd.instruction.substring(0, 100)} → 完了`,
          command_id: cmd.id,
        })

        // ワークフロー進行
        if (cmd.workflow_id) {
          await advanceWorkflow(cmd.workflow_id, cmd.workflow_step)
        }

        results.push({ id: cmd.id, status: 'completed' })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        await supabase.from('commands').update({
          status: 'failed',
          error: errMsg,
          completed_at: new Date().toISOString(),
        }).eq('id', cmd.id)

        results.push({ id: cmd.id, status: 'failed', error: errMsg })
      }
    }

    // クリーンアップ
    await cleanup()

    return NextResponse.json({ processed: results.length, results })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

function buildPrompt(cmd: { instruction: string; assigned_employee?: string; assigned_department?: string }) {
  const lines = []
  if (cmd.assigned_employee) {
    lines.push(`あなたは大口ヘルスケアグループのAI社員「${cmd.assigned_employee}」（${cmd.assigned_department || ''}）です。`)
  }
  lines.push('以下の指令を実行し、結果を簡潔に報告してください。')
  lines.push('')
  lines.push(cmd.instruction)
  return lines.join('\n')
}

async function advanceWorkflow(workflowId: string, currentStep: number | null) {
  try {
    const { data: wfs } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)

    if (!wfs?.length) return
    const wf = wfs[0]
    const next = (currentStep || 0) + 1

    if (next > wf.total_steps) {
      await supabase.from('workflows').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', workflowId)
    } else {
      await supabase.from('workflows').update({
        current_step: next,
      }).eq('id', workflowId)
    }
  } catch {}
}

// 古い指令・ログを自動削除
async function cleanup() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 完了済み指令は7日後に削除
  await supabase.from('commands')
    .delete()
    .eq('status', 'completed')
    .lt('completed_at', weekAgo)

  // 失敗指令は30日後に削除
  await supabase.from('commands')
    .delete()
    .eq('status', 'failed')
    .lt('completed_at', monthAgo)

  // 活動ログは30日後に削除
  await supabase.from('activity_log')
    .delete()
    .lt('created_at', monthAgo)

  // 完了ワークフローは7日後に削除
  await supabase.from('workflows')
    .delete()
    .eq('status', 'completed')
    .lt('completed_at', weekAgo)
}

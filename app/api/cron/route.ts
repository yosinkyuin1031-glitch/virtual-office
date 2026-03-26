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

        const rawResult = response?.content?.[0]?.type === 'text'
          ? response.content[0].text
          : '応答を取得できませんでした'
        const result = cleanAIText(rawResult)

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

// AIっぽいマークダウン記号を除去
function cleanAIText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')          // ## 見出し
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')   // ***太字斜体***
    .replace(/\*\*(.*?)\*\*/g, '$1')       // **太字**
    .replace(/\*(.*?)\*/g, '$1')           // *斜体*
    .replace(/^[-*+]\s+/gm, '')            // - リスト記号
    .replace(/^\d+\.\s+/gm, '')            // 1. 番号リスト
    .replace(/^>\s+/gm, '')                // > 引用
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))  // `コード`
    .replace(/^---+$/gm, '')               // --- 区切り線
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [リンク](url)
    .replace(/\n{3,}/g, '\n\n')            // 3行以上の空行を2行に
    .trim()
}

function buildPrompt(cmd: { instruction: string; assigned_employee?: string; assigned_department?: string }) {
  const lines = []
  if (cmd.assigned_employee) {
    lines.push(`あなたは大口ヘルスケアグループのAI社員「${cmd.assigned_employee}」（${cmd.assigned_department || ''}）です。`)
  }
  lines.push('以下の指令を実行し、結果を簡潔に報告してください。')
  lines.push('回答にはマークダウン記号（**、##、*、---、```など）を一切使わず、プレーンテキストで書いてください。')
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

      // 次ステップの指令を自動生成（stepsとcontextから）
      const ctx = wf.context || {}
      const steps = ctx.steps || []
      const nextStep = steps.find((s: { order: number }) => s.order === next)
      if (nextStep) {
        const contextLines: string[] = []
        if (ctx.subject) contextLines.push(`対象: ${ctx.subject}`)
        if (ctx.detail) contextLines.push(`背景: ${ctx.detail}`)
        if (ctx.goal) contextLines.push(`ゴール: ${ctx.goal}`)
        const contextStr = contextLines.length > 0 ? `\n${contextLines.join('\n')}` : ''

        await supabase.from('commands').insert({
          instruction: `【${wf.name}】Step ${nextStep.order}: ${nextStep.action} — ${nextStep.description}${contextStr}`,
          status: 'pending',
          priority: 'high',
          assigned_department: nextStep.department,
          assigned_employee: nextStep.employee,
          workflow_id: workflowId,
          workflow_step: next,
          source: 'workflow',
        })
      }
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

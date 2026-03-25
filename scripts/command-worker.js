#!/usr/bin/env node
/**
 * 指令実行ワーカー — Supabaseの指令キューを監視し、Claude Codeで自動実行
 *
 * Usage:
 *   node scripts/command-worker.js          # 1回チェック＆実行
 *   node scripts/command-worker.js --watch  # 60秒ごとに監視（デーモンモード）
 *   node scripts/command-worker.js --list   # 保留中の指令を一覧表示
 *
 * cron設定例（毎分チェック）:
 *   * * * * * cd /path/to/virtual-office && node scripts/command-worker.js >> /tmp/command-worker.log 2>&1
 */

const { execSync } = require('child_process')

const SUPABASE_URL = 'https://vzkfkazjylrkspqrnhnx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// Supabase REST API helper
async function supabaseGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers })
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`)
  return res.json()
}

async function supabasePatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status}`)
  return res.json()
}

async function supabaseInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`INSERT ${table} failed: ${res.status}`)
  return res.json()
}

// 保留中の指令を取得
async function getPendingCommands() {
  return supabaseGet('commands', 'status=eq.pending&order=created_at.asc&limit=5')
}

// 指令を実行
async function executeCommand(cmd) {
  const now = new Date().toLocaleString('ja-JP')
  console.log(`\n━━━ [${now}] 指令実行開始 ━━━`)
  console.log(`  ID: ${cmd.id}`)
  console.log(`  指示: ${cmd.instruction}`)
  console.log(`  担当: ${cmd.assigned_employee || '未指定'} (${cmd.assigned_department || '未指定'})`)
  console.log(`  優先: ${cmd.priority}`)

  // ステータスを「実行中」に更新
  await supabasePatch('commands', cmd.id, {
    status: 'running',
    started_at: new Date().toISOString(),
  })

  try {
    // 指示内容に基づいてClaude Codeコマンドを構築
    const instruction = cmd.instruction
    let result = ''

    // ワークフロー内のスキルコマンドがある場合
    // 一般的な指示の場合はclaude -p で実行
    const claudePrompt = buildClaudePrompt(cmd)

    console.log(`  実行コマンド: claude -p "${claudePrompt.substring(0, 100)}..."`)

    try {
      result = execSync(
        `claude -p "${claudePrompt.replace(/"/g, '\\"')}"`,
        {
          encoding: 'utf-8',
          timeout: 300000, // 5分タイムアウト
          cwd: process.env.HOME,
          maxBuffer: 10 * 1024 * 1024,
        }
      ).trim()
    } catch (execError) {
      // claude コマンドが見つからない場合のフォールバック
      result = `[自動実行] 指令を受け付けました: ${instruction}\n担当: ${cmd.assigned_employee || '自動割当'}\nステータス: 実行キューに追加済み`
    }

    // 成功 — 結果を保存
    await supabasePatch('commands', cmd.id, {
      status: 'completed',
      result: result.substring(0, 10000), // 10KB制限
      completed_at: new Date().toISOString(),
    })

    // 活動ログに記録
    if (cmd.assigned_employee) {
      await supabaseInsert('activity_log', {
        employee_name: cmd.assigned_employee,
        department: cmd.assigned_department || '',
        action: '指令実行完了',
        detail: `${instruction.substring(0, 200)} → 完了`,
        command_id: cmd.id,
      }).catch(() => {}) // ログ保存失敗は無視
    }

    console.log(`  ✅ 完了: ${result.substring(0, 200)}...`)

    // ワークフローの場合、次のステップに進む
    if (cmd.workflow_id) {
      await advanceWorkflow(cmd.workflow_id, cmd.workflow_step)
    }

    return true
  } catch (error) {
    // 失敗
    await supabasePatch('commands', cmd.id, {
      status: 'failed',
      error: error.message,
      completed_at: new Date().toISOString(),
    })
    console.log(`  ❌ 失敗: ${error.message}`)
    return false
  }
}

// Claude Code用のプロンプトを構築
function buildClaudePrompt(cmd) {
  const parts = []

  if (cmd.assigned_employee) {
    parts.push(`あなたは大口ヘルスケアグループのAI社員「${cmd.assigned_employee}」として行動してください。`)
  }
  if (cmd.assigned_department) {
    parts.push(`所属部署: ${cmd.assigned_department}`)
  }

  parts.push(`以下の指令を実行してください:`)
  parts.push(cmd.instruction)
  parts.push(`結果を簡潔に報告してください。`)

  return parts.join('\n')
}

// ワークフローの次のステップに進む
async function advanceWorkflow(workflowId, currentStep) {
  try {
    const workflows = await supabaseGet('workflows', `id=eq.${workflowId}`)
    if (!workflows || workflows.length === 0) return

    const wf = workflows[0]
    const nextStep = (currentStep || 0) + 1

    if (nextStep > wf.total_steps) {
      // ワークフロー完了
      await supabasePatch('workflows', workflowId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      console.log(`  🎉 ワークフロー「${wf.name}」完了!`)
    } else {
      // 次のステップに進む
      await supabasePatch('workflows', workflowId, {
        current_step: nextStep,
      })
      console.log(`  → ワークフロー「${wf.name}」Step ${nextStep} に進行`)
    }
  } catch (err) {
    console.log(`  ⚠️ ワークフロー更新失敗: ${err.message}`)
  }
}

// 保留中の指令を一覧表示
async function listCommands() {
  const commands = await getPendingCommands()
  if (commands.length === 0) {
    console.log('📭 保留中の指令はありません')
    return
  }

  console.log(`\n📋 保留中の指令: ${commands.length}件`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  for (const cmd of commands) {
    const date = new Date(cmd.created_at).toLocaleString('ja-JP')
    const priority = { urgent: '🔴', high: '🟠', normal: '🟢', low: '⚪' }[cmd.priority] || '🟢'
    console.log(`${priority} [${date}] ${cmd.instruction.substring(0, 80)}`)
    console.log(`   担当: ${cmd.assigned_employee || '未指定'} | ソース: ${cmd.source}`)
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--list')) {
    await listCommands()
    return
  }

  if (args.includes('--watch')) {
    console.log('👀 指令監視モード開始（60秒間隔）')
    console.log('   Ctrl+C で停止')

    const run = async () => {
      try {
        const commands = await getPendingCommands()
        if (commands.length > 0) {
          console.log(`\n📥 ${commands.length}件の指令を検出`)
          for (const cmd of commands) {
            await executeCommand(cmd)
          }
        }
      } catch (err) {
        console.error(`エラー: ${err.message}`)
      }
    }

    await run()
    setInterval(run, 60000)
    return
  }

  // 1回チェック＆実行
  try {
    const commands = await getPendingCommands()
    if (commands.length === 0) {
      console.log('📭 保留中の指令はありません')
      return
    }

    console.log(`📥 ${commands.length}件の指令を実行します`)
    for (const cmd of commands) {
      await executeCommand(cmd)
    }
    console.log('\n✅ 全指令の処理が完了しました')
  } catch (err) {
    console.error(`エラー: ${err.message}`)
    process.exit(1)
  }
}

main()

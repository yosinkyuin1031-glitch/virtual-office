#!/usr/bin/env node
/**
 * 指令実行ワーカー v2 — Supabaseの指令キューを監視し、Claude Codeで自動実行
 * macOS launchd で60秒ごとに自動起動される
 *
 * Usage:
 *   node scripts/command-worker.js          # 1回チェック＆実行
 *   node scripts/command-worker.js --watch  # 60秒ごとに監視（デーモンモード）
 *   node scripts/command-worker.js --list   # 保留中の指令を一覧表示
 */

const { execSync, exec } = require('child_process')
const path = require('path')

const SUPABASE_URL = 'https://vzkfkazjylrkspqrnhnx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'
const CLAUDE_PATH = '/usr/local/bin/claude'
const HOME = process.env.HOME || '/Users/ooguchiyouhei'
const PROJECT_ROOT = path.resolve(__dirname, '..')

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// ━━━━━━━━━━ Supabase helpers ━━━━━━━━━━

async function sbGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers })
  if (!res.ok) throw new Error(`GET ${table}: ${res.status}`)
  return res.json()
}

async function sbPatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`PATCH ${table}: ${res.status}`)
  return res.json()
}

async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`INSERT ${table}: ${res.status}`)
  return res.json()
}

// ━━━━━━━━━━ 活動ログ ━━━━━━━━━━

async function logActivity(employee, department, action, detail, commandId) {
  try {
    await sbInsert('activity_log', {
      employee_name: employee || 'システム',
      department: department || '全社',
      action,
      detail: (detail || '').substring(0, 500),
      command_id: commandId || null,
    })
  } catch {} // ログ失敗は無視
}

// ━━━━━━━━━━ 指令実行 ━━━━━━━━━━

async function getPendingCommands() {
  return sbGet('commands', 'status=eq.pending&order=priority.asc,created_at.asc&limit=3')
}

// AIっぽいマークダウン記号を除去
function cleanAIText(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildPrompt(cmd) {
  const lines = []
  if (cmd.assigned_employee) {
    lines.push(`あなたは大口ヘルスケアグループのAI社員「${cmd.assigned_employee}」（${cmd.assigned_department || ''}）として行動してください。`)
  }
  lines.push('')
  lines.push('以下の指令を実行し、結果を簡潔に報告してください。')
  lines.push('回答にはマークダウン記号（**、##、*、---、```など）を一切使わず、プレーンテキストで書いてください。')
  lines.push('')
  lines.push(cmd.instruction)
  return lines.join('\n')
}

async function executeCommand(cmd) {
  const ts = () => new Date().toLocaleString('ja-JP')
  console.log(`\n━━━ [${ts()}] 指令実行 ━━━`)
  console.log(`  ${cmd.priority === 'urgent' ? '🔴' : cmd.priority === 'high' ? '🟠' : '🟢'} ${cmd.instruction.substring(0, 100)}`)
  console.log(`  担当: ${cmd.assigned_employee || '自動'}`)

  // running に更新
  await sbPatch('commands', cmd.id, { status: 'running', started_at: new Date().toISOString() })
  await logActivity(cmd.assigned_employee, cmd.assigned_department, '指令受付', cmd.instruction.substring(0, 200), cmd.id)

  try {
    const prompt = buildPrompt(cmd)
    let result = ''

    // Claude Code で実行を試みる
    try {
      // プロンプトをtmpファイルに書き出してから実行（シェルエスケープ問題を回避）
      const tmpFile = `/tmp/cmd-${cmd.id.substring(0, 8)}.txt`
      require('fs').writeFileSync(tmpFile, prompt, 'utf-8')

      result = execSync(
        `cat "${tmpFile}" | ${CLAUDE_PATH} -p --output-format text`,
        {
          encoding: 'utf-8',
          timeout: 300000,
          cwd: HOME,
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin', HOME },
        }
      ).trim()

      // tmpファイル削除
      try { require('fs').unlinkSync(tmpFile) } catch {}

    } catch (execErr) {
      // Claude Code が実行できない場合、Anthropic APIで直接実行
      console.log(`  ⚠ Claude Code失敗、API直接実行にフォールバック`)
      result = await executeViaAPI(prompt)
    }

    // マークダウン記号を除去して完了
    result = cleanAIText(result)
    await sbPatch('commands', cmd.id, {
      status: 'completed',
      result: result.substring(0, 10000),
      completed_at: new Date().toISOString(),
    })

    await logActivity(cmd.assigned_employee, cmd.assigned_department, '指令完了', `${cmd.instruction.substring(0, 100)} → 完了`, cmd.id)
    console.log(`  ✅ 完了 (${result.length}文字)`)

    // ワークフロー連携
    if (cmd.workflow_id) {
      await advanceWorkflow(cmd.workflow_id, cmd.workflow_step)
    }

    return true
  } catch (error) {
    await sbPatch('commands', cmd.id, {
      status: 'failed',
      error: error.message,
      completed_at: new Date().toISOString(),
    })
    await logActivity(cmd.assigned_employee, cmd.assigned_department, '指令失敗', error.message, cmd.id)
    console.log(`  ❌ ${error.message}`)
    return false
  }
}

// Anthropic API で直接実行（Claude Code が使えない場合のフォールバック）
async function executeViaAPI(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return `[待機中] Claude Codeがオフラインのため、次回のターミナル起動時に実行されます。`
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error: ${res.status} ${err.substring(0, 200)}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || '応答なし'
}

// ワークフローの次ステップへ
async function advanceWorkflow(workflowId, currentStep) {
  try {
    const wfs = await sbGet('workflows', `id=eq.${workflowId}`)
    if (!wfs?.length) return
    const wf = wfs[0]
    const next = (currentStep || 0) + 1

    if (next > wf.total_steps) {
      await sbPatch('workflows', workflowId, { status: 'completed', completed_at: new Date().toISOString() })
      await logActivity('システム', '全社', 'ワークフロー完了', `「${wf.name}」が全${wf.total_steps}ステップ完了`)
      console.log(`  🎉 ワークフロー「${wf.name}」完了`)
    } else {
      await sbPatch('workflows', workflowId, { current_step: next })

      // 次ステップの指令を自動生成（contextからstepsとsubject等を取得）
      const ctx = wf.context || {}
      const steps = ctx.steps || []
      const nextStep = steps.find(s => s.order === next)
      if (nextStep) {
        const contextLines = []
        if (ctx.subject) contextLines.push(`対象: ${ctx.subject}`)
        if (ctx.detail) contextLines.push(`背景: ${ctx.detail}`)
        if (ctx.goal) contextLines.push(`ゴール: ${ctx.goal}`)
        const contextStr = contextLines.length > 0 ? `\n${contextLines.join('\n')}` : ''

        await sbInsert('commands', {
          instruction: `【${wf.name}】Step ${nextStep.order}: ${nextStep.action} — ${nextStep.description}${contextStr}`,
          status: 'pending',
          priority: 'high',
          assigned_department: nextStep.department,
          assigned_employee: nextStep.employee,
          workflow_id: workflowId,
          workflow_step: next,
          source: 'workflow',
        })
        console.log(`  → 次ステップ指令作成: Step ${next} (${nextStep.employee}: ${nextStep.action})`)
      }

      await logActivity('システム', '全社', 'ワークフロー進行', `「${wf.name}」Step ${next}/${wf.total_steps}`)
      console.log(`  → ワークフロー Step ${next}/${wf.total_steps}`)
    }
  } catch (err) {
    console.log(`  ⚠ ワークフロー更新失敗: ${err.message}`)
  }
}

// 古い完了済み指令を自動削除（7日以上前）
async function cleanupOldCommands() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/commands?status=eq.completed&completed_at=lt.${weekAgo}`,
      { method: 'DELETE', headers }
    )
    if (res.ok) {
      // 失敗した指令も30日後に削除
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      await fetch(
        `${SUPABASE_URL}/rest/v1/commands?status=eq.failed&completed_at=lt.${monthAgo}`,
        { method: 'DELETE', headers }
      )
    }
  } catch {} // クリーンアップ失敗は無視
}

// 古い活動ログも自動削除（30日以上前）
async function cleanupOldLogs() {
  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await fetch(
      `${SUPABASE_URL}/rest/v1/activity_log?created_at=lt.${monthAgo}`,
      { method: 'DELETE', headers }
    )
  } catch {}
}

// ━━━━━━━━━━ メイン ━━━━━━━━━━

async function listCommands() {
  const cmds = await getPendingCommands()
  if (!cmds.length) { console.log('📭 保留中の指令なし'); return }
  console.log(`\n📋 保留中: ${cmds.length}件`)
  for (const c of cmds) {
    const d = new Date(c.created_at).toLocaleString('ja-JP')
    const p = { urgent: '🔴', high: '🟠', normal: '🟢', low: '⚪' }[c.priority] || '🟢'
    console.log(`${p} [${d}] ${c.instruction.substring(0, 80)}`)
    console.log(`   担当: ${c.assigned_employee || '未指定'}`)
  }
}

async function runOnce() {
  const cmds = await getPendingCommands()
  if (!cmds.length) return 0

  console.log(`📥 ${cmds.length}件の指令を検出`)
  let done = 0
  for (const cmd of cmds) {
    if (await executeCommand(cmd)) done++
  }

  // 定期クリーンアップ
  await cleanupOldCommands()
  await cleanupOldLogs()

  return done
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--list')) {
    await listCommands()
    return
  }

  if (args.includes('--watch')) {
    console.log(`👀 監視モード開始 (60秒間隔) — ${new Date().toLocaleString('ja-JP')}`)
    const tick = async () => {
      try { await runOnce() } catch (e) { console.error(`[${new Date().toLocaleString('ja-JP')}] エラー: ${e.message}`) }
    }
    await tick()
    setInterval(tick, 60000)
    return
  }

  // 1回実行
  try {
    const count = await runOnce()
    if (count > 0) console.log(`\n✅ ${count}件の指令を処理しました`)
    else console.log('📭 保留中の指令なし')
  } catch (e) {
    console.error(`エラー: ${e.message}`)
    process.exit(1)
  }
}

main()

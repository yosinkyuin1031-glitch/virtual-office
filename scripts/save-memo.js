#!/usr/bin/env node
/**
 * 会長メモ保存スクリプト（Terminal → Supabase chairman_memos）
 *
 * Usage:
 *   node save-memo.js "メモ内容" [category] [source] [dept1,dept2]
 *
 * Categories: direction, insight, task, feedback, general (default: general)
 * Source: default 'terminal'
 * Department tags: カンマ区切り (例: "sales,development")
 */

const SUPABASE_URL = 'https://vzkfkazjylrkspqrnhnx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'

const VALID_CATEGORIES = ['direction', 'insight', 'task', 'feedback', 'general']

async function saveMemo() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
会長メモ保存スクリプト
━━━━━━━━━━━━━━━━━━━━
Usage: node save-memo.js "内容" [category] [source] [departments]

Categories: ${VALID_CATEGORIES.join(', ')}
Source:     terminal (default)
Depts:      カンマ区切り (例: "sales,development")

Examples:
  node save-memo.js "来月からBtoB営業を強化する" direction
  node save-memo.js "顧客管理の価格を見直す" insight terminal "sales,development"
  node save-memo.js "LP改善の方向性が決まった" direction terminal "marketing"
`)
    process.exit(0)
  }

  const content = args[0]
  const category = args[1] || 'general'
  const source = args[2] || 'terminal'
  const departmentTags = args[3] ? args[3].split(',').map(s => s.trim()).filter(Boolean) : []

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`エラー: カテゴリ "${category}" は無効です。有効値: ${VALID_CATEGORIES.join(', ')}`)
    process.exit(1)
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    console.error('エラー: メモ内容が空です')
    process.exit(1)
  }

  const body = {
    content: content.trim(),
    category,
    source,
    department_tags: departmentTags,
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/chairman_memos`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`保存失敗 (${response.status}): ${errorText}`)
      process.exit(1)
    }

    const data = await response.json()
    const memo = Array.isArray(data) ? data[0] : data

    console.log(`メモ保存完了`)
    console.log(`  ID: ${memo.id}`)
    console.log(`  カテゴリ: ${memo.category}`)
    console.log(`  ソース: ${memo.source}`)
    if (departmentTags.length > 0) {
      console.log(`  部署: ${departmentTags.join(', ')}`)
    }
    console.log(`  内容: ${memo.content.substring(0, 80)}${memo.content.length > 80 ? '...' : ''}`)
  } catch (err) {
    console.error(`エラー: ${err.message}`)
    process.exit(1)
  }
}

saveMemo()

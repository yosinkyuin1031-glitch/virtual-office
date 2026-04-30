// 一回限りのマイグレーション実行スクリプト
// 使い方: node scripts/run-migration.mjs supabase/migrations/<file>.sql
import fs from 'node:fs/promises'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <sql-file>')
  process.exit(1)
}

const url = process.env.SUPABASE_DB_URL ||
  'postgresql://postgres.vzkfkazjylrkspqrnhnx:fJZj8SDawfJze7H9@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'

const sql = await fs.readFile(file, 'utf8')
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

console.log(`[migrate] connecting...`)
await client.connect()
console.log(`[migrate] running: ${file} (${sql.length} chars)`)
try {
  await client.query(sql)
  console.log('[migrate] ✓ success')
} catch (e) {
  console.error('[migrate] ✗ error:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}

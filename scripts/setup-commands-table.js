#!/usr/bin/env node
/**
 * Supabase に commands テーブルと workflows テーブルを作成
 * Usage: node scripts/setup-commands-table.js
 */

const SUPABASE_URL = 'https://vzkfkazjylrkspqrnhnx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'

async function setupTables() {
  // commands テーブル（指令キュー）
  const createCommandsSQL = `
    CREATE TABLE IF NOT EXISTS commands (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      instruction TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
      assigned_department TEXT,
      assigned_employee TEXT,
      workflow_id UUID,
      workflow_step INTEGER,
      result TEXT,
      error TEXT,
      source TEXT DEFAULT 'web' CHECK (source IN ('web', 'line', 'terminal', 'cron', 'workflow')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );

    ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "commands_public_read" ON commands FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "commands_public_insert" ON commands FOR INSERT WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "commands_public_update" ON commands FOR UPDATE USING (true);
    CREATE POLICY IF NOT EXISTS "commands_public_delete" ON commands FOR DELETE USING (true);
  `

  // workflows テーブル（ワークフロー実行ログ）
  const createWorkflowsSQL = `
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      template_id TEXT NOT NULL,
      status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER NOT NULL,
      context JSONB DEFAULT '{}',
      result TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "workflows_public_read" ON workflows FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "workflows_public_insert" ON workflows FOR INSERT WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "workflows_public_update" ON workflows FOR UPDATE USING (true);
    CREATE POLICY IF NOT EXISTS "workflows_public_delete" ON workflows FOR DELETE USING (true);
  `

  // activity_log テーブル（社員活動ログ）
  const createActivitySQL = `
    CREATE TABLE IF NOT EXISTS activity_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_name TEXT NOT NULL,
      department TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      command_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "activity_public_read" ON activity_log FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "activity_public_insert" ON activity_log FOR INSERT WITH CHECK (true);
  `

  for (const [name, sql] of [['commands', createCommandsSQL], ['workflows', createWorkflowsSQL], ['activity_log', createActivitySQL]]) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })

      if (res.ok) {
        console.log(`✅ ${name} テーブル作成完了`)
      } else {
        // RPC不可の場合はREST APIでテーブル存在確認
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/${name}?limit=0`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })
        if (checkRes.ok) {
          console.log(`✅ ${name} テーブルは既に存在します`)
        } else {
          console.log(`⚠️ ${name} テーブルの作成にはSupabaseダッシュボードでSQLを実行してください：`)
          console.log(sql)
        }
      }
    } catch (err) {
      console.error(`❌ ${name}: ${err.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('テーブルが存在しない場合は、Supabaseダッシュボードの')
  console.log('SQL Editor で上記のSQLを実行してください。')
  console.log('URL: https://supabase.com/dashboard/project/vzkfkazjylrkspqrnhnx/sql')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

setupTables()

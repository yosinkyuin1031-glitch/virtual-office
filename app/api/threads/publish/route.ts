import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Threads自動投稿（毎時実行）
// MacBookのlaunchdから移行：24時間動くVercel cronで毎時1回、3アカウント分を処理
// LINE通知は廃止（陽平さんの認知負荷削減）

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const runtime = 'nodejs'
export const maxDuration = 60

interface AccountConfig {
  id: 'seitai' | 'houmon' | 'btob'
  token: string
  userId: string
}

function getAccounts(): AccountConfig[] {
  const accounts: AccountConfig[] = []
  if (process.env.THREADS_ACCESS_TOKEN_SEITAI && process.env.THREADS_USER_ID_SEITAI) {
    accounts.push({
      id: 'seitai',
      token: process.env.THREADS_ACCESS_TOKEN_SEITAI,
      userId: process.env.THREADS_USER_ID_SEITAI,
    })
  }
  if (process.env.THREADS_ACCESS_TOKEN_HOUMON && process.env.THREADS_USER_ID_HOUMON) {
    accounts.push({
      id: 'houmon',
      token: process.env.THREADS_ACCESS_TOKEN_HOUMON,
      userId: process.env.THREADS_USER_ID_HOUMON,
    })
  }
  if (process.env.THREADS_ACCESS_TOKEN_BTOB && process.env.THREADS_USER_ID_BTOB) {
    accounts.push({
      id: 'btob',
      token: process.env.THREADS_ACCESS_TOKEN_BTOB,
      userId: process.env.THREADS_USER_ID_BTOB,
    })
  }
  return accounts
}

// 現在のJST日付
function todayJST(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

// 現在のJST時刻（0-23）
function currentHourJST(): number {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.getUTCHours()
}

// Threads API: 投稿実行
async function postToThreads(token: string, userId: string, text: string): Promise<string> {
  // Step 1: メディアコンテナ作成
  const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'TEXT',
      text,
      access_token: token,
    }),
  })
  const createData = await createRes.json()
  if (createData.error) {
    throw new Error(`Container error: ${JSON.stringify(createData.error)}`)
  }

  // Step 2: 3秒待ってから公開
  await new Promise((r) => setTimeout(r, 3000))

  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: token,
    }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) {
    throw new Error(`Publish error: ${JSON.stringify(publishData.error)}`)
  }
  return publishData.id
}

// 1アカウント分の処理
async function processAccount(account: AccountConfig, date: string, hour: number) {
  const { data: rows, error } = await supabase
    .from('threads_scheduled_posts')
    .select('*')
    .eq('account', account.id)
    .eq('date', date)
    .eq('hour', hour)
    .limit(1)

  if (error) throw error
  if (!rows || rows.length === 0) {
    return { account: account.id, status: 'no_post', date, hour }
  }

  const post = rows[0]

  if (post.status === 'posted') {
    return { account: account.id, status: 'already_posted', id: post.id }
  }
  if (post.status !== 'approved') {
    return { account: account.id, status: 'not_approved', id: post.id, current_status: post.status }
  }

  // 投稿実行
  try {
    const threadId = await postToThreads(account.token, account.userId, post.text)

    await supabase
      .from('threads_scheduled_posts')
      .update({
        status: 'posted',
        thread_id: threadId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    return {
      account: account.id,
      status: 'posted',
      id: post.id,
      thread_id: threadId,
      hour,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { account: account.id, status: 'error', id: post.id, error: msg }
  }
}

// GET /api/threads/publish
// Vercel cron が毎時呼ぶ。CRON_SECRET で認証
export async function GET(req: NextRequest) {
  // 認証
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // 手動でcurlした時など、queryで?secret=xxx でも許可（陽平さん用の手動リカバリ）
    const querySecret = req.nextUrl.searchParams.get('secret')
    if (cronSecret && querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const accounts = getAccounts()
  if (accounts.length === 0) {
    return NextResponse.json({ error: 'No Threads accounts configured (env vars missing)' }, { status: 500 })
  }

  const date = todayJST()
  const hour = currentHourJST()

  const results = []
  for (const account of accounts) {
    const result = await processAccount(account, date, hour)
    results.push(result)
  }

  return NextResponse.json({
    success: true,
    date,
    hour,
    posted: results.filter((r) => r.status === 'posted').length,
    skipped: results.filter((r) => r.status === 'no_post' || r.status === 'already_posted' || r.status === 'not_approved').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  })
}

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// Vercel Cron 用：GETで毎日叩かれる
export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const isCron = req.headers.get('user-agent')?.includes('vercel-cron')
  if (process.env.CRON_SECRET && !isCron) {
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${baseUrl}/api/gbp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Cron-Secret': process.env.CRON_SECRET || '' },
    body: JSON.stringify({ action: 'cron' }),
  })
  const json = await res.json()
  return NextResponse.json(json)
}

export async function POST(req: NextRequest) {
  return GET(req)
}

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const HEALING_DIR = '/Users/ooguchiyouhei/youtube-healing-music'

export async function POST(request: NextRequest) {
  // CRON_SECRET による認証
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // ライブ配信を再起動
    const { stdout, stderr } = await execAsync(
      `cd ${HEALING_DIR} && python3 live_stream.py --start`,
      {
        timeout: 30000, // 30秒タイムアウト
        env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'ライブ配信の再起動コマンドを実行しました',
      stdout: stdout.slice(0, 2000), // 出力が長すぎる場合に備えて切り詰め
      stderr: stderr.slice(0, 2000),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    const execError = error as { stdout?: string; stderr?: string }

    return NextResponse.json(
      {
        success: false,
        error: 'ライブ配信の再起動に失敗しました',
        details: errMessage,
        stdout: execError.stdout?.slice(0, 2000) || null,
        stderr: execError.stderr?.slice(0, 2000) || null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

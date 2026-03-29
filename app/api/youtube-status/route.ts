import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// チャンネル定義
const CHANNELS = [
  {
    name: '月光ヒーリング',
    logPath: '/Users/ooguchiyouhei/youtube-healing-music/cron.log',
    cronSchedule: '本編18:00 / Shorts 9:00,14:00,20:00',
  },
  {
    name: 'Lo-Fi Cafe BGM',
    logPath: '/Users/ooguchiyouhei/youtube-lofi-bgm/cron.log',
    cronSchedule: '本編18:00 / Shorts 12:00,18:00,21:00',
  },
  {
    name: 'Nature Sound ASMR',
    logPath: '/Users/ooguchiyouhei/youtube-nature-asmr/cron.log',
    cronSchedule: '本編17:00 / Shorts 10:00,15:00,19:00',
  },
  {
    name: 'ゆるり瞑想',
    logPath: '/Users/ooguchiyouhei/youtube-meditation/cron.log',
    cronSchedule: '本編20:00 / Shorts 8:00,16:00,22:00',
  },
] as const

const LIVE_PID_PATH = '/Users/ooguchiyouhei/youtube-healing-music/output/live/stream.pid'

// cron.logの末尾から最新の実行ブロックをパースする
function parseLatestRun(logContent: string): {
  lastUpload: string | null
  lastStatus: 'success' | 'failed' | 'unknown'
  lastVideoId: string | null
  lastTitle: string | null
} {
  // 末尾から読むために行を逆順で処理
  const lines = logContent.split('\n')

  let lastUpload: string | null = null
  let lastStatus: 'unknown' | 'success' | 'failed' = 'unknown'
  let lastVideoId: string | null = null
  let lastTitle: string | null = null

  // 最後の「実行日時」ブロックを見つけるため、末尾から検索
  // 最新の実行ブロック内の情報を収集
  let foundBlock = false

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]

    // アップロード完了を見つけたら成功
    if (!foundBlock && line.includes('アップロード完了!')) {
      lastStatus = 'success'
      foundBlock = true
    }

    // 失敗マーカー
    if (!foundBlock && line.includes('\u274C')) {
      // ❌
      lastStatus = 'failed'
      foundBlock = true
    }

    // 動画IDを取得
    if (foundBlock && !lastVideoId) {
      const videoIdMatch = line.match(/動画ID:\s*(.+)/)
      if (videoIdMatch) {
        lastVideoId = videoIdMatch[1].trim()
      }
    }

    // タイトルを取得
    if (foundBlock && !lastTitle) {
      const titleMatch = line.match(/タイトル:\s*(.+)/)
      if (titleMatch) {
        lastTitle = titleMatch[1].trim()
      }
    }

    // 実行日時を取得（この実行ブロックの開始点）
    if (foundBlock && !lastUpload) {
      const dateMatch = line.match(/実行日時:\s*(.+)/)
      if (dateMatch) {
        lastUpload = parseDateString(dateMatch[1].trim())
        break // 最新ブロックの情報が揃った
      }
    }

    // 実行日時まで遡ってもブロックが始まらなかった場合を考慮し、
    // 200行以上遡ったら打ち切り
    if (foundBlock && lines.length - 1 - i > 200) break
  }

  // ブロックが見つからなかった場合、最後の実行日時だけでも取得
  if (!foundBlock) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const dateMatch = lines[i].match(/実行日時:\s*(.+)/)
      if (dateMatch) {
        lastUpload = parseDateString(dateMatch[1].trim())
        // この実行ブロック内にエラーがないかチェック
        for (let j = i; j < Math.min(i + 100, lines.length); j++) {
          if (lines[j].includes('\u274C') || lines[j].includes('Error') || lines[j].includes('Traceback')) {
            lastStatus = 'failed'
            break
          }
          if (lines[j].includes('アップロード完了!')) {
            lastStatus = 'success'
            break
          }
        }
        break
      }
    }
  }

  return { lastUpload, lastStatus, lastVideoId, lastTitle }
}

// 日本語日時文字列をISO形式に変換
// 例: "2026年03月28日 20:00" -> "2026-03-28T20:00:00"
function parseDateString(dateStr: string): string | null {
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}):(\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`
  }
  return dateStr
}

// PIDが生きているかチェック
async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    // kill -0 はプロセスの存在確認（シグナルは送らない）
    await execAsync(`kill -0 ${pid}`)
    return true
  } catch {
    return false
  }
}

// ファイルの末尾を読む（大きなログファイル対応）
async function readTail(filePath: string, bytes: number = 10000): Promise<string> {
  try {
    const stat = await fs.stat(filePath)
    const fileSize = stat.size
    const readSize = Math.min(bytes, fileSize)
    const fd = await fs.open(filePath, 'r')
    const buffer = Buffer.alloc(readSize)
    await fd.read(buffer, 0, readSize, fileSize - readSize)
    await fd.close()
    return buffer.toString('utf-8')
  } catch {
    return ''
  }
}

export async function GET() {
  try {
    // 各チャンネルのステータスを並列で取得
    const channelResults = await Promise.all(
      CHANNELS.map(async (channel) => {
        try {
          const logContent = await readTail(channel.logPath)
          if (!logContent) {
            return {
              name: channel.name,
              lastUpload: null,
              lastStatus: 'unknown' as const,
              lastVideoId: null,
              lastTitle: null,
              cronSchedule: channel.cronSchedule,
            }
          }
          const parsed = parseLatestRun(logContent)
          return {
            name: channel.name,
            lastUpload: parsed.lastUpload,
            lastStatus: parsed.lastStatus,
            lastVideoId: parsed.lastVideoId,
            lastTitle: parsed.lastTitle,
            cronSchedule: channel.cronSchedule,
          }
        } catch {
          return {
            name: channel.name,
            lastUpload: null,
            lastStatus: 'unknown' as const,
            lastVideoId: null,
            lastTitle: null,
            cronSchedule: channel.cronSchedule,
          }
        }
      })
    )

    // ライブ配信の状態を確認
    let liveStream: { running: boolean; pid: number | null; channel: string } = {
      running: false,
      pid: null,
      channel: '月光ヒーリング',
    }

    try {
      const pidContent = await fs.readFile(LIVE_PID_PATH, 'utf-8')
      const pid = parseInt(pidContent.trim(), 10)
      if (!isNaN(pid)) {
        const running = await isProcessRunning(pid)
        liveStream = { running, pid, channel: '月光ヒーリング' }
      }
    } catch {
      // PIDファイルが存在しない場合はデフォルト値のまま
    }

    return NextResponse.json({
      channels: channelResults,
      liveStream,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get YouTube status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// LINE Push通知ユーティリティ
// チャネル制御：陽平さんの集中を守るため、morning だけ常時許可、それ以外は通常OFF
// 必要な時は環境変数 LINE_ALLOWED_CHANNELS=morning,evening のように許可リストで開けられる

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast'

export type LineChannel =
  | 'morning'         // 朝7時の意思決定リスト（必須・常時ON）
  | 'evening'         // 夜の決定済み確認
  | 'task-engine'     // タスク自動完了報告
  | 'kpi-sync'        // KPI同期報告
  | 'handoff'         // 部署引き継ぎ
  | 'ceo-brain'       // CEOブレイン
  | 'weekly'          // 週次レポート
  | 'night-review'    // 夜のレビュー
  | 'utage'           // UTAGEウェブフック
  | 'auto-tasks'      // 自動タスク生成
  | 'automation'      // 汎用自動化
  | 'urgent'          // 緊急（常に許可）

// デフォルトで通知を送るチャネル
const DEFAULT_ALLOWED: LineChannel[] = ['morning', 'urgent']

function isChannelAllowed(channel: LineChannel): boolean {
  // 環境変数で上書き可能
  const envAllowed = process.env.LINE_ALLOWED_CHANNELS
  if (envAllowed) {
    const list = envAllowed.split(',').map((s) => s.trim()) as LineChannel[]
    return list.includes(channel)
  }
  return DEFAULT_ALLOWED.includes(channel)
}

export async function sendLINEBroadcast(
  message: string,
  channel: LineChannel = 'morning',
): Promise<boolean> {
  if (!isChannelAllowed(channel)) {
    console.log(`[LINE] suppressed channel=${channel} (not in allowed list)`)
    return false
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN が未設定です')
    return false
  }

  const truncated = message.length > 4900 ? message.substring(0, 4900) + '\n...(省略)' : message

  try {
    const res = await fetch(LINE_BROADCAST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [{ type: 'text', text: truncated }],
      }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error('LINE送信エラー:', res.status, errorText)
    }
    return res.ok
  } catch (error) {
    console.error('LINE送信エラー:', error)
    return false
  }
}

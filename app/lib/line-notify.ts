// LINE Push通知ユーティリティ
// task-bot-cloudと同じLINEチャンネルを使用してbroadcast送信

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast'

export async function sendLINEBroadcast(message: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN が未設定です')
    return false
  }

  // LINEメッセージは5000文字制限
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

'use client'

import { useState } from 'react'

export default function PlaudPage() {
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!transcript.trim()) {
      showToast('文字起こしテキストを入力してください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/plaud-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          title: title.trim() || undefined,
          summary: undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `保存に失敗しました (${res.status})`)
      }

      setTitle('')
      setTranscript('')
      showToast('保存しました')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">
            P
          </div>
          <h1 className="text-lg font-bold tracking-tight">Plaud 文字起こし投稿</h1>
        </div>
      </header>

      {/* メインフォーム */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1.5">
              タイトル（任意）
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 4/14 患者さんとの会話"
              className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* 文字起こしテキスト */}
          <div>
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-400 mb-1.5">
              文字起こしテキスト
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Plaudアプリからコピーした文字起こしをここに貼り付け..."
              rows={12}
              className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y leading-relaxed"
            />
            {transcript.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-500">{transcript.length.toLocaleString()} 文字</p>
            )}
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving || !transcript.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition active:scale-[0.98] disabled:active:scale-100"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </main>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-sm font-medium animate-[fadeInUp_0.3s_ease-out]">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  )
}

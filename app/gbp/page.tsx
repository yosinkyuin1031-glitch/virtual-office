'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  scheduled_date: string
  post_text: string
  keyword: string | null
  video_url: string | null
  video_title: string | null
  status: 'pending' | 'approved' | 'posted' | 'skipped'
  posted_at: string | null
}

interface Video {
  id: string
  title: string
  url: string
  active: boolean
  sort_order: number
}

const STATUS_LABEL: Record<Post['status'], { label: string; color: string }> = {
  pending: { label: '下書き', color: 'bg-yellow-500/20 text-yellow-300' },
  approved: { label: '承認済', color: 'bg-blue-500/20 text-blue-300' },
  posted: { label: '投稿済', color: 'bg-green-500/20 text-green-300' },
  skipped: { label: 'スキップ', color: 'bg-gray-500/20 text-gray-400' },
}

export default function GbpPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [today, setToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [showVideos, setShowVideos] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/gbp?limit=30')
    const d = await r.json()
    setPosts(d.posts || [])
    setVideos(d.videos || [])
    setToday(d.today || '')
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const todayPost = posts.find((p) => p.scheduled_date === today)
  const pastPosts = posts.filter((p) => p.scheduled_date !== today)

  const generate = async (force = false) => {
    setBusy('gen')
    try {
      const r = await fetch('/api/gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', force }),
      })
      const d = await r.json()
      if (!d.ok) alert('生成失敗: ' + (d.reason || ''))
      await load()
    } finally {
      setBusy(null)
    }
  }

  const copy = async (id: string, text: string, videoUrl: string | null) => {
    const full = videoUrl ? `${text}` : text
    await navigator.clipboard.writeText(full)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const startEdit = (p: Post) => {
    setEditingId(p.id)
    setEditText(p.post_text)
  }
  const saveEdit = async (id: string, status?: Post['status']) => {
    setBusy(id)
    try {
      const body: Record<string, unknown> = { post_text: editText }
      if (status) body.status = status
      await fetch(`/api/gbp?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setEditingId(null)
      setEditText('')
      await load()
    } finally {
      setBusy(null)
    }
  }
  const updateStatus = async (id: string, status: Post['status']) => {
    setBusy(id)
    try {
      await fetch(`/api/gbp?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const addVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return
    setBusy('addvid')
    try {
      await fetch('/api/gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_video', title: newVideoTitle.trim(), url: newVideoUrl.trim() }),
      })
      setNewVideoTitle('')
      setNewVideoUrl('')
      await load()
    } finally {
      setBusy(null)
    }
  }
  const toggleVideo = async (id: string, active: boolean) => {
    await fetch(`/api/gbp?id=${id}&target=video`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    await load()
  }
  const deleteVideo = async (id: string) => {
    if (!confirm('動画を削除しますか？')) return
    await fetch(`/api/gbp?id=${id}&target=video`, { method: 'DELETE' })
    await load()
  }

  const renderPostCard = (p: Post, isToday: boolean) => {
    const stCfg = STATUS_LABEL[p.status]
    return (
      <div key={p.id} className={`bg-gray-900 border ${isToday ? 'border-amber-500/50' : 'border-gray-800'} rounded-lg p-4`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-sm font-medium">
              {p.scheduled_date} {isToday && <span className="text-amber-400 text-xs ml-1">（今日）</span>}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {p.keyword && <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded mr-2">{p.keyword}</span>}
              {p.video_title && <span className="text-gray-500">🎬 {p.video_title}</span>}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${stCfg.color}`}>{stCfg.label}</span>
        </div>

        {editingId === p.id ? (
          <>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-40 bg-gray-950 border border-gray-700 rounded p-2 text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => saveEdit(p.id, 'approved')}
                disabled={busy === p.id}
                className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              >
                保存して承認
              </button>
              <button
                onClick={() => saveEdit(p.id)}
                disabled={busy === p.id}
                className="px-3 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                下書き保存
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setEditText('')
                }}
                className="px-3 py-1 rounded text-sm bg-gray-800 hover:bg-gray-700"
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.post_text}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => copy(p.id, p.post_text, p.video_url)}
                className="px-3 py-1 rounded text-sm bg-green-700 hover:bg-green-600"
              >
                {copiedId === p.id ? 'コピー完了' : 'コピー'}
              </button>
              <button
                onClick={() => startEdit(p)}
                className="px-3 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600"
              >
                編集
              </button>
              {p.status !== 'approved' && p.status !== 'posted' && (
                <button
                  onClick={() => updateStatus(p.id, 'approved')}
                  disabled={busy === p.id}
                  className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                >
                  承認
                </button>
              )}
              {p.status !== 'posted' && (
                <button
                  onClick={() => updateStatus(p.id, 'posted')}
                  disabled={busy === p.id}
                  className="px-3 py-1 rounded text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50"
                >
                  投稿済にする
                </button>
              )}
              {isToday && (
                <button
                  onClick={() => generate(true)}
                  disabled={busy === 'gen'}
                  className="px-3 py-1 rounded text-sm bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
                >
                  {busy === 'gen' ? '再生成中…' : '再生成'}
                </button>
              )}
              <a
                href="https://business.google.com/posts"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 ml-auto"
              >
                GBPで投稿→
              </a>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
          <Link href="/?biz=seitai" className="hover:text-white">← 整体院タブへ戻る</Link>
          <span>/</span>
          <span>GBP毎日投稿</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">GBP毎日投稿</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowVideos(!showVideos)}
              className="text-sm px-3 py-1.5 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
            >
              🎬 動画プール（{videos.filter((v) => v.active).length}）
            </button>
            <Link href="/keywords" className="text-sm px-3 py-1.5 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700">
              ⚙ キーワード設定
            </Link>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-6">大口神経整体院 ／ キーワード×動画リンクをAIが毎日自動生成</p>

        {showVideos && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-3">🎬 動画プール</h2>
            <p className="text-xs text-gray-400 mb-3">毎日の投稿に挿入される動画リンクを管理。日付で自動ローテーションされます。</p>

            {videos.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">動画がまだ登録されていません</p>
            ) : (
              <div className="space-y-2 mb-4">
                {videos.map((v) => (
                  <div key={v.id} className={`flex items-center gap-2 p-2 rounded ${v.active ? 'bg-gray-950 border border-gray-800' : 'bg-gray-950 border border-gray-800 opacity-50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{v.title}</div>
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate inline-block max-w-full">
                        {v.url}
                      </a>
                    </div>
                    <button
                      onClick={() => toggleVideo(v.id, v.active)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
                    >
                      {v.active ? '無効化' : '有効化'}
                    </button>
                    <button
                      onClick={() => deleteVideo(v.id)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-red-700"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <input
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="動画タイトル（例：脊柱管狭窄症の解説）"
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              />
              <input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              />
            </div>
            <button
              onClick={addVideo}
              disabled={busy === 'addvid' || !newVideoTitle.trim() || !newVideoUrl.trim()}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm disabled:opacity-50"
            >
              動画を追加
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">📌 今日の投稿（{today}）</h2>
              {todayPost ? (
                renderPostCard(todayPost, true)
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-400 mb-3">今日の投稿はまだ生成されていません</p>
                  <button
                    onClick={() => generate(false)}
                    disabled={busy === 'gen'}
                    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                  >
                    {busy === 'gen' ? '生成中…' : '今日の投稿をAI生成'}
                  </button>
                </div>
              )}
            </section>

            {pastPosts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">📅 過去の投稿</h2>
                <div className="space-y-3">
                  {pastPosts.map((p) => renderPostCard(p, false))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

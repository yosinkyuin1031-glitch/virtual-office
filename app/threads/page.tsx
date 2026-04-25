'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Status = 'pending' | 'approved' | 'posted' | 'skipped'

type Account = 'seitai' | 'houmon'

interface ThreadPost {
  id: string
  date: string
  hour: number
  category: string
  keyword: string
  text: string
  status: Status
  account: Account
  thread_id: string | null
  views: number | null
  created_at: string
  updated_at: string
}

const ACCOUNT_CONFIG: Record<Account, { label: string; color: string }> = {
  seitai: { label: '整体院', color: 'bg-blue-600' },
  houmon: { label: '訪問鍼灸', color: 'bg-orange-600' },
}

const CATEGORY_MAP: Record<string, string> = {
  symptom: '症状解説',
  area: '地域×症状',
  mechanism: '原因・メカニズム',
  episode: '患者エピソード',
  thought: '院の想い',
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  pending: { label: '未承認', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  approved: { label: '承認済み', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  posted: { label: '投稿済み', bg: 'bg-green-500/20', text: 'text-green-400' },
  skipped: { label: 'スキップ', bg: 'bg-gray-500/20', text: 'text-gray-400' },
}

type FilterStatus = 'all' | Status
type RangeMode = 'day' | 'week'

function addDaysISO(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

export default function ThreadsPage() {
  const [posts, setPosts] = useState<ThreadPost[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [rangeMode, setRangeMode] = useState<RangeMode>('day')
  const [account, setAccount] = useState<Account>('seitai')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  // アカウント変更時: 直近の投稿がある日付を自動検出
  useEffect(() => {
    async function findLatestDate() {
      const { data } = await supabase
        .from('threads_scheduled_posts')
        .select('date')
        .eq('account', account)
        .order('date', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        setDate(data[0].date)
      } else {
        setDate(new Date().toISOString().split('T')[0])
      }
    }
    findLatestDate()
  }, [account])

  const fetchPosts = useCallback(async () => {
    if (!date) return
    setLoading(true)
    let query = supabase
      .from('threads_scheduled_posts')
      .select('*')
      .eq('account', account)

    if (rangeMode === 'week') {
      const endDate = addDaysISO(date, 6)
      query = query.gte('date', date).lte('date', endDate)
    } else {
      query = query.eq('date', date)
    }
    const { data, error } = await query
      .order('date', { ascending: true })
      .order('hour', { ascending: true })

    if (!error && data) {
      setPosts(data as ThreadPost[])
    }
    setLoading(false)
  }, [date, account, rangeMode])

  useEffect(() => {
    if (date) fetchPosts()
  }, [date, account, rangeMode, fetchPosts])

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const counts = {
    pending: posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    posted: posts.filter(p => p.status === 'posted').length,
    skipped: posts.filter(p => p.status === 'skipped').length,
  }

  const handleSave = async (id: string) => {
    setSaving(id)
    const { error } = await supabase
      .from('threads_scheduled_posts')
      .update({ text: editText, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, text: editText, updated_at: new Date().toISOString() } : p))
      setEditingId(null)
    }
    setSaving(null)
  }

  const handleStatusUpdate = async (id: string, status: Status) => {
    setSaving(id)
    const { error } = await supabase
      .from('threads_scheduled_posts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p))
    }
    setSaving(null)
  }

  const handleApproveAll = async () => {
    const pendingIds = posts.filter(p => p.status === 'pending').map(p => p.id)
    if (pendingIds.length === 0) return

    setSaving('all')
    const { error } = await supabase
      .from('threads_scheduled_posts')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .in('id', pendingIds)

    if (!error) {
      setPosts(prev => prev.map(p => pendingIds.includes(p.id) ? { ...p, status: 'approved' as Status, updated_at: new Date().toISOString() } : p))
    }
    setSaving(null)
  }

  const startEdit = (post: ThreadPost) => {
    setEditingId(post.id)
    setEditText(post.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* 戻るリンク */}
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 text-sm mb-4 transition-colors">
          <span>&larr;</span> ダッシュボードに戻る
        </Link>

        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Threads投稿管理</h1>

          {/* アカウント切り替え */}
          <div className="flex gap-2 mb-4">
            {(Object.entries(ACCOUNT_CONFIG) as [Account, { label: string; color: string }][]).map(([key, conf]) => (
              <button
                key={key}
                onClick={() => setAccount(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  account === key
                    ? `${conf.color} text-white`
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {conf.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            {/* 日付ピッカー */}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />

            {/* 表示モード切替 */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {([
                { key: 'day' as RangeMode, label: '1日' },
                { key: 'week' as RangeMode, label: '7日' },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => setRangeMode(item.key)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    rangeMode === item.key
                      ? 'bg-white/15 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ステータスフィルター */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all' as FilterStatus, label: '全て' },
                { key: 'pending' as FilterStatus, label: '未承認' },
                { key: 'approved' as FilterStatus, label: '承認済み' },
                { key: 'posted' as FilterStatus, label: '投稿済み' },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 投稿一覧 */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {posts.length === 0 ? 'この期間の投稿データがありません' : 'フィルターに一致する投稿がありません'}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(
              filteredPosts.reduce<Record<string, ThreadPost[]>>((acc, p) => {
                (acc[p.date] = acc[p.date] || []).push(p)
                return acc
              }, {})
            ).map(([groupDate, groupPosts]) => (
              <div key={groupDate}>
                {rangeMode === 'week' && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-400 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur py-1 z-10">
                    <span className="text-white font-medium">{groupDate}</span>
                    <span className="text-gray-500">·</span>
                    <span>{groupPosts.length}件</span>
                  </div>
                )}
                <div className="space-y-3">
            {groupPosts.map(post => {
              const statusConf = STATUS_CONFIG[post.status]
              const isEditing = editingId === post.id
              const isPosted = post.status === 'posted'
              const isSaving = saving === post.id || saving === 'all'

              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                >
                  {/* 上段: 時刻 + ステータス */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-mono font-bold text-lg">
                      {post.hour}:00
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                      {statusConf.label}
                    </span>
                  </div>

                  {/* カテゴリ + キーワード */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                      {CATEGORY_MAP[post.category] || post.category}
                    </span>
                    <span className="text-gray-400 text-sm">{post.keyword}</span>
                  </div>

                  {/* 投稿テキスト or 編集エリア */}
                  {isEditing ? (
                    <div className="mb-3">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSave(post.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-sm transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3">
                      {post.text}
                    </div>
                  )}

                  {/* 投稿済み情報 */}
                  {isPosted && (
                    <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                      {post.views !== null && post.views > 0 && (
                        <span className="text-green-400 font-medium">{post.views.toLocaleString()} views</span>
                      )}
                      {post.thread_id && (
                        <span>ID: {post.thread_id}</span>
                      )}
                    </div>
                  )}

                  {/* アクションボタン */}
                  {!isPosted && !isEditing && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => startEdit(post)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/10"
                      >
                        編集
                      </button>
                      {post.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(post.id, 'approved')}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs transition-colors border border-blue-500/30 disabled:opacity-50"
                        >
                          承認
                        </button>
                      )}
                      {post.status !== 'skipped' && (
                        <button
                          onClick={() => handleStatusUpdate(post.id, 'skipped')}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 text-xs transition-colors border border-gray-500/30 disabled:opacity-50"
                        >
                          スキップ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        {posts.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-400">
                未承認: <span className="text-yellow-400 font-medium">{counts.pending}件</span>
                {' / '}
                承認済み: <span className="text-blue-400 font-medium">{counts.approved}件</span>
                {' / '}
                投稿済み: <span className="text-green-400 font-medium">{counts.posted}件</span>
                {counts.skipped > 0 && (
                  <>
                    {' / '}
                    スキップ: <span className="text-gray-500 font-medium">{counts.skipped}件</span>
                  </>
                )}
              </div>
              {counts.pending > 0 && (
                <button
                  onClick={handleApproveAll}
                  disabled={saving === 'all'}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving === 'all' ? '処理中...' : `全て承認 (${counts.pending}件)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

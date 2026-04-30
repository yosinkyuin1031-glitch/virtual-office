'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface PatientVoice {
  id: string
  source: 'monshin' | 'plaud' | 'review' | 'interview' | 'manual' | 'other'
  source_ref: string | null
  patient_name: string | null
  age_range: string | null
  gender: string | null
  raw_text: string
  normalized_quote: string | null
  symptom_tags: string[]
  emotion_tags: string[]
  scene_tags: string[]
  session_number: number | null
  repeat_status: 'new' | 'repeating' | 'churned' | 'completed' | 'unknown'
  business_unit: string
  captured_at: string | null
  created_at: string
  used_count: number
  last_used_at: string | null
}

interface VoicesResponse {
  voices: PatientVoice[]
  summary: {
    total: number
    bySource: Record<string, number>
    byRepeat: Record<string, number>
    byBusiness: Record<string, number>
    topSymptoms: Record<string, number>
    topEmotions: Record<string, number>
  }
}

const SOURCE_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  monshin: { label: '問診', emoji: '📋', color: '#10B981' },
  plaud: { label: 'Plaud音声', emoji: '🎙️', color: '#8B5CF6' },
  review: { label: '口コみ', emoji: '⭐', color: '#F59E0B' },
  interview: { label: 'インタビュー', emoji: '🎤', color: '#EC4899' },
  manual: { label: '手動入力', emoji: '✍️', color: '#6B7280' },
  other: { label: 'その他', emoji: '📝', color: '#6B7280' },
}

const REPEAT_LABEL: Record<string, { label: string; color: string }> = {
  new: { label: '新規', color: '#3B82F6' },
  repeating: { label: 'リピート', color: '#10B981' },
  churned: { label: '離脱', color: '#EF4444' },
  completed: { label: '完了', color: '#6366F1' },
  unknown: { label: '不明', color: '#9CA3AF' },
}

function VoiceCard({
  voice,
  onDelete,
}: {
  voice: PatientVoice
  onDelete: (id: string) => Promise<void>
}) {
  const [copied, setCopied] = useState(false)
  const [working, setWorking] = useState(false)
  const sc = SOURCE_LABEL[voice.source] ?? SOURCE_LABEL.other
  const rc = REPEAT_LABEL[voice.repeat_status] ?? REPEAT_LABEL.unknown

  const handleCopy = async () => {
    const text = voice.normalized_quote || voice.raw_text
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm('この発言を削除しますか？')) return
    setWorking(true)
    try {
      await onDelete(voice.id)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition">
      <div className="flex items-start gap-2 mb-2 flex-wrap">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: sc.color + '15', color: sc.color, border: `1px solid ${sc.color}30` }}
        >
          {sc.emoji} {sc.label}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: rc.color + '15', color: rc.color, border: `1px solid ${rc.color}30` }}
        >
          {rc.label}
        </span>
        {voice.business_unit !== '大口神経整体院' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            {voice.business_unit}
          </span>
        )}
        {voice.session_number && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
            {voice.session_number}回目
          </span>
        )}
        {voice.used_count > 0 && (
          <span className="text-[10px] text-gray-400 ml-auto">使用 {voice.used_count}回</span>
        )}
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-1">
        「{voice.normalized_quote || voice.raw_text}」
      </p>
      {voice.normalized_quote && voice.normalized_quote !== voice.raw_text && (
        <p className="text-[11px] text-gray-400 mb-2">原文：{voice.raw_text}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {voice.symptom_tags.map((t) => (
          <span key={`s-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            #{t}
          </span>
        ))}
        {voice.emotion_tags.map((t) => (
          <span key={`e-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200">
            ❤️{t}
          </span>
        ))}
        {voice.scene_tags.map((t) => (
          <span key={`sc-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            📍{t}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-2">
        <button
          onClick={handleCopy}
          className={`text-[10px] px-2 py-1 rounded border transition ${
            copied
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50'
          }`}
        >
          {copied ? 'コピー済' : '📋 コピー'}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleDelete}
          disabled={working}
          className="text-[10px] px-2 py-1 rounded border bg-gray-50 text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          削除
        </button>
      </div>
    </div>
  )
}

function AddVoiceForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [source, setSource] = useState('manual')
  const [symptoms, setSymptoms] = useState('')
  const [emotions, setEmotions] = useState('')
  const [scenes, setScenes] = useState('')
  const [repeatStatus, setRepeatStatus] = useState('unknown')
  const [business, setBusiness] = useState('大口神経整体院')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/voices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          raw_text: text,
          source,
          symptom_tags: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
          emotion_tags: emotions.split(',').map((s) => s.trim()).filter(Boolean),
          scene_tags: scenes.split(',').map((s) => s.trim()).filter(Boolean),
          repeat_status: repeatStatus,
          business_unit: business,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setText('')
      setSymptoms('')
      setEmotions('')
      setScenes('')
      setOpen(false)
      onAdded()
    } catch {
      alert('追加に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-3 rounded-xl transition"
      >
        ＋ 発言を追加する
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
      <div>
        <label className="text-xs font-bold text-gray-700">患者の発言（生の言葉で）</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
          placeholder="例：夜中に痺れで目が覚めるんです"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-700">ソース</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 rounded-lg"
          >
            {Object.entries(SOURCE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700">リピート状況</label>
          <select
            value={repeatStatus}
            onChange={(e) => setRepeatStatus(e.target.value)}
            className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 rounded-lg"
          >
            {Object.entries(REPEAT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">事業</label>
        <select
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 rounded-lg"
        >
          <option>大口神経整体院</option>
          <option>晴陽鍼灸院</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">症状タグ（カンマ区切り）</label>
        <input
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          placeholder="例：肩こり, 痺れ"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">感情タグ（カンマ区切り）</label>
        <input
          value={emotions}
          onChange={(e) => setEmotions(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          placeholder="例：不安, 絶望"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-700">シーンタグ（カンマ区切り）</label>
        <input
          value={scenes}
          onChange={(e) => setScenes(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          placeholder="例：夜中, 仕事中"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50"
        >
          {submitting ? '追加中...' : '追加'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 bg-gray-100 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-200"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

export default function VoicesPage() {
  const [data, setData] = useState<VoicesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [symptomFilter, setSymptomFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (symptomFilter !== 'all') params.set('symptom', symptomFilter)
      if (search) params.set('search', search)
      params.set('limit', '200')
      const res = await fetch(`/api/voices?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as VoicesResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, symptomFilter, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/voices?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('削除失敗')
      return
    }
    fetchData()
  }, [fetchData])

  const sourceOptions = useMemo(() => {
    const list = [{ key: 'all', label: 'すべて', emoji: '📊', count: data?.summary.total ?? 0 }]
    for (const [k, v] of Object.entries(SOURCE_LABEL)) {
      list.push({ key: k, label: v.label, emoji: v.emoji, count: data?.summary.bySource[k] ?? 0 })
    }
    return list
  }, [data])

  const topSymptoms = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.topSymptoms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
  }, [data])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">← ホームへ</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-2">
            🎙️ 患者の声DB
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            AI生成の素材になる「現場の言葉」。問診・Plaud・口コみ・インタビュー・手動入力をここに集約。
          </p>
        </div>

        {/* サマリー */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{data.summary.total}</div>
              <div className="text-[10px] text-gray-500">総発言数</div>
            </div>
            {Object.entries(SOURCE_LABEL).slice(0, 4).map(([k, v]) => (
              <div key={k} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-2xl font-bold" style={{ color: v.color }}>
                  {data.summary.bySource[k] ?? 0}
                </div>
                <div className="text-[10px] text-gray-500">{v.emoji} {v.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 追加フォーム */}
        <div className="mb-4">
          <AddVoiceForm onAdded={fetchData} />
        </div>

        {/* ソース選択 */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto">
          {sourceOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSourceFilter(opt.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                sourceFilter === opt.key
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.emoji} {opt.label}
              {opt.count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 rounded-full ${
                  sourceFilter === opt.key ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 症状タグ */}
        {topSymptoms.length > 0 && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto">
            <button
              onClick={() => setSymptomFilter('all')}
              className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${
                symptomFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
              }`}
            >
              全症状
            </button>
            {topSymptoms.map(([sym, count]) => (
              <button
                key={sym}
                onClick={() => setSymptomFilter(sym)}
                className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${
                  symptomFilter === sym
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
                }`}
              >
                #{sym}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* 検索 */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 発言を検索..."
          className="w-full mb-4 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
        />

        {/* 一覧 */}
        {loading && <div className="text-center text-sm text-gray-400 py-8">読み込み中...</div>}
        {error && <div className="text-center text-sm text-red-500 py-8">エラー: {error}</div>}
        {!loading && !error && data && data.voices.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-12">
            該当する発言はありません。「＋ 発言を追加する」から登録してください。
          </div>
        )}
        <div className="space-y-2">
          {data?.voices.map((v) => (
            <VoiceCard key={v.id} voice={v} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  )
}

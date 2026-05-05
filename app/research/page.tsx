'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Ad { title?: string; displayed_link?: string; link?: string; description?: string }
interface Organic { position?: number; title?: string; link?: string; snippet?: string; displayed_link?: string }
interface Related { question?: string }

interface Report {
  id: string
  query: string
  area: string | null
  ad_count: number
  summary: string
  created_at: string
  ads: Ad[] | null
  organic_top: Organic[] | null
  related_questions: Related[] | null
}

const PRESETS = [
  '脊柱管狭窄症 整体',
  '坐骨神経痛 整体',
  '変形性膝関節症 整体',
  '自律神経失調症 整体',
  '住吉区 整体',
  '長居 整体',
]

export default function ResearchPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('大阪市')
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/research?limit=30')
    const d = await r.json()
    setReports(d.reports || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const run = async (q: string) => {
    if (!q.trim()) return
    setRunning(true)
    try {
      const r = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), area: area.trim() }),
      })
      const d = await r.json()
      if (!r.ok) {
        alert('リサーチ失敗: ' + (d.error || ''))
      } else {
        setQuery('')
        await load()
        if (d.report?.id) setOpenId(d.report.id)
      }
    } finally {
      setRunning(false)
    }
  }

  const toggle = (id: string) => setOpenId(openId === id ? null : id)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">← ホーム</Link>
          <span>/</span>
          <span>広告リサーチ</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">広告・キーワードリサーチ</h1>
        <p className="text-gray-400 text-sm mb-6">SerpAPI で「症状×地域」の広告出稿状況・オーガニック上位・関連質問を取得</p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索キーワード（例：脊柱管狭窄症 整体）"
              className="md:col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            />
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="地域（例：大阪市）"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setQuery(p)}
                className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => run(query)}
            disabled={running || !query.trim()}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
          >
            {running ? 'リサーチ中…' : 'リサーチ実行'}
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-2">過去のリサーチ</h2>
        {loading ? (
          <p className="text-gray-400">読み込み中…</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-400">まだリサーチ履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg">
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-850"
                >
                  <div>
                    <div className="font-medium">{r.query} <span className="text-gray-500 text-sm">／ {r.area}</span></div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.created_at).toLocaleString('ja-JP')} ・ 広告{r.ad_count}件
                    </div>
                  </div>
                  <span className="text-gray-500">{openId === r.id ? '−' : '+'}</span>
                </button>
                {openId === r.id && (
                  <div className="p-4 border-t border-gray-800 space-y-4">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 p-3 rounded">{r.summary}</pre>

                    {r.ads && r.ads.length > 0 && (
                      <Section title={`広告（${r.ads.length}件）`}>
                        {r.ads.slice(0, 10).map((a, i) => (
                          <div key={i} className="text-sm py-2 border-b border-gray-800 last:border-0">
                            <div className="text-blue-400 font-medium">{a.title}</div>
                            <div className="text-xs text-green-400">{a.displayed_link}</div>
                            {a.description && <p className="text-gray-300 text-xs mt-1">{a.description}</p>}
                          </div>
                        ))}
                      </Section>
                    )}

                    {r.organic_top && r.organic_top.length > 0 && (
                      <Section title="オーガニックTOP10">
                        {r.organic_top.map((o, i) => (
                          <div key={i} className="text-sm py-2 border-b border-gray-800 last:border-0">
                            <div className="text-gray-400 text-xs">#{o.position}</div>
                            <a href={o.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                              {o.title}
                            </a>
                            <div className="text-xs text-green-400">{o.displayed_link}</div>
                            {o.snippet && <p className="text-gray-400 text-xs mt-1">{o.snippet}</p>}
                          </div>
                        ))}
                      </Section>
                    )}

                    {r.related_questions && r.related_questions.length > 0 && (
                      <Section title={`関連質問（${r.related_questions.length}件）`}>
                        <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                          {r.related_questions.slice(0, 10).map((q, i) => (
                            <li key={i}>{q.question}</li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 text-gray-300">{title}</h3>
      <div className="bg-gray-950 border border-gray-800 rounded p-3">{children}</div>
    </div>
  )
}

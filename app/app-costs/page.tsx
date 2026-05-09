'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface AppCost {
  id: string
  name: string
  url: string | null
  category: string
  status: string
  icon: string
  cost_id: string | null
  vercel_jpy: number
  supabase_jpy: number
  api_anthropic_jpy: number
  api_other_jpy: number
  domain_jpy: number
  other_jpy: number
  total_jpy: number
  notes: string
}

interface Totals {
  vercel: number
  supabase: number
  anthropic: number
  other_api: number
  domain: number
  other: number
  total: number
}

interface HistoryRow { month: string; total: number }

interface Resp {
  month: string
  apps: AppCost[]
  totals: Totals
  history: HistoryRow[]
}

const CATEGORY_LABEL: Record<string, string> = {
  'btob-saas': '🏪 BtoB SaaS',
  'clinic-app': '🏥 整体院アプリ',
  'houmon-app': '🏠 訪問鍼灸アプリ',
  'diagnostic': '🔬 診断ツール',
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AppCostsPage() {
  const [data, setData] = useState<Resp | null>(null)
  const [month, setMonth] = useState<string>(thisMonth())
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, AppCost>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/app-costs?month=${month}`)
    const d: Resp = await r.json()
    setData(d)
    // drafts初期化
    const init: Record<string, AppCost> = {}
    for (const a of d.apps) init[a.id] = { ...a }
    setDrafts(init)
    setLoading(false)
  }, [month])

  useEffect(() => { load() }, [load])

  const setCell = (id: string, key: keyof AppCost, value: number | string) => {
    setDrafts(prev => {
      const next = { ...prev }
      const a = { ...next[id], [key]: value }
      a.total_jpy = a.vercel_jpy + a.supabase_jpy + a.api_anthropic_jpy + a.api_other_jpy + a.domain_jpy + a.other_jpy
      next[id] = a
      return next
    })
  }

  const save = async (id: string) => {
    const a = drafts[id]
    setSavingId(id)
    try {
      await fetch('/api/app-costs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: a.id,
          app_name: a.name,
          month,
          vercel_jpy: a.vercel_jpy,
          supabase_jpy: a.supabase_jpy,
          api_anthropic_jpy: a.api_anthropic_jpy,
          api_other_jpy: a.api_other_jpy,
          domain_jpy: a.domain_jpy,
          other_jpy: a.other_jpy,
          notes: a.notes,
        }),
      })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const copyFromPrev = async () => {
    const prev = shiftMonth(month, -1)
    if (!confirm(`${prev} のデータを ${month} にコピーしますか？（既存があれば上書き）`)) return
    await fetch('/api/app-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'copy_from_prev', from_month: prev, to_month: month }),
    })
    await load()
  }

  const totalDraft = Object.values(drafts).reduce((s, a) => s + a.total_jpy, 0)

  // カテゴリ別グルーピング
  const groupedApps: Record<string, AppCost[]> = {}
  for (const a of Object.values(drafts).sort((a, b) => b.total_jpy - a.total_jpy)) {
    if (!groupedApps[a.category]) groupedApps[a.category] = []
    groupedApps[a.category].push(a)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">← ホーム</Link>
          <span>/</span>
          <span>アプリ月額コスト</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">📊 外部アプリ 月額コスト管理</h1>
        <p className="text-gray-500 text-sm mb-4">販売中・販売予定アプリのインフラ＋API費用を月別に管理</p>

        {/* 月切替 */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">←</button>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded text-sm border border-gray-300"
          />
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">→</button>
          <button onClick={() => setMonth(thisMonth())} className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">今月</button>
          <button onClick={copyFromPrev} className="px-3 py-1.5 rounded text-sm bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100">前月から複製</button>
        </div>

        {/* 合計 */}
        {data && (
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">{data.month} 合計</p>
            <p className="text-3xl font-bold text-blue-700">¥{totalDraft.toLocaleString('ja-JP')}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 text-xs">
              <Stat label="Vercel" val={data.totals.vercel} />
              <Stat label="Supabase" val={data.totals.supabase} />
              <Stat label="Anthropic" val={data.totals.anthropic} />
              <Stat label="他API" val={data.totals.other_api} />
              <Stat label="ドメイン" val={data.totals.domain} />
              <Stat label="その他" val={data.totals.other} />
            </div>
          </div>
        )}

        {/* 推移 */}
        {data && data.history.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-sm mb-2">過去6ヶ月の推移</h3>
            <div className="flex items-end gap-2 h-32">
              {data.history.map(h => {
                const max = Math.max(...data.history.map(x => x.total), 1)
                const heightPct = (h.total / max) * 100
                return (
                  <div key={h.month} className="flex-1 flex flex-col items-center justify-end">
                    <div className="text-[10px] text-gray-500 mb-1">¥{(h.total / 1000).toFixed(0)}k</div>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${heightPct}%`, minHeight: '4px' }} />
                    <div className="text-[10px] text-gray-400 mt-1">{h.month.slice(5)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">読み込み中…</p>
        ) : !data ? (
          <p className="text-red-600">読み込み失敗</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedApps).map(([cat, apps]) => (
              <div key={cat} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-sm">
                  {CATEGORY_LABEL[cat] || cat} <span className="text-gray-500 font-normal">({apps.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left p-2 sticky left-0 bg-gray-50 min-w-[160px]">アプリ</th>
                        <th className="text-right p-2">Vercel</th>
                        <th className="text-right p-2">Supabase</th>
                        <th className="text-right p-2">Anthropic</th>
                        <th className="text-right p-2">他API</th>
                        <th className="text-right p-2">ドメイン</th>
                        <th className="text-right p-2">その他</th>
                        <th className="text-right p-2 font-bold">合計</th>
                        <th className="text-left p-2 min-w-[140px]">メモ</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map(app => {
                        const changed = JSON.stringify(app) !== JSON.stringify(data.apps.find(a => a.id === app.id))
                        return (
                          <tr key={app.id} className="border-b border-gray-100 last:border-0">
                            <td className="p-2 sticky left-0 bg-white">
                              <div className="flex items-center gap-1">
                                <span>{app.icon}</span>
                                <div>
                                  <div className="font-medium text-sm">{app.name}</div>
                                  {app.url && <a href={app.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline truncate inline-block max-w-[120px]">{app.url.replace(/^https?:\/\//, '').slice(0, 25)}</a>}
                                </div>
                              </div>
                            </td>
                            <CostCell value={app.vercel_jpy} onChange={v => setCell(app.id, 'vercel_jpy', v)} />
                            <CostCell value={app.supabase_jpy} onChange={v => setCell(app.id, 'supabase_jpy', v)} />
                            <CostCell value={app.api_anthropic_jpy} onChange={v => setCell(app.id, 'api_anthropic_jpy', v)} />
                            <CostCell value={app.api_other_jpy} onChange={v => setCell(app.id, 'api_other_jpy', v)} />
                            <CostCell value={app.domain_jpy} onChange={v => setCell(app.id, 'domain_jpy', v)} />
                            <CostCell value={app.other_jpy} onChange={v => setCell(app.id, 'other_jpy', v)} />
                            <td className="p-2 text-right font-bold text-blue-700">¥{app.total_jpy.toLocaleString('ja-JP')}</td>
                            <td className="p-2">
                              <input
                                value={app.notes}
                                onChange={e => setCell(app.id, 'notes', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-200 rounded text-[11px]"
                                placeholder="メモ"
                              />
                            </td>
                            <td className="p-2">
                              {changed && (
                                <button
                                  onClick={() => save(app.id)}
                                  disabled={savingId === app.id}
                                  className="px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                                >
                                  {savingId === app.id ? '保存中' : '保存'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, val }: { label: string; val: number }) {
  return (
    <div className="bg-gray-50 rounded p-2">
      <div className="text-gray-500">{label}</div>
      <div className="font-bold">¥{val.toLocaleString('ja-JP')}</div>
    </div>
  )
}

function CostCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <td className="p-1">
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value || 0))}
        className="w-20 px-1 py-0.5 border border-gray-200 rounded text-right text-xs"
        placeholder="0"
      />
    </td>
  )
}

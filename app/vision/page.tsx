'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BUSINESS_VISIONS,
  BUSINESS_LINES,
  YEAR_TOTALS,
  VISION_2031,
  REQUIRED_MINDSET,
  SELF_ASSESSMENT_2026,
  MARKETING_PHILOSOPHY,
  TREATMENT_FRAMEWORK,
  type BusinessId,
  type BusinessLine,
} from '../lib/business-vision'

const YEAR_KEYS: Array<keyof Pick<BusinessLine, 'year1' | 'year2' | 'year3' | 'year4' | 'year5'>> = [
  'year1',
  'year2',
  'year3',
  'year4',
  'year5',
]

function formatNumber(n: number | null, unit: string): string {
  if (n === null) return '—'
  if (unit === '万円/年') return `${n.toLocaleString()}万`
  if (unit === '人') return `${n}人`
  return `${n}`
}

function LineRow({ line }: { line: BusinessLine }) {
  const isLaunched = (year: number) => !line.launchYear || line.launchYear <= year
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 px-2 text-xs text-gray-700 font-medium">
        {line.name}
        {line.launchYear && line.launchYear > 0 && (
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200">
            {line.launchYear}年目開始
          </span>
        )}
      </td>
      <td className="py-2 px-2 text-[10px] text-gray-400 text-right">{line.unit}</td>
      <td className="py-2 px-2 text-xs text-gray-500 text-right">
        {formatNumber(line.current, line.unit)}
      </td>
      {YEAR_KEYS.map((k, i) => {
        const v = line[k]
        const launched = isLaunched(i + 1)
        return (
          <td
            key={k}
            className={`py-2 px-2 text-xs text-right ${
              !launched ? 'text-gray-300' : v === null ? 'text-gray-300' : 'text-gray-800 font-medium'
            }`}
          >
            {launched ? formatNumber(v, line.unit) : '—'}
          </td>
        )
      })}
    </tr>
  )
}

export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<BusinessId | 'all' | 'philosophy' | 'mindset'>('all')

  // 事業別合計（年次）
  const businessYearTotals = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    for (const biz of BUSINESS_VISIONS) {
      result[biz.id] = {}
      const lines = BUSINESS_LINES.filter((l) => l.business === biz.id && l.unit === '万円/年')
      for (const k of YEAR_KEYS) {
        result[biz.id][k] = lines.reduce((sum, l) => sum + (l[k] ?? 0), 0)
      }
    }
    return result
  }, [])

  const filteredLines = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'philosophy' || activeTab === 'mindset') {
      return BUSINESS_LINES
    }
    return BUSINESS_LINES.filter((l) => l.business === activeTab)
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">← ホームへ</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-2">
            🎯 5年ビジョン × KPI
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            31歳〜35歳の事業計画。5事業＋新規ベンチャーラインで合計1.55億円を目指す
          </p>
        </div>

        {/* 年次合計サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {YEAR_TOTALS.map((y) => (
            <div
              key={y.year}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4"
            >
              <div className="text-[10px] text-amber-600 font-medium">{y.label} ({y.age}歳)</div>
              <div className="text-2xl font-bold text-amber-800 mt-1">
                {y.total.toLocaleString()}<span className="text-xs ml-0.5">万円</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                月平均 {Math.round(y.total / 12).toLocaleString()}万
              </div>
            </div>
          ))}
        </div>

        {/* タブ */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            📊 全体
          </button>
          {BUSINESS_VISIONS.map((biz) => (
            <button
              key={biz.id}
              onClick={() => setActiveTab(biz.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                activeTab === biz.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              style={
                activeTab === biz.id
                  ? { backgroundColor: biz.color }
                  : undefined
              }
            >
              {biz.emoji} {biz.name}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('philosophy')}
            className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
              activeTab === 'philosophy'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            🧭 哲学
          </button>
          <button
            onClick={() => setActiveTab('mindset')}
            className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${
              activeTab === 'mindset'
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            ✨ マインド・スキル
          </button>
        </div>

        {/* 全体タブ：事業別年次比較 */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-700">事業別 年次推移（万円/年）</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] text-gray-500">
                    <th className="text-left py-2 px-2 font-normal">事業</th>
                    {YEAR_TOTALS.map((y) => (
                      <th key={y.year} className="text-right py-2 px-2 font-normal">
                        {y.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BUSINESS_VISIONS.map((biz) => (
                    <tr key={biz.id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-xs">
                        <span style={{ color: biz.color }}>{biz.emoji}</span> {biz.name}
                      </td>
                      {YEAR_KEYS.map((k) => (
                        <td key={k} className="py-2 px-2 text-xs text-right text-gray-800">
                          {businessYearTotals[biz.id]?.[k]
                            ? `${businessYearTotals[biz.id][k].toLocaleString()}万`
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-amber-50 font-bold">
                    <td className="py-2 px-2 text-xs text-amber-800">合計</td>
                    {YEAR_TOTALS.map((y) => (
                      <td key={y.year} className="py-2 px-2 text-xs text-right text-amber-800">
                        {y.total.toLocaleString()}万
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 事業別詳細 */}
        {activeTab !== 'all' && activeTab !== 'philosophy' && activeTab !== 'mindset' && (
          <div className="space-y-4">
            {(() => {
              const biz = BUSINESS_VISIONS.find((b) => b.id === activeTab)
              if (!biz) return null
              return (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: biz.color + '40', backgroundColor: biz.color + '08' }}
                >
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: biz.color }}>
                    {biz.emoji} {biz.name}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">{biz.description}</p>
                </div>
              )
            })()}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] text-gray-500">
                      <th className="text-left py-2 px-2 font-normal">事業ライン</th>
                      <th className="text-right py-2 px-2 font-normal">単位</th>
                      <th className="text-right py-2 px-2 font-normal">現状</th>
                      {YEAR_TOTALS.map((y) => (
                        <th key={y.year} className="text-right py-2 px-2 font-normal">
                          {y.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLines.map((line) => (
                      <LineRow key={line.id} line={line} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* メモ */}
            <div className="space-y-1.5">
              {filteredLines
                .filter((l) => l.notes)
                .map((l) => (
                  <div key={l.id} className="text-[11px] text-gray-500 px-2">
                    <span className="font-medium text-gray-700">{l.name}：</span>
                    {l.notes}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 哲学タブ */}
        {activeTab === 'philosophy' && (
          <div className="space-y-4">
            {Object.entries(MARKETING_PHILOSOPHY).map(([key, ph]) => (
              <div key={key} className="bg-white rounded-xl border border-purple-200 p-4">
                <h3 className="text-sm font-bold text-purple-800 mb-2">🧭 {ph.title}</h3>
                <ul className="space-y-1">
                  {ph.points.map((p, i) => (
                    <li key={i} className="text-xs text-gray-700 leading-relaxed pl-3 border-l-2 border-purple-200">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="bg-white rounded-xl border border-cyan-200 p-4">
              <h3 className="text-sm font-bold text-cyan-800 mb-3">🏥 神経整体 3ステップ施術フレーム</h3>
              <div className="space-y-3">
                {TREATMENT_FRAMEWORK.steps.map((s) => (
                  <div key={s.step} className="border-l-4 border-cyan-300 pl-3">
                    <div className="text-xs font-bold text-cyan-900">
                      Step {s.step}. {s.name} <span className="font-normal text-gray-500">— {s.sub}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">{s.description}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">機能的価値（結果）</div>
                  <ul className="space-y-0.5">
                    {TREATMENT_FRAMEWORK.functionalValue.map((v, i) => (
                      <li key={i} className="text-[11px] text-gray-700">・{v}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">情緒的価値（感情）</div>
                  <ul className="space-y-0.5">
                    {TREATMENT_FRAMEWORK.emotionalValue.map((v, i) => (
                      <li key={i} className="text-[11px] text-gray-700">・{v}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* マインド・スキルタブ */}
        {activeTab === 'mindset' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-pink-200 p-4">
              <h3 className="text-sm font-bold text-pink-800 mb-3">✨ 5年後の理想状態</h3>
              <ul className="space-y-1">
                {VISION_2031.map((v, i) => (
                  <li key={i} className="text-xs text-gray-700 leading-relaxed">⚪︎ {v}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-pink-200 p-4">
              <h3 className="text-sm font-bold text-pink-800 mb-3">必要なマインド・スキル</h3>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_MINDSET.map((m, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">
                  📊 自己評価 ({SELF_ASSESSMENT_2026.date})
                </h3>
                <div className="text-xs text-gray-500">
                  合計 <span className="text-lg font-bold text-amber-700">{SELF_ASSESSMENT_2026.total}</span>
                  / {SELF_ASSESSMENT_2026.max}点
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mb-2">出典: {SELF_ASSESSMENT_2026.source}</div>
              <div className="space-y-1.5">
                {SELF_ASSESSMENT_2026.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-[11px] text-gray-700 flex-1">{item.name}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.score * 10}%`,
                          backgroundColor: item.score >= 7 ? '#10B981' : item.score >= 5 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                    <div className="text-xs font-bold text-gray-700 w-6 text-right">{item.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

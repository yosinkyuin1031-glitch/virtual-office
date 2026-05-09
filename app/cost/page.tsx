'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AnthropicLine {
  feature: string
  endpoint: string
  model: string
  monthly_calls: number
  monthly_cost_usd: number
  monthly_cost_jpy: number
}

interface ServiceLine {
  name: string
  detail: string
  cost_jpy: number
  note?: string
}

interface CostResponse {
  anthropic: { lines: AnthropicLine[]; totalUsd: number; totalJpy: number }
  services: ServiceLine[]
  totalJpy: number
  note: string
  generated_at: string
}

export default function CostPage() {
  const [data, setData] = useState<CostResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cost-report').then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">← ホーム</Link>
          <span>/</span>
          <span>API費用レポート</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">💰 API費用レポート</h1>
        <p className="text-gray-500 text-sm mb-6">月額の概算。実費はVercel/Anthropicの管理画面で確認</p>

        {loading ? (
          <p className="text-gray-500">読み込み中…</p>
        ) : !data ? (
          <p className="text-red-600">読み込み失敗</p>
        ) : (
          <>
            {/* 合計 */}
            <div className="bg-white border-2 border-blue-300 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-500 mb-1">月額合計（概算）</p>
              <p className="text-4xl font-bold text-blue-700">¥{data.totalJpy.toLocaleString('ja-JP')}</p>
              <p className="text-xs text-gray-400 mt-2">{data.note}</p>
            </div>

            {/* サービス別 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h2 className="font-bold mb-3">サービス別</h2>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2">サービス</th>
                    <th className="text-left py-2">内容</th>
                    <th className="text-right py-2">月額</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-gray-600 text-xs">
                        {s.detail}
                        {s.note && <div className="text-amber-700">{s.note}</div>}
                      </td>
                      <td className="py-2 text-right font-bold">¥{s.cost_jpy.toLocaleString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Anthropic 詳細 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-bold mb-3">Anthropic Claude 機能別</h2>
              <p className="text-xs text-gray-500 mb-3">月間想定回数 × 平均トークン × モデル単価で算出</p>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2">機能</th>
                    <th className="text-left py-2">モデル</th>
                    <th className="text-right py-2">回/月</th>
                    <th className="text-right py-2">USD</th>
                    <th className="text-right py-2">月額</th>
                  </tr>
                </thead>
                <tbody>
                  {data.anthropic.lines.sort((a, b) => b.monthly_cost_jpy - a.monthly_cost_jpy).map((l, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2">
                        <div className="font-medium">{l.feature}</div>
                        <div className="text-[10px] text-gray-400">{l.endpoint}</div>
                      </td>
                      <td className="py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${l.model.includes('Haiku') ? 'bg-green-100 text-green-700' : l.model.includes('Sonnet') ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {l.model}
                        </span>
                      </td>
                      <td className="py-2 text-right">{l.monthly_calls}</td>
                      <td className="py-2 text-right text-xs text-gray-500">${l.monthly_cost_usd.toFixed(2)}</td>
                      <td className="py-2 text-right font-medium">¥{l.monthly_cost_jpy.toLocaleString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="py-2 font-bold">小計</td>
                    <td className="py-2 text-right text-xs text-gray-500">${data.anthropic.totalUsd}</td>
                    <td className="py-2 text-right font-bold">¥{data.anthropic.totalJpy.toLocaleString('ja-JP')}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                💡 <strong>削減ルール</strong>：単純タスクは Haiku、複雑タスクのみ Sonnet。Opus は厳選用途のみ。
                新規API追加時も最安プランから始める。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { DEFAULT_RULES, type BusinessRule, type Channel } from '../lib/business-rules'

const CHANNEL_LABEL: Record<Channel, { label: string; emoji: string }> = {
  gbp: { label: 'GBP', emoji: '📍' },
  threads: { label: 'Threads', emoji: '🧵' },
  instagram: { label: 'Instagram', emoji: '📷' },
  facebook: { label: 'Facebook', emoji: '📘' },
  line: { label: 'LINE一斉', emoji: '💬' },
  youtube: { label: 'YouTube', emoji: '📺' },
  blog_seo: { label: 'SEOブログ', emoji: '✍️' },
  lp: { label: 'LP', emoji: '📄' },
  meo: { label: 'MEO', emoji: '🗺️' },
  mail: { label: 'メール', emoji: '✉️' },
  task_internal: { label: '社内タスク', emoji: '📋' },
}

function RuleCard({ rule }: { rule: BusinessRule }) {
  const channels = Object.entries(rule.channels) as [Channel, { weekly?: number; monthly?: number; note?: string }][]
  const totalChannels = channels.length
  const activeChannels = channels.filter(([, v]) => (v.weekly ?? 0) > 0 || (v.monthly ?? 0) > 0).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <span className="text-xl">{rule.emoji}</span>
        <h3 className="text-sm font-bold text-gray-800">{rule.label}</h3>
        <span className="ml-auto text-[10px] text-gray-500">
          稼働 {activeChannels}/{totalChannels}
        </span>
        {rule.autoExecuteTasks ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            AI自動実行 ON
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            判断待ち
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {channels.map(([key, val]) => {
          const cl = CHANNEL_LABEL[key]
          const cap =
            val.weekly !== undefined ? `週${val.weekly}本` :
            val.monthly !== undefined ? `月${val.monthly}本` :
            '未設定'
          const inactive = (val.weekly === 0 || val.monthly === 0)
          return (
            <div key={key} className="px-4 py-2 flex items-center gap-3">
              <div className="text-base">{cl?.emoji}</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-800">{cl?.label ?? key}</div>
                {val.note && <div className="text-[10px] text-gray-500 mt-0.5">{val.note}</div>}
              </div>
              <div className={`text-xs font-bold ${inactive ? 'text-gray-300 line-through' : 'text-amber-700'}`}>
                {cap}
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-500">
        受信箱の未対応上限：<span className="font-bold text-gray-700">{rule.inboxLimit}件</span>
      </div>
    </div>
  )
}

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">← ホームへ</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-2">
            📐 事業別ルール
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            AI社員が「いつ・どのチャネルに・何本まで」生成していいかの宣言。
            ここに無いものは作らない。陽平さんの作業負荷を守るための制約。
          </p>
        </div>

        {/* 全体方針 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-amber-800 mb-2">🛡️ 在庫を作らない原則</h3>
          <ul className="space-y-1 text-[11px] text-amber-900 leading-relaxed">
            <li>・宣言した枠の中でしかAIは生成しない</li>
            <li>・受信箱の未対応が上限を超えたら自動生成を停止</li>
            <li>・「AI自動実行 ON」の事業以外は、陽平さんが宣言してから生成する</li>
            <li>・LINE通知は morning と urgent のみ。それ以外は静かに</li>
          </ul>
        </div>

        {/* 事業別ルール */}
        <div className="space-y-3">
          {DEFAULT_RULES.map((rule) => (
            <RuleCard key={rule.business} rule={rule} />
          ))}
        </div>

        {/* 注記 */}
        <div className="mt-6 text-[10px] text-gray-400 leading-relaxed">
          このルールは <code className="px-1 rounded bg-gray-100">app/lib/business-rules.ts</code> に定義されています。
          編集UIは次フェーズで追加します。
        </div>
      </div>
    </div>
  )
}

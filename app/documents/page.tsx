'use client'

import { useState } from 'react'
import Link from 'next/link'
import { documents, type Document } from '../lib/documents'

function CategoryBadge({ category }: { category: Document['category'] }) {
  const config = {
    'btob': { label: 'BtoB戦略', color: '#22D3EE', bg: '#22D3EE15' },
    'marketing': { label: 'マーケティング', color: '#A78BFA', bg: '#A78BFA15' },
    'operations': { label: '業務', color: '#22C55E', bg: '#22C55E15' },
    'product': { label: 'プロダクト', color: '#F59E0B', bg: '#F59E0B15' },
    'other': { label: 'その他', color: '#6B7280', bg: '#6B728015' },
  }
  const c = config[category]
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.color + '44' }}
    >
      {c.label}
    </span>
  )
}

function DocumentCard({ doc, onClick }: { doc: Document; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:bg-gray-900/80 hover:border-gray-700 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <CategoryBadge category={doc.category} />
            {doc.status === 'draft' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
                ドラフト
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-200 mt-1">{doc.title}</h3>
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{doc.summary}</p>
          <p className="text-[10px] text-gray-600 mt-2">{doc.updatedAt}</p>
        </div>
        <span className="text-gray-600 text-lg flex-shrink-0">→</span>
      </div>
    </button>
  )
}

function DocumentViewer({ doc, onBack }: { doc: Document; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition"
      >
        ← 一覧に戻る
      </button>

      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge category={doc.category} />
          {doc.status === 'draft' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
              ドラフト
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-gray-200">{doc.title}</h2>
        <p className="text-[10px] text-gray-600 mt-1">最終更新: {doc.updatedAt}</p>
      </div>

      <div
        className="bg-gray-900/30 rounded-xl border border-gray-800 p-4 prose prose-invert prose-sm max-w-none
          prose-headings:text-cyan-300 prose-headings:border-b prose-headings:border-gray-800 prose-headings:pb-2
          prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
          prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
          prose-p:text-[13px] prose-p:text-gray-300 prose-p:leading-relaxed
          prose-li:text-[13px] prose-li:text-gray-300
          prose-strong:text-cyan-200
          prose-table:text-[12px]
          prose-th:text-cyan-300 prose-th:bg-gray-800/50 prose-th:px-3 prose-th:py-2
          prose-td:text-gray-300 prose-td:px-3 prose-td:py-2 prose-td:border-gray-800
          prose-code:text-cyan-400 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-cyan-700 prose-blockquote:text-gray-400
          prose-hr:border-gray-800"
        dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
      />
    </div>
  )
}

export default function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [filter, setFilter] = useState<Document['category'] | 'all'>('all')

  const filtered = filter === 'all' ? documents : documents.filter(d => d.category === filter)

  const categories: { key: Document['category'] | 'all'; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'btob', label: 'BtoB戦略' },
    { key: 'marketing', label: 'マーケ' },
    { key: 'product', label: 'プロダクト' },
    { key: 'operations', label: '業務' },
  ]

  return (
    <div className="min-h-screen bg-[#060b14] text-white font-mono">
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-cyan-400">📄</span>{' '}
              <span className="text-cyan-300">制作物・ドキュメント</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              CCが作成した資料を携帯から確認
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition"
          >
            🏢 オフィスに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {selectedDoc ? (
          <DocumentViewer doc={selectedDoc} onBack={() => setSelectedDoc(null)} />
        ) : (
          <div className="space-y-4">
            {/* フィルタ */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition ${
                    filter === cat.key
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                      : 'border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ドキュメント件数 */}
            <p className="text-[10px] text-gray-600">{filtered.length}件のドキュメント</p>

            {/* ドキュメント一覧 */}
            <div className="space-y-3">
              {filtered.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-600 text-sm">
                このカテゴリのドキュメントはまだありません
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-8 py-4 text-center">
        <p className="text-[10px] text-gray-700">
          大口ヘルスケアグループ バーチャルオフィス — 制作物管理
        </p>
      </footer>
    </div>
  )
}

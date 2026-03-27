'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { documents, type Document } from '../lib/documents'

function CategoryBadge({ category }: { category: Document['category'] }) {
  const config = {
    'product': { label: 'プロダクト', color: '#F59E0B', bg: '#F59E0B15' },
    'btob': { label: 'BtoB', color: '#22D3EE', bg: '#22D3EE15' },
    'sns': { label: 'SNS', color: '#A78BFA', bg: '#A78BFA15' },
    'meo': { label: 'MEO/GBP', color: '#FB923C', bg: '#FB923C15' },
    'operations': { label: '業務', color: '#22C55E', bg: '#22C55E15' },
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

function DocumentCard({ doc, onClick, onDelete }: { doc: Document; onClick: () => void; onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:bg-amber-50/50 hover:border-amber-300/60 transition-all shadow-sm">
      <button
        onClick={onClick}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CategoryBadge category={doc.category} />
              {doc.status === 'draft' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
                  ドラフト
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-800 mt-1">{doc.title}</h3>
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{doc.summary}</p>
            <p className="text-[10px] text-gray-400 mt-2">{doc.updatedAt}</p>
          </div>
          <span className="text-amber-400 text-lg flex-shrink-0">→</span>
        </div>
      </button>

      {/* 削除ボタン */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
        className="absolute top-2 right-2 text-gray-400 active:text-red-500 hover:text-red-500 text-sm px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100 transition"
      >
        ✕
      </button>

      {/* 削除確認 */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 border border-gray-200 flex flex-col items-center justify-center gap-3 p-4 rounded-xl z-10">
          <p className="text-xs text-gray-600 text-center">「{doc.title}」を削除しますか？</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              onClick={() => { onDelete(); setShowConfirm(false) }}
              className="px-4 py-1.5 text-xs rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition"
            >
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentViewer({ doc, onBack, onDelete }: { doc: Document; onBack: () => void; onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 transition"
        >
          ← 一覧に戻る
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-500 active:text-red-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition"
        >
          削除
        </button>
      </div>

      {showConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-600">このドキュメントを削除しますか？</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-[10px] rounded-lg border border-gray-200 text-gray-500">
              キャンセル
            </button>
            <button onClick={() => { onDelete(); setShowConfirm(false) }}
              className="px-3 py-1 text-[10px] rounded-lg bg-red-50 text-red-500 border border-red-200">
              削除する
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge category={doc.category} />
          {doc.status === 'draft' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
              ドラフト
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-gray-800">{doc.title}</h2>
        <p className="text-[10px] text-gray-400 mt-1">最終更新: {doc.updatedAt}</p>
      </div>

      <div
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm prose prose-sm max-w-none
          prose-headings:text-amber-700 prose-headings:border-b prose-headings:border-amber-200/60 prose-headings:pb-3
          prose-h2:text-base prose-h2:mt-10 prose-h2:mb-6
          prose-h3:text-sm prose-h3:mt-8 prose-h3:mb-4
          prose-p:text-[13px] prose-p:text-gray-600 prose-p:leading-[2.1] prose-p:mb-6
          prose-li:text-[13px] prose-li:text-gray-600 prose-li:leading-[2.0] prose-li:mb-2
          prose-ul:my-4 prose-ol:my-4
          prose-strong:text-amber-800
          prose-table:text-[12px] prose-table:my-6
          prose-th:text-amber-700 prose-th:bg-amber-50 prose-th:px-3 prose-th:py-2.5
          prose-td:text-gray-600 prose-td:px-3 prose-td:py-2.5 prose-td:border-gray-200
          prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-amber-300 prose-blockquote:text-gray-500 prose-blockquote:my-6
          prose-hr:border-gray-200 prose-hr:my-8
          [&_br]:block [&_br]:mt-4 [&_br]:content-['']
          [&>br]:mt-8"
        dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
      />
    </div>
  )
}

export default function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [filter, setFilter] = useState<Document['category'] | 'all'>('all')
  const [search, setSearch] = useState('')
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  useEffect(() => {
    fetchHiddenIds()
  }, [])

  const fetchHiddenIds = async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setHiddenIds(data.hiddenIds || [])
    } catch {}
  }

  const hideDocument = async (id: string) => {
    await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setHiddenIds(prev => [...prev, id])
    if (selectedDoc?.id === id) setSelectedDoc(null)
  }

  const visibleDocs = documents.filter(d => !hiddenIds.includes(d.id))

  const filtered = visibleDocs.filter(d => {
    const matchCategory = filter === 'all' || d.category === filter
    if (!search.trim()) return matchCategory
    const q = search.trim().toLowerCase()
    const matchSearch = d.title.toLowerCase().includes(q)
      || d.summary.toLowerCase().includes(q)
      || d.contentHtml.toLowerCase().includes(q)
    return matchCategory && matchSearch
  })

  const categories: { key: Document['category'] | 'all'; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'product', label: 'プロダクト' },
    { key: 'btob', label: 'BtoB' },
    { key: 'sns', label: 'SNS' },
    { key: 'meo', label: 'MEO/GBP' },
    { key: 'operations', label: '業務' },
  ]

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-800 font-sans">
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-amber-500">📄</span>{' '}
              <span className="text-amber-700">制作物・ドキュメント</span>
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5">
              CCが作成した資料を携帯から確認・管理
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 text-xs rounded-lg border border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 transition"
          >
            🏢 オフィスに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {selectedDoc ? (
          <DocumentViewer
            doc={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            onDelete={() => hideDocument(selectedDoc.id)}
          />
        ) : (
          <div className="space-y-4">
            {/* 検索窓 */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="キーワードで検索（例: 料金、MEO、Facebook）"
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-amber-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* フィルタ */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition ${
                    filter === cat.key
                      ? 'border-amber-400 text-amber-700 bg-amber-50'
                      : 'border-gray-200 text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ドキュメント件数 */}
            <p className="text-[10px] text-gray-500">
              {filtered.length}件のドキュメント
              {search && <span className="text-amber-600"> （「{search}」で検索中）</span>}
            </p>

            {/* ドキュメント一覧 */}
            <div className="space-y-3">
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onClick={() => setSelectedDoc(doc)}
                  onDelete={() => hideDocument(doc.id)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search ? `「${search}」に一致するドキュメントが見つかりません` : 'このカテゴリのドキュメントはまだありません'}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-amber-200/60 bg-white/60 mt-8 py-4 text-center">
        <p className="text-[10px] text-gray-400">
          大口ヘルスケアグループ バーチャルオフィス — 制作物管理
        </p>
      </footer>
    </div>
  )
}

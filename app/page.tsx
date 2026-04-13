'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { departments, allEmployeesList, products, productCategories } from './lib/data'
import type { Employee, Product } from './lib/data'
import { documents } from './lib/documents'
import type { Document } from './lib/documents'
import PixelCharacter from './components/PixelCharacter'
import ChatModal from './components/ChatModal'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通コンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatusBadge({ status }: { status: Employee['status'] }) {
  const config = {
    busy: { label: '激忙中', color: 'text-red-500', icon: '🔥' },
    working: { label: '作業中', color: 'text-green-600', icon: '💻' },
    idle: { label: '待機中', color: 'text-gray-400', icon: '💤' },
    meeting: { label: '会議中', color: 'text-yellow-600', icon: '📞' },
  }
  const c = config[status]
  return <span className={`text-xs ${c.color}`}>{c.icon} {c.label}</span>
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SNS投稿コピー機能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stripHtmlToText(html: string): string {
  let text = html
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<\/tr>/gi, '\n')
  text = text.replace(/<[^>]*>/g, '')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SNS投稿カード
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PostCard({ doc }: { doc: Document }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const plainText = stripHtmlToText(doc.contentHtml)
  const preview = plainText.slice(0, 120) + (plainText.length > 120 ? '...' : '')

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = plainText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const categoryConfig: Record<string, { label: string; color: string }> = {
    btob: { label: 'BtoB', color: '#22D3EE' },
    sns: { label: 'SNS', color: '#EC4899' },
    product: { label: 'プロダクト', color: '#F59E0B' },
    meo: { label: 'MEO', color: '#10B981' },
    operations: { label: '運営', color: '#6366F1' },
  }
  const catConf = categoryConfig[doc.category] || { label: doc.category, color: '#999' }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: catConf.color + '15', color: catConf.color, border: `1px solid ${catConf.color}30` }}
            >
              {catConf.label}
            </span>
            <span className="text-[9px] text-gray-300">{doc.updatedAt}</span>
            {doc.status === 'draft' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">下書き</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 ${
              copied
                ? 'bg-green-50 text-green-600 border-green-300'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
            }`}
          >
            {copied ? 'コピーしました!' : 'コピー'}
          </button>
        </div>

        <h4 className="text-xs font-bold text-gray-800 leading-snug mb-1">{doc.title}</h4>

        {expanded ? (
          <div
            className="text-[11px] text-gray-600 leading-relaxed mt-3 prose-sm max-h-[60vh] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
          />
        ) : (
          <p className="text-[11px] text-gray-500 leading-relaxed">{preview}</p>
        )}
      </div>

      <div className="px-4 pb-2 text-[9px] text-gray-400">
        {expanded ? '▲ 閉じる' : '▼ 全文を表示'}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 事業別ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type BusinessId = 'seitai' | 'houmon' | 'app-biz' | 'consulting' | 'device'

interface ChannelDef {
  id: string
  label: string
  icon: string
  // document matching: title/id keywords
  keywords: string[]
}

const businessConfig: Record<BusinessId, {
  name: string
  icon: string
  color: string
  deptIds: string[]
  productCategories: string[]
  documentCategories: string[]
  channels: ChannelDef[]
}> = {
  seitai: {
    name: '大口神経整体院',
    icon: '🏥',
    color: '#1565C0',
    deptIds: ['seitai'],
    productCategories: ['clinic-app'],
    documentCategories: ['operations', 'sns'],
    channels: [
      { id: 'instagram', label: 'Instagram', icon: '📸', keywords: ['instagram', 'insta'] },
      { id: 'gbp', label: 'GBP(MEO)', icon: '📍', keywords: ['gbp', 'google', 'gmb', 'meo'] },
      { id: 'blog', label: 'ブログ(SEO)', icon: '📝', keywords: ['blog', 'seo', 'ブログ', '記事'] },
      { id: 'line', label: 'LINE', icon: '💬', keywords: ['line'] },
      { id: 'note', label: 'note', icon: '📓', keywords: ['note'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  houmon: {
    name: '晴陽鍼灸院（訪問鍼灸）',
    icon: '🏠',
    color: '#2E7D32',
    deptIds: ['houmon'],
    productCategories: ['houmon-app'],
    documentCategories: ['operations'],
    channels: [
      { id: 'instagram', label: 'Instagram', icon: '📸', keywords: ['instagram', 'insta'] },
      { id: 'gbp', label: 'GBP(MEO)', icon: '📍', keywords: ['gbp', 'google', 'gmb', 'meo'] },
      { id: 'blog', label: 'ブログ(SEO)', icon: '📝', keywords: ['blog', 'seo', 'ブログ', '記事'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  'app-biz': {
    name: 'アプリ事業（BtoB SaaS）',
    icon: '📱',
    color: '#263238',
    deptIds: ['ai_dev', 'btob', 'product_mgmt', 'customer_success'],
    productCategories: ['btob-saas'],
    documentCategories: ['btob'],
    channels: [
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'threads', label: 'Threads', icon: '🧵', keywords: ['threads'] },
      { id: 'oc', label: 'オープンチャット', icon: '💬', keywords: ['oc', 'オープンチャット'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  consulting: {
    name: 'コンサル事業',
    icon: '🧭',
    color: '#FBC02D',
    deptIds: ['consulting'],
    productCategories: [],
    documentCategories: ['consulting'],
    channels: [
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
  device: {
    name: '治療機器販売',
    icon: '🔧',
    color: '#E53935',
    deptIds: ['device_sales'],
    productCategories: [],
    documentCategories: ['device'],
    channels: [
      { id: 'facebook', label: 'Facebook', icon: '📘', keywords: ['facebook', 'fb'] },
      { id: 'apps', label: 'アプリ', icon: '📱', keywords: [] },
    ],
  },
}

// Match a document to a channel by keywords in title/id
function matchChannel(doc: Document, channel: ChannelDef): boolean {
  if (channel.keywords.length === 0) return false
  const haystack = (doc.title + ' ' + doc.id).toLowerCase()
  return channel.keywords.some(kw => haystack.includes(kw))
}

function BusinessView({ businessId, setChatTarget }: { businessId: BusinessId; setChatTarget: (emp: Employee) => void }) {
  const config = businessConfig[businessId]
  const [activeChannel, setActiveChannel] = useState(config.channels[0].id)

  // Get data
  const bizProducts = config.productCategories.length > 0
    ? products.filter(p => config.productCategories.includes(p.category))
    : []
  const bizDocuments = documents.filter(d => config.documentCategories.includes(d.category))
  const bizDepts = departments.filter(d => config.deptIds.includes(d.id))
  const bizEmployees = bizDepts.flatMap(d => d.employees)

  // Current channel
  const currentChannel = config.channels.find(c => c.id === activeChannel) || config.channels[0]
  const isAppsChannel = currentChannel.id === 'apps'

  // Filter docs for current channel
  const channelDocs = isAppsChannel ? [] : bizDocuments.filter(d => matchChannel(d, currentChannel))

  // Docs that don't match any channel (show in first non-apps channel as fallback)
  const unmatchedDocs = bizDocuments.filter(d => !config.channels.some(c => c.id !== 'apps' && matchChannel(d, c)))

  // Count per channel
  const channelCounts: Record<string, number> = {}
  config.channels.forEach(ch => {
    if (ch.id === 'apps') {
      channelCounts[ch.id] = bizProducts.length
    } else {
      let count = bizDocuments.filter(d => matchChannel(d, ch)).length
      // Add unmatched to first non-apps channel
      if (ch.id === config.channels.find(c => c.id !== 'apps')?.id) {
        count += unmatchedDocs.length
      }
      channelCounts[ch.id] = count
    }
  })

  // Final docs to show (include unmatched if this is the first non-apps channel)
  const firstContentChannel = config.channels.find(c => c.id !== 'apps')
  const docsToShow = isAppsChannel
    ? []
    : activeChannel === firstContentChannel?.id
      ? [...channelDocs, ...unmatchedDocs]
      : channelDocs

  return (
    <div className="space-y-0 pb-8">
      {/* Header */}
      <div className="bg-white rounded-t-2xl border-2 border-b-0 p-4 shadow-sm" style={{ borderColor: config.color + '33' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h2 className="text-base font-bold" style={{ color: config.color }}>{config.name}</h2>
            <p className="text-[10px] text-gray-400">
              {bizEmployees.length}名 | {bizProducts.length}アプリ | {bizDocuments.length}投稿
            </p>
          </div>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="bg-white border-x-2 px-2 pb-2" style={{ borderColor: config.color + '33' }}>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {config.channels.map(ch => {
            const isActive = activeChannel === ch.id
            const count = channelCounts[ch.id] || 0
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'font-bold text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: config.color } : undefined}
              >
                <span>{ch.icon}</span>
                <span>{ch.label}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Channel content */}
      <div className="bg-white rounded-b-2xl border-2 border-t-0 p-4 shadow-sm min-h-[300px]" style={{ borderColor: config.color + '33' }}>
        {isAppsChannel ? (
          /* アプリ一覧 */
          bizProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">この事業に紐づくアプリはまだありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {bizProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-3 hover:shadow-md hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xl">{product.icon}</span>
                    <span
                      className="text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: product.rank === 'A' ? '#22C55E18' : product.rank === 'B' ? '#F59E0B18' : '#EF444418',
                        color: product.rank === 'A' ? '#16A34A' : product.rank === 'B' ? '#D97706' : '#DC2626',
                        border: `2px solid ${product.rank === 'A' ? '#22C55E' : product.rank === 'B' ? '#F59E0B' : '#EF4444'}`,
                      }}
                    >
                      {product.rank}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 leading-tight">{product.name}</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-[9px] text-amber-600 hover:text-amber-800 transition">
                      開く →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* SNS投稿一覧 */
          docsToShow.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">{currentChannel.icon}</p>
              <p className="text-sm text-gray-400">{currentChannel.label}の投稿はまだありません</p>
              <p className="text-[10px] text-gray-300 mt-1">ここに投稿が追加されると一覧表示されます</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docsToShow.map(doc => (
                <PostCard key={doc.id} doc={doc} />
              ))}
            </div>
          )
        )}
      </div>

      {/* 担当AI社員（コンパクト） */}
      {bizEmployees.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[11px] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
            担当AI社員
          </h3>
          <div className="flex flex-wrap gap-2">
            {bizEmployees.map(emp => (
              <div
                key={emp.id}
                className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-amber-50/50 hover:shadow-sm transition-all"
                onClick={() => setChatTarget(emp)}
              >
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={28} />
                <div>
                  <span className="text-[10px] font-bold" style={{ color: emp.color }}>{emp.name}</span>
                  <StatusBadge status={emp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ホーム画面（簡素化版）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HomeView() {
  const quickApps = [
    { name: '顧客管理', icon: '👥', url: 'https://customer-mgmt.vercel.app', color: '#F59E0B' },
    { name: '予約管理', icon: '📅', url: 'https://reservation-app-steel.vercel.app', color: '#3B82F6' },
    { name: 'WEB問診', icon: '📝', url: 'https://web-monshin.vercel.app', color: '#8B5CF6' },
    { name: '検査シート', icon: '🔬', url: 'https://kensa-sheet-app.vercel.app', color: '#10B981' },
    { name: 'MEO勝ち上げくん', icon: '🏆', url: 'https://meo-kachiagekun.vercel.app', color: '#EF4444' },
    { name: 'プロジェクト管理', icon: '📋', url: 'https://project-hub-three-chi.vercel.app', color: '#6366F1' },
  ]

  const totalEmployees = allEmployeesList.length
  const busyCount = allEmployeesList.filter(e => e.status === 'busy').length
  const workingCount = allEmployeesList.filter(e => e.status === 'working').length

  return (
    <div className="space-y-6 pb-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI Solutions</h2>
            <p className="text-sm text-gray-500">会長：大口 陽平</p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              Mission - 「できない」を「できる」に変え、光を灯す。
            </p>
          </div>
        </div>

        {/* ステータスサマリー */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-amber-100">
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{totalEmployees}</p>
            <p className="text-[10px] text-gray-400">AI社員</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">{busyCount}</p>
            <p className="text-[10px] text-gray-400">激忙中</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{workingCount}</p>
            <p className="text-[10px] text-gray-400">作業中</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">5</p>
            <p className="text-[10px] text-gray-400">事業</p>
          </div>
        </div>
      </div>

      {/* よく使うアプリ（6個に絞る） */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          よく使うアプリ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickApps.map(app => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-200 hover:shadow-md hover:scale-[1.03] transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
              <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{app.name}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: app.color + '15', color: app.color }}>
                開く →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* 5事業クイックアクセス */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          5事業
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(businessConfig) as [BusinessId, typeof businessConfig[BusinessId]][]).map(([id, biz]) => {
            const depts = departments.filter(d => biz.deptIds.includes(d.id))
            const empCount = depts.reduce((sum, d) => sum + d.employees.length, 0)
            const prodCount = biz.productCategories.length > 0
              ? products.filter(p => biz.productCategories.includes(p.category)).length
              : 0
            return (
              <div
                key={id}
                className="bg-white rounded-xl border-2 p-4 shadow-sm"
                style={{ borderColor: biz.color + '33' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{biz.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: biz.color }}>{biz.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{empCount}名</span>
                  {prodCount > 0 && <span>{prodCount}アプリ</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ViewType = 'home' | 'seitai' | 'houmon' | 'app-biz' | 'consulting' | 'device'

const sidebarItems: { key: ViewType; label: string; icon: string }[] = [
  { key: 'home', label: '全社ダッシュボード', icon: '🏠' },
  { key: 'seitai', label: '整体院', icon: '🏥' },
  { key: 'houmon', label: '訪問鍼灸', icon: '🏠' },
  { key: 'app-biz', label: 'アプリ事業', icon: '📱' },
  { key: 'consulting', label: 'コンサル', icon: '🧭' },
  { key: 'device', label: '治療機器', icon: '🔧' },
]

export default function VirtualOffice() {
  const [now, setNow] = useState('')
  const [view, setView] = useState<ViewType>('home')
  const [chatTarget, setChatTarget] = useState<Employee | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleString('ja-JP'))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const totalEmployees = allEmployeesList.length

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-800 font-sans">
      {/* ヘッダー */}
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-amber-50 transition text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm shadow-sm">
                🏢
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-800">AI Solutions</h1>
                <p className="text-[9px] text-gray-400">{now}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              5事業
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {totalEmployees}名
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* モバイルオーバーレイ */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* サイドバー */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-[57px] left-0 z-40 lg:z-10
          h-full lg:h-[calc(100vh-57px)]
          w-56 bg-white border-r border-amber-200/60
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
          pt-4 lg:pt-4
        `}>
          <nav className="px-3 space-y-1">
            {sidebarItems.map(item => {
              const isActive = view === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => { setView(item.key); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 font-medium border border-amber-200'
                      : 'text-gray-500 hover:bg-amber-50/50 hover:text-gray-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}

            {/* 区切り線 */}
            <div className="border-t border-gray-100 my-2" />

            {/* 資料リンク */}
            <Link
              href="/documents"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-gray-500 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base">📄</span>
              <span>資料</span>
            </Link>
          </nav>

          <div className="mt-6 mx-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-[10px] text-amber-700 font-medium">AI Solutions v5.0</p>
            <p className="text-[9px] text-gray-400 mt-0.5">5事業 / AI社員{totalEmployees}名</p>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full">
          {view === 'home' ? (
            <HomeView />
          ) : (
            <BusinessView businessId={view as BusinessId} setChatTarget={setChatTarget} />
          )}
        </main>
      </div>

      {/* チャットモーダル */}
      {chatTarget && (
        <ChatModal employee={chatTarget} onClose={() => setChatTarget(null)} />
      )}

      <footer className="border-t border-amber-200/60 bg-white/60 py-4 text-center">
        <p className="text-[10px] text-gray-400">
          AI Solutions v5.0 — 5事業 / AI社員{totalEmployees}名体制
        </p>
      </footer>
    </div>
  )
}

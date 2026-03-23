'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { departments, cloudUsage, allEmployeesList, products, productCategories } from './lib/data'
import type { Employee, Department, Product } from './lib/data'
import PixelCharacter from './components/PixelCharacter'
import ChatModal from './components/ChatModal'

function StatusBadge({ status }: { status: Employee['status'] }) {
  const config = {
    busy: { label: '激忙中', color: 'text-red-400', icon: '🔥' },
    working: { label: '作業中', color: 'text-green-400', icon: '💻' },
    idle: { label: '待機中', color: 'text-gray-400', icon: '💤' },
    meeting: { label: '会議中', color: 'text-yellow-400', icon: '📞' },
  }
  const c = config[status]
  return <span className={`text-xs ${c.color} font-mono`}>{c.icon} {c.label}</span>
}

// 社員カード（できること一覧付き）
function EmployeeCard({ emp, onChat }: { emp: Employee; onChat?: (emp: Employee) => void }) {
  const [showSkills, setShowSkills] = useState(false)

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      {/* メイン情報 */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-900/80 transition-all active:scale-[0.99]"
        onClick={() => onChat?.(emp)}
      >
        <div className="flex-shrink-0 relative">
          <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={56} />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
            style={{ backgroundColor: emp.color + '33', color: emp.color, border: `1px solid ${emp.color}55` }}
          >
            {emp.name}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: emp.color }}>【{emp.name}】</span>
            <StatusBadge status={emp.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
          <p className="text-xs text-cyan-400 mt-1 truncate">{emp.currentTask}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">
              💬 話しかける
            </span>
          </div>
        </div>
      </div>

      {/* できること一覧トグル */}
      <button
        onClick={() => setShowSkills(!showSkills)}
        className="w-full px-3 py-1.5 text-[10px] text-gray-500 hover:text-gray-300 border-t border-gray-800/50 hover:bg-gray-800/30 transition flex items-center justify-center gap-1"
      >
        {showSkills ? '▲ 閉じる' : '▼ できること一覧'}
      </button>

      {showSkills && (
        <div className="px-3 pb-3 space-y-1">
          {emp.skills.map((skill, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] text-cyan-600 mt-0.5">●</span>
              <span className="text-[11px] text-gray-400">{skill}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 部署カード（頼めること付き）
function DepartmentCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  const [expanded, setExpanded] = useState(false)
  const busyCount = dept.employees.filter(e => e.status === 'busy').length
  const workingCount = dept.employees.filter(e => e.status === 'working').length

  return (
    <div
      className="rounded-xl border-2 overflow-hidden transition-all"
      style={{ borderColor: dept.borderColor + '88', backgroundColor: '#0a0f1a' }}
    >
      {/* 部署ヘッダー */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-900/50 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dept.icon}</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: dept.color }}>{dept.name}</h3>
              <p className="text-[10px] text-gray-500">{dept.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {busyCount > 0 && <span className="text-xs text-red-400 font-mono">🔥{busyCount}</span>}
            {workingCount > 0 && <span className="text-xs text-green-400 font-mono">💻{workingCount}</span>}
            <span className="text-xs text-gray-600 font-mono">{dept.employees.length}名</span>
            <span className="text-gray-600 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* この部署に頼めること */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-gray-600 mb-1.5">この部署に頼めること：</p>
        <div className="flex flex-wrap gap-1">
          {dept.canAsk.map((item, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border text-gray-400"
              style={{ borderColor: dept.color + '44', backgroundColor: dept.color + '08' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 管轄アプリ */}
      {dept.apps.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {dept.apps.map(app => (
            <span key={app} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
              {app}
            </span>
          ))}
        </div>
      )}

      {/* 社員一覧 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {dept.employees.map(emp => (
            <EmployeeCard key={emp.id} emp={emp} onChat={onChat} />
          ))}
        </div>
      )}
    </div>
  )
}

// 組織図ノード
function OrgNode({ name, role, color, status, glow, onClick }: {
  name: string; role: string; color: string; status: Employee['status']; glow?: boolean; onClick?: () => void
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center border-2 transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${glow ? 'shadow-lg' : ''}`}
      style={{
        borderColor: color + '88',
        backgroundColor: color + '15',
        boxShadow: glow ? `0 0 20px ${color}33` : undefined,
      }}
      onClick={onClick}
    >
      <div className="flex justify-center mb-1">
        <PixelCharacter name={name} color={color} status={status} size={44} />
      </div>
      <p className="font-bold text-xs" style={{ color }}>{name}</p>
      <p className="text-[9px] text-gray-400">{role}</p>
    </div>
  )
}

// 組織図の部署カード
function OrgDeptCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  return (
    <div
      className="rounded-xl border p-3 hover:scale-[1.02] transition-all"
      style={{ borderColor: dept.borderColor + '66', backgroundColor: dept.color + '08' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{dept.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: dept.color }}>{dept.name}</p>
          <p className="text-[9px] text-gray-500">{dept.description}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">{dept.employees.length}名</span>
      </div>

      {/* メンバー */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {dept.employees.map(emp => (
          <div
            key={emp.id}
            className="flex flex-col items-center group relative cursor-pointer hover:scale-110 transition-transform"
            onClick={() => onChat?.(emp)}
          >
            <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={36} />
            <span className="text-[8px] mt-0.5" style={{ color: emp.color }}>{emp.name}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 shadow-xl whitespace-nowrap">
                <p className="text-[10px] font-bold" style={{ color: emp.color }}>【{emp.name}】</p>
                <p className="text-[9px] text-gray-400">{emp.role}</p>
                <p className="text-[9px] text-cyan-400 mt-0.5">{emp.currentTask}</p>
                <p className="text-[9px] text-cyan-600 mt-0.5">💬 タップして話しかける</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 頼めること */}
      <div className="mt-2 flex flex-wrap gap-0.5 justify-center">
        {dept.canAsk.slice(0, 3).map((item, i) => (
          <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full text-gray-500"
            style={{ backgroundColor: dept.color + '10', border: `1px solid ${dept.color}22` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// 組織図ビュー
function OrgChart({ setChatTarget }: { setChatTarget: (emp: Employee) => void }) {
  const execDept = departments.find(d => d.id === 'executive')
  const financeDept = departments.find(d => d.id === 'finance')
  const opsDepts = departments.filter(d => d.parentDivision === 'operations')
  const aiDept = departments.find(d => d.id === 'ai_dev')
  const mediaDept = departments.find(d => d.id === 'media')
  const totalEmps = allEmployeesList.length

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-cyan-300">大口ヘルスケアグループ 組織図</h2>
        <p className="text-[10px] text-gray-600 mt-1">AI社員{totalEmps}名 + 会長 = {totalEmps + 1}名体制 | {departments.length}部署</p>
      </div>

      {/* 会長 */}
      <div className="flex justify-center">
        <OrgNode name="大口 陽平" role="会長（最高意思決定者）" color="#FFD700" status="busy" glow />
      </div>
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-yellow-600/50" /></div>

      {/* 経営層 */}
      {execDept && (
        <div className="max-w-md mx-auto">
          <OrgDeptCard dept={execDept} onChat={setChatTarget} />
        </div>
      )}
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-gray-600/50" /></div>

      {/* 財務部 */}
      {financeDept && (
        <div className="max-w-xs mx-auto">
          <OrgDeptCard dept={financeDept} onChat={setChatTarget} />
        </div>
      )}
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-gray-600/50" /></div>

      {/* 3部門分岐 */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 実業サポート */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full border border-blue-800/50">
                🏢 実業サポート部門
              </span>
            </div>
            {opsDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
          </div>

          {/* AI開発部 */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full border border-cyan-800/50">
                🤖 AI会社（収益中核）
              </span>
            </div>
            {aiDept && <OrgDeptCard dept={aiDept} onChat={setChatTarget} />}
          </div>

          {/* メディア部 */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full border border-purple-800/50">
                🎬 全社横断メディア
              </span>
            </div>
            {mediaDept && <OrgDeptCard dept={mediaDept} onChat={setChatTarget} />}
          </div>
        </div>
      </div>

      {/* 全社統計 */}
      <div className="mt-6 bg-gradient-to-r from-cyan-900/10 via-purple-900/10 to-cyan-900/10 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-wrap justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-cyan-400">{totalEmps + 1}</p>
            <p className="text-[10px] text-gray-500">総社員数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">6</p>
            <p className="text-[10px] text-gray-500">部署数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {departments.reduce((sum, d) => sum + d.apps.length, 0)}
            </p>
            <p className="text-[10px] text-gray-500">管轄アプリ</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">¥1,500万</p>
            <p className="text-[10px] text-gray-500">年間売上目標</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 制作物ボードビュー（写真のようなプロジェクト一覧）
function ProductBoard({ setChatTarget }: { setChatTarget: (emp: Employee) => void }) {
  const [filterCat, setFilterCat] = useState<string>('all')
  const cats = Object.entries(productCategories)
  const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat)
  const activeCount = products.filter(p => p.status === 'active').length
  const devCount = products.filter(p => p.status === 'development').length

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-cyan-300">制作物ボード</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          全{products.length}プロダクト | 稼働中 {activeCount} | 開発中 {devCount} | AI社員{allEmployeesList.length}名が担当
        </p>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
            filterCat === 'all' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
          }`}
        >
          すべて ({products.length})
        </button>
        {cats.map(([key, cat]) => {
          const count = products.filter(p => p.category === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilterCat(key)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
                filterCat === key ? 'text-white bg-opacity-20' : 'border-gray-700 text-gray-500'
              }`}
              style={filterCat === key ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '15' } : {}}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* プロダクトグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} onClickMember={setChatTarget} />
        ))}
      </div>
    </div>
  )
}

// プロダクトカード（アバター付き）
function ProductCard({ product, onClickMember }: { product: Product; onClickMember: (emp: Employee) => void }) {
  const cat = productCategories[product.category]
  const assignedEmployees = allEmployeesList.filter(e => product.assignedTo.includes(e.id))

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ borderColor: cat.color + '44', backgroundColor: '#0a0f1a' }}
    >
      {/* ヘッダー */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xl">{product.icon}</span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: product.status === 'active' ? '#22C55E22' : product.status === 'development' ? '#F59E0B22' : '#64748B22',
              color: product.status === 'active' ? '#22C55E' : product.status === 'development' ? '#F59E0B' : '#64748B',
              border: `1px solid ${product.status === 'active' ? '#22C55E44' : product.status === 'development' ? '#F59E0B44' : '#64748B44'}`,
            }}
          >
            {product.status === 'active' ? '稼働中' : product.status === 'development' ? '開発中' : '計画中'}
          </span>
        </div>
        <h4 className="text-xs font-bold text-white leading-tight">{product.name}</h4>
        <p className="text-[9px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
      </div>

      {/* 担当メンバーアバター */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1">
          {assignedEmployees.map(emp => (
            <div
              key={emp.id}
              className="cursor-pointer hover:scale-125 transition-transform relative group"
              onClick={() => onClickMember(emp)}
            >
              <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={28} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                <div className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 shadow-xl whitespace-nowrap">
                  <p className="text-[9px] font-bold" style={{ color: emp.color }}>{emp.name}</p>
                  <p className="text-[8px] text-gray-400">{emp.role.split('（')[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* カテゴリ＆URL */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: cat.color + '15', color: cat.color, border: `1px solid ${cat.color}33` }}
        >
          {cat.label}
        </span>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cyan-600 hover:text-cyan-400 transition"
            onClick={e => e.stopPropagation()}
          >
            🔗 開く
          </a>
        )}
      </div>
    </div>
  )
}

// メインページ
export default function VirtualOffice() {
  const [now, setNow] = useState('')
  const [view, setView] = useState<'dashboard' | 'org' | 'products'>('products')
  const [chatTarget, setChatTarget] = useState<Employee | null>(null)

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleString('ja-JP'))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const totalEmployees = allEmployeesList.length
  const busyCount = allEmployeesList.filter(e => e.status === 'busy').length
  const workingCount = allEmployeesList.filter(e => e.status === 'working').length
  const totalApps = departments.reduce((sum, d) => sum + d.apps.length, 0)

  const execDept = departments.find(d => d.id === 'executive')
  const financeDept = departments.find(d => d.id === 'finance')
  const opsDepts = departments.filter(d => d.parentDivision === 'operations')
  const aiDept = departments.find(d => d.id === 'ai_dev')
  const mediaDept = departments.find(d => d.id === 'media')

  return (
    <div className="min-h-screen bg-[#060b14] text-white font-mono">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-cyan-400">🏢</span>{' '}
              <span className="text-cyan-300">大口ヘルスケアグループ</span>{' '}
              <span className="text-gray-600 text-sm">バーチャルオフィス</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {now} | AI社員{totalEmployees}名 · {departments.length}部署
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setView('products')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                view === 'products' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
              }`}
            >
              🎯 制作物ボード
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                view === 'dashboard' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
              }`}
            >
              📋 部署一覧
            </button>
            <button
              onClick={() => setView('org')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                view === 'org' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
              }`}
            >
              🏗️ 組織図
            </button>
            <Link
              href="/documents"
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-500 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition"
            >
              📄 資料
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ステータスバー */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '社員数', value: totalEmployees, color: '#22D3EE' },
            { label: '激忙中', value: busyCount, color: '#EF4444' },
            { label: '作業中', value: workingCount, color: '#22C55E' },
            { label: 'プロダクト', value: products.length, color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {view === 'products' ? (
          <ProductBoard setChatTarget={setChatTarget} />
        ) : view === 'dashboard' ? (
          <div className="space-y-6">
            {/* 会長 */}
            <section className="bg-gradient-to-r from-yellow-900/20 to-transparent rounded-xl border-2 border-yellow-700/50 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <h2 className="text-base font-bold text-yellow-400">大口 陽平</h2>
                  <p className="text-xs text-yellow-600">会長 — 最高意思決定者</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">大口神経整体院 × 晴陽鍼灸院 × AI事業</p>
                </div>
              </div>
            </section>

            {/* 経営層・財務部 */}
            {execDept && <DepartmentCard dept={execDept} onChat={setChatTarget} />}
            {financeDept && <DepartmentCard dept={financeDept} onChat={setChatTarget} />}

            {/* 実業サポート */}
            <section>
              <h2 className="text-xs text-blue-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                🏢 実業サポート部門（整体院・訪問鍼灸）
              </h2>
              <div className="space-y-4">
                {opsDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>

            {/* AI開発部 */}
            <section>
              <h2 className="text-xs text-cyan-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                🤖 AI会社（収益中核）— 年間売上目標 ¥1,500万
              </h2>
              {aiDept && <DepartmentCard dept={aiDept} onChat={setChatTarget} />}
            </section>

            {/* メディア部 */}
            <section>
              <h2 className="text-xs text-purple-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                🎬 全社横断メディア
              </h2>
              {mediaDept && <DepartmentCard dept={mediaDept} onChat={setChatTarget} />}
            </section>

            {/* クラウド使用量 */}
            <section className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
              <h2 className="text-sm font-bold text-yellow-400 mb-3">⚡ クラウド使用量</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cloudUsage.map(cu => {
                  const pct = Math.min((cu.used / cu.limit) * 100, 100)
                  const barColor = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#22D3EE'
                  return (
                    <div key={cu.service} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{cu.service}</span>
                        <span className="text-[10px] text-gray-600">{cu.cost}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-10 text-right">{Math.round(pct)}%</span>
                      </div>
                      <p className="text-[10px] text-gray-600 text-right">{cu.used} / {cu.limit} {cu.unit}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        ) : (
          <OrgChart setChatTarget={setChatTarget} />
        )}
      </main>

      {/* チャットモーダル */}
      {chatTarget && (
        <ChatModal employee={chatTarget} onClose={() => setChatTarget(null)} />
      )}

      <footer className="border-t border-gray-800 mt-8 py-4 text-center">
        <p className="text-[10px] text-gray-700">
          大口ヘルスケアグループ バーチャルオフィス v2.0 — AI社員{totalEmployees}名 · {departments.length}部署体制
        </p>
      </footer>
    </div>
  )
}

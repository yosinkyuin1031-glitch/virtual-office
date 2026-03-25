'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { departments, cloudUsage, allEmployeesList, products, productCategories, workflowTemplates, workflowCategories, appBundles, automationTasks } from './lib/data'
import type { Employee, Department, Product, WorkflowTemplate } from './lib/data'
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
  const aiDepts = departments.filter(d => d.parentDivision === 'ai')
  const contentDepts = departments.filter(d => d.parentDivision === 'content')
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

      {/* 4部門分岐 */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* AI・BtoB部門 */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full border border-cyan-800/50">
                🤖 AI・BtoB部門（収益中核）
              </span>
            </div>
            {aiDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
          </div>

          {/* 制作部門 */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-pink-900/30 text-pink-400 px-3 py-1 rounded-full border border-pink-800/50">
                🎨 LP・制作部門
              </span>
            </div>
            {contentDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
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
            <p className="text-2xl font-bold text-yellow-400">{departments.length}</p>
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

// 会長メモビュー
function ChairmanMemos() {
  const [memos, setMemos] = useState<{ id: string; content: string; category: string; source: string; department_tags: string[]; created_at: string }[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [filterCat, setFilterCat] = useState('all')
  const [loading, setLoading] = useState(false)

  const categories = [
    { key: 'direction', label: '方針・判断', icon: '🧭', color: '#FFD700' },
    { key: 'insight', label: '気づき', icon: '💡', color: '#22D3EE' },
    { key: 'task', label: 'タスク', icon: '📋', color: '#22C55E' },
    { key: 'feedback', label: 'FB', icon: '📝', color: '#F59E0B' },
    { key: 'general', label: 'その他', icon: '💬', color: '#A78BFA' },
  ]

  useEffect(() => {
    fetchMemos()
  }, [filterCat])

  const fetchMemos = async () => {
    const params = filterCat !== 'all' ? `?category=${filterCat}` : ''
    const res = await fetch(`/api/memos${params}`)
    const data = await res.json()
    setMemos(data.memos || [])
  }

  const sendMemo = async () => {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)
    await fetch('/api/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, category, source: 'web' }),
    })
    setInput('')
    await fetchMemos()
    setLoading(false)
  }

  const deleteMemo = async (id: string) => {
    await fetch(`/api/memos?id=${id}`, { method: 'DELETE' })
    await fetchMemos()
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-yellow-300">会長メモ</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          あなたの言葉が全社員の知識になります | LINE返信も自動で反映されます
        </p>
      </div>

      {/* メモ入力 */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-transparent rounded-xl border-2 border-yellow-700/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">👨‍💼</span>
          <span className="text-sm font-bold text-yellow-400">大口 陽平</span>
          <span className="text-[10px] text-gray-500">会長</span>
        </div>

        {/* カテゴリ選択 */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                category === c.key ? 'text-white' : 'border-gray-700 text-gray-500'
              }`}
              style={category === c.key ? { borderColor: c.color, color: c.color, backgroundColor: c.color + '15' } : {}}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* 入力欄 */}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMemo() } }}
            placeholder="考えていること、方針、気づき、タスクをメモ..."
            rows={2}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-yellow-700 transition"
          />
          <button
            onClick={sendMemo}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 bg-yellow-700 hover:bg-yellow-600 text-white"
          >
            保存
          </button>
        </div>

        <p className="text-[9px] text-gray-600">
          LINEからも入力可能: 「方針:〇〇」「気づき:〇〇」「タスク:〇〇」と送信すると自動分類されます
        </p>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
            filterCat === 'all' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-gray-700 text-gray-500'
          }`}
        >
          すべて
        </button>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
              filterCat === c.key ? 'text-white' : 'border-gray-700 text-gray-500'
            }`}
            style={filterCat === c.key ? { borderColor: c.color, color: c.color, backgroundColor: c.color + '15' } : {}}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* メモ一覧 */}
      <div className="space-y-2">
        {memos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">まだメモがありません</p>
            <p className="text-gray-700 text-[10px] mt-1">上のフォームから入力するか、LINEで送信してください</p>
          </div>
        )}
        {memos.map(memo => {
          const cat = categories.find(c => c.key === memo.category) || categories[4]
          const date = new Date(memo.created_at)
          const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          return (
            <div
              key={memo.id}
              className="rounded-xl border p-3 hover:bg-gray-900/50 transition group"
              style={{ borderColor: cat.color + '33', backgroundColor: '#0a0f1a' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color + '15', color: cat.color, border: `1px solid ${cat.color}33` }}
                    >
                      {cat.icon} {cat.label}
                    </span>
                    {memo.source === 'line' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/50">
                        LINE
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                  {memo.department_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {memo.department_tags.map(tag => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMemo(memo.id)}
                  className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 活動フィード（全社の最新動き）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ActivityFeed() {
  const [activities, setActivities] = useState<{id: string; employee_name: string; department: string; action: string; detail: string; created_at: string}[]>([])
  const [runningCount, setRunningCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchActivity()
    const timer = setInterval(fetchActivity, 15000) // 15秒ごとに更新
    return () => clearInterval(timer)
  }, [])

  const fetchActivity = async () => {
    try {
      const [actRes, cmdRes] = await Promise.all([
        fetch('/api/activity?limit=5'),
        fetch('/api/commands?status=all&limit=50'),
      ])
      const actData = await actRes.json()
      const cmdData = await cmdRes.json()
      setActivities(actData.activities || [])
      const cmds = cmdData.commands || []
      setRunningCount(cmds.filter((c: {status: string}) => c.status === 'running').length)
      setPendingCount(cmds.filter((c: {status: string}) => c.status === 'pending').length)
    } catch {
      setActivities([])
    }
  }

  if (activities.length === 0 && runningCount === 0 && pendingCount === 0) return null

  return (
    <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 font-bold">📡 リアルタイム状況</span>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/50 animate-pulse">
              ⚡ {runningCount}件 実行中
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
              ⏳ {pendingCount}件 待機中
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {activities.slice(0, 3).map(a => {
          const emp = allEmployeesList.find(e => e.name === a.employee_name)
          const ago = getTimeAgo(a.created_at)
          return (
            <div key={a.id} className="flex items-center gap-2 text-[10px]">
              {emp ? (
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={18} />
              ) : (
                <span className="text-gray-600">🤖</span>
              )}
              <span style={{ color: emp?.color || '#888' }}>{a.employee_name}</span>
              <span className="text-gray-600">—</span>
              <span className="text-gray-400 flex-1 truncate">{a.action}: {a.detail}</span>
              <span className="text-gray-600 flex-shrink-0">{ago}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '今'
  if (min < 60) return `${min}分前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}時間前`
  return `${Math.floor(hr / 24)}日前`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 指令センター（携帯→ターミナル自動実行）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CommandCenter() {
  const [commands, setCommands] = useState<{id: string; instruction: string; status: string; priority: string; assigned_employee: string; assigned_department: string; result: string; error: string; source: string; workflow_id: string; created_at: string; completed_at: string}[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('normal')
  const [assignTo, setAssignTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchCommands() }, [filter])

  const fetchCommands = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/commands${params}`)
      const data = await res.json()
      setCommands(data.commands || [])
    } catch { setCommands([]) }
  }

  const sendCommand = async () => {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)

    const employee = assignTo ? allEmployeesList.find(e => e.name === assignTo) : null
    await fetch('/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: text,
        priority,
        assigned_employee: employee?.name,
        assigned_department: employee?.department,
        source: 'web',
      }),
    })
    setInput('')
    await fetchCommands()
    setLoading(false)
  }

  const deleteCommand = async (id: string) => {
    await fetch(`/api/commands?id=${id}`, { method: 'DELETE' })
    await fetchCommands()
  }

  const priorities = [
    { key: 'urgent', label: '緊急', icon: '🔴', color: '#EF4444' },
    { key: 'high', label: '高', icon: '🟠', color: '#F59E0B' },
    { key: 'normal', label: '通常', icon: '🟢', color: '#22C55E' },
    { key: 'low', label: '低', icon: '⚪', color: '#6B7280' },
  ]

  const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
    pending: { label: '待機中', icon: '⏳', color: '#F59E0B' },
    running: { label: '実行中', icon: '⚡', color: '#3B82F6' },
    completed: { label: '完了', icon: '✅', color: '#22C55E' },
    failed: { label: '失敗', icon: '❌', color: '#EF4444' },
    cancelled: { label: 'キャンセル', icon: '🚫', color: '#6B7280' },
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-orange-300">⚡ 指令センター</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          指示を出す → 5分以内に自動実行 → 結果がここに返ってくる（サーバー+ローカル二重稼働）
        </p>
      </div>

      {/* 指令入力 */}
      <div className="bg-gradient-to-r from-orange-900/20 to-transparent rounded-xl border-2 border-orange-700/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-orange-400">新しい指令</span>
        </div>

        {/* 優先度 */}
        <div className="flex flex-wrap gap-1.5">
          {priorities.map(p => (
            <button key={p.key} onClick={() => setPriority(p.key)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${priority === p.key ? 'text-white' : 'border-gray-700 text-gray-500'}`}
              style={priority === p.key ? { borderColor: p.color, color: p.color, backgroundColor: p.color + '15' } : {}}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* 担当者選択 */}
        <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-700">
          <option value="">自動割当（AIが判断）</option>
          {allEmployeesList.map(e => (
            <option key={e.id} value={e.name}>{e.name}（{e.department}・{e.role.split('（')[0]}）</option>
          ))}
        </select>

        {/* 指示入力 */}
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCommand() } }}
            placeholder="実行したい指示を入力... 例:「今月のSEO記事を3本書いて」「GBP投稿を作って」「競合調査をして」"
            rows={2}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-orange-700 transition" />
          <button onClick={sendCommand} disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 bg-orange-700 hover:bg-orange-600 text-white whitespace-nowrap">
            指令送信
          </button>
        </div>

        <p className="text-[9px] text-gray-600">
          ✅ 自動実行中 — Vercelサーバー(5分毎) + ローカルMac(60秒毎) の二重体制で稼働
        </p>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {['all', 'pending', 'running', 'completed', 'failed'].map(s => {
          const conf = s === 'all' ? { label: 'すべて', icon: '📋', color: '#F97316' } : statusConfig[s]
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filter === s ? 'text-white' : 'border-gray-700 text-gray-500'}`}
              style={filter === s ? { borderColor: conf.color, color: conf.color, backgroundColor: conf.color + '15' } : {}}>
              {conf.icon} {conf.label}
            </button>
          )
        })}
      </div>

      {/* 指令一覧 */}
      <div className="space-y-2">
        {commands.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">まだ指令がありません</p>
            <p className="text-gray-700 text-[10px] mt-1">上のフォームから指示を出してください</p>
          </div>
        )}
        {commands.map(cmd => {
          const st = statusConfig[cmd.status] || statusConfig.pending
          const pri = priorities.find(p => p.key === cmd.priority)
          const date = new Date(cmd.created_at)
          const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          return (
            <div key={cmd.id} className="rounded-xl border p-3 hover:bg-gray-900/50 transition group"
              style={{ borderColor: st.color + '33', backgroundColor: '#0a0f1a' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: st.color + '15', color: st.color, border: `1px solid ${st.color}33` }}>
                      {st.icon} {st.label}
                    </span>
                    {pri && <span className="text-[9px]">{pri.icon}</span>}
                    {cmd.assigned_employee && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        👤 {cmd.assigned_employee}
                      </span>
                    )}
                    {cmd.workflow_id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-800/50">
                        🔄 ワークフロー
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{cmd.instruction}</p>
                  {cmd.result && (
                    <div className="mt-2 p-2 rounded-lg bg-green-900/10 border border-green-800/30">
                      <p className="text-[10px] text-green-400 font-bold mb-0.5">実行結果:</p>
                      <p className="text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed">{cmd.result.substring(0, 500)}</p>
                    </div>
                  )}
                  {cmd.error && (
                    <div className="mt-2 p-2 rounded-lg bg-red-900/10 border border-red-800/30">
                      <p className="text-[10px] text-red-400">{cmd.error}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => deleteCommand(cmd.id)}
                  className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ワークフロービュー（社員連携の自動化フロー）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WorkflowView() {
  const [filterCat, setFilterCat] = useState('all')
  const [activeWorkflows, setActiveWorkflows] = useState<{id: string; name: string; status: string; current_step: number; total_steps: number; created_at: string}[]>([])
  const [launching, setLaunching] = useState<string | null>(null)

  useEffect(() => { fetchActiveWorkflows() }, [])

  const fetchActiveWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows?status=running')
      const data = await res.json()
      setActiveWorkflows(data.workflows || [])
    } catch { setActiveWorkflows([]) }
  }

  const launchWorkflow = async (template: WorkflowTemplate) => {
    setLaunching(template.id)
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          name: template.name,
          steps: template.steps,
          context: { started_from: 'web', started_at: new Date().toISOString() },
        }),
      })
      await fetchActiveWorkflows()
    } catch (err) {
      console.error(err)
    }
    setLaunching(null)
  }

  const filtered = filterCat === 'all' ? workflowTemplates : workflowTemplates.filter(w => w.category === filterCat)

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-purple-300">🔄 ワークフロー</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          複数の社員が連携して自動で仕事を回す定型フロー。ボタン一つで起動。
        </p>
      </div>

      {/* 実行中ワークフロー */}
      {activeWorkflows.length > 0 && (
        <div className="bg-purple-900/10 rounded-xl border border-purple-800/50 p-4 space-y-2">
          <h3 className="text-xs font-bold text-purple-400">⚡ 実行中のワークフロー</h3>
          {activeWorkflows.map(wf => (
            <div key={wf.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/50">
              <div className="flex-1">
                <p className="text-xs text-white">{wf.name}</p>
                <p className="text-[10px] text-gray-500">Step {wf.current_step} / {wf.total_steps}</p>
              </div>
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(wf.current_step / wf.total_steps) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        <button onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === 'all' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-gray-700 text-gray-500'}`}>
          すべて ({workflowTemplates.length})
        </button>
        {Object.entries(workflowCategories).map(([key, cat]) => {
          const count = workflowTemplates.filter(w => w.category === key).length
          if (count === 0) return null
          return (
            <button key={key} onClick={() => setFilterCat(key)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === key ? 'text-white' : 'border-gray-700 text-gray-500'}`}
              style={filterCat === key ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '15' } : {}}>
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ワークフローカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(wf => (
          <div key={wf.id} className="rounded-xl border-2 overflow-hidden"
            style={{ borderColor: wf.color + '44', backgroundColor: '#0a0f1a' }}>
            {/* ヘッダー */}
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{wf.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                    <p className="text-[10px] text-gray-500">{wf.description}</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: wf.color + '15', color: wf.color }}>
                  ⏱ {wf.estimatedTime}
                </span>
              </div>
            </div>

            {/* ステップ一覧 */}
            <div className="px-4 pb-2 space-y-1.5">
              {wf.steps.map((step, i) => {
                const emp = allEmployeesList.find(e => e.name === step.employee)
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-600 font-mono w-4 text-right">{step.order}</span>
                    <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: wf.color + '66' }} />
                    {emp && <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={20} />}
                    <span style={{ color: emp?.color || '#999' }}>{step.employee}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-gray-400 flex-1 truncate">{step.action}</span>
                    {step.autoExecute && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-green-900/30 text-green-500 border border-green-800/50">自動</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 起動ボタン */}
            <div className="p-3 border-t border-gray-800/50">
              <button onClick={() => launchWorkflow(wf)} disabled={launching === wf.id}
                className="w-full py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
                style={{ backgroundColor: wf.color + '20', color: wf.color, border: `1px solid ${wf.color}44` }}>
                {launching === wf.id ? '起動中...' : '▶ ワークフロー起動'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 販売戦略ビュー（アプリ統合・バンドル・価格設計）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalesStrategyView() {
  return (
    <div className="space-y-6 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-emerald-300">💰 販売戦略・アプリ統合計画</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          45プロダクトを5つのバンドルに統合。段階的に統合プラットフォームへ移行。
        </p>
      </div>

      {/* 売上目標サマリー */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-transparent rounded-xl border-2 border-emerald-700/50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-emerald-400">¥89,000</p>
            <p className="text-[10px] text-gray-500">現在MRR</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-400">¥500,000</p>
            <p className="text-[10px] text-gray-500">6ヶ月後目標</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-400">¥1,250,000</p>
            <p className="text-[10px] text-gray-500">12ヶ月後目標</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-400">¥15,000,000</p>
            <p className="text-[10px] text-gray-500">年間売上目標</p>
          </div>
        </div>
      </div>

      {/* ロードマップ */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-bold text-cyan-400 mb-3">📅 統合ロードマップ</h3>
        <div className="space-y-3">
          {[
            { phase: 'Phase 1（現在）', desc: '単品販売5本 + セット割引 + モニター10名', color: '#22C55E', status: '進行中' },
            { phase: 'Phase 2（3ヶ月後）', desc: '治療院OS・集客ダッシュボード・AIアシスタントの統合版リリース', color: '#F59E0B', status: '計画中' },
            { phase: 'Phase 3（6ヶ月後）', desc: '3プラットフォーム体制 + 訪問鍼灸OS + プレミアムプラン', color: '#EF4444', status: '計画中' },
          ].map(p => (
            <div key={p.phase} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: p.color }} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">{p.phase}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: p.color + '15', color: p.color }}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* バンドルカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appBundles.map(bundle => {
          const bundleProducts = products.filter(p => bundle.apps.includes(p.id))
          return (
            <div key={bundle.id} className="rounded-xl border-2 overflow-hidden"
              style={{ borderColor: bundle.color + '44', backgroundColor: '#0a0f1a' }}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{bundle.name}</h3>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: bundle.phase === 'current' ? '#22C55E22' : bundle.phase === 'phase2' ? '#F59E0B22' : '#EF444422',
                          color: bundle.phase === 'current' ? '#22C55E' : bundle.phase === 'phase2' ? '#F59E0B' : '#EF4444' }}>
                        {bundle.phase === 'current' ? '販売中' : bundle.phase === 'phase2' ? 'Phase 2' : 'Phase 3'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{bundle.description}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">対象: {bundle.targetUser}</p>
                  </div>
                </div>

                {/* 含まれるアプリ */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {bundleProducts.map(p => (
                    <span key={p.id} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                      {p.icon} {p.name}
                    </span>
                  ))}
                </div>

                {/* 価格比較 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">単品合計</span>
                    <span className="text-gray-400 line-through">{bundle.currentPrice}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-yellow-500">セット割引</span>
                    <span className="text-yellow-400 font-bold">{bundle.bundlePrice}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: bundle.color }}>統合版（予定）</span>
                    <span style={{ color: bundle.color }} className="font-bold">{bundle.integratedPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 院内自動化ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AutomationView() {
  const freqConfig: Record<string, { label: string; icon: string; color: string }> = {
    daily: { label: '毎日', icon: '🔄', color: '#3B82F6' },
    weekly: { label: '毎週', icon: '📅', color: '#8B5CF6' },
    monthly: { label: '毎月', icon: '📆', color: '#EC4899' },
    'on-demand': { label: '随時', icon: '⚡', color: '#F59E0B' },
  }

  const activeCount = automationTasks.filter(t => t.status === 'active').length
  const dailyCount = automationTasks.filter(t => t.frequency === 'daily').length
  const weeklyCount = automationTasks.filter(t => t.frequency === 'weekly').length

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-blue-300">🤖 自動化ダッシュボード</h2>
        <p className="text-[10px] text-gray-600 mt-1">
          院内業務・コンテンツ作成・集客を自動化。会長の手を離れても回る仕組み。
        </p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 text-center">
          <p className="text-xl font-bold text-green-400">{activeCount}</p>
          <p className="text-[9px] text-gray-500">稼働中</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{dailyCount}</p>
          <p className="text-[9px] text-gray-500">デイリー</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 text-center">
          <p className="text-xl font-bold text-purple-400">{weeklyCount}</p>
          <p className="text-[9px] text-gray-500">ウィークリー</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3 text-center">
          <p className="text-xl font-bold text-cyan-400">{automationTasks.length}</p>
          <p className="text-[9px] text-gray-500">全タスク</p>
        </div>
      </div>

      {/* 自動化タスク一覧 */}
      <div className="space-y-2">
        {automationTasks.map(task => {
          const freq = freqConfig[task.frequency]
          const assignedEmps = task.assignedTo.map(name => allEmployeesList.find(e => e.name === name)).filter(Boolean)
          return (
            <div key={task.id} className="rounded-xl border p-3 hover:bg-gray-900/50 transition"
              style={{ borderColor: task.status === 'active' ? freq.color + '33' : '#333', backgroundColor: '#0a0f1a' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-white">{task.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: freq.color + '15', color: freq.color, border: `1px solid ${freq.color}33` }}>
                      {freq.icon} {freq.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      task.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                      task.status === 'planned' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' :
                      'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {task.status === 'active' ? '✅ 稼働中' : task.status === 'planned' ? '📝 計画中' : '⏸ 一時停止'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-gray-600">{task.department}</span>
                    <div className="flex items-center gap-1">
                      {assignedEmps.map(emp => emp && (
                        <div key={emp.id} className="flex items-center gap-0.5">
                          <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={16} />
                          <span className="text-[8px]" style={{ color: emp.color }}>{emp.name}</span>
                        </div>
                      ))}
                    </div>
                    {task.command && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-500 border border-cyan-800/50 font-mono">
                        {task.command}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// メインページ
export default function VirtualOffice() {
  const [now, setNow] = useState('')
  const [view, setView] = useState<'dashboard' | 'org' | 'products' | 'memos' | 'commands' | 'workflows' | 'sales' | 'automation'>('products')
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
  const aiDepts = departments.filter(d => d.parentDivision === 'ai')
  const mediaDept = departments.find(d => d.id === 'media')
  const contentDepts = departments.filter(d => d.parentDivision === 'content')

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
          <div className="flex items-center gap-1 flex-wrap">
            {([
              { key: 'commands', label: '⚡ 指令', border: 'orange', text: 'orange' },
              { key: 'workflows', label: '🔄 ワークフロー', border: 'purple', text: 'purple' },
              { key: 'products', label: '🎯 制作物', border: 'cyan', text: 'cyan' },
              { key: 'sales', label: '💰 販売戦略', border: 'emerald', text: 'emerald' },
              { key: 'automation', label: '🤖 自動化', border: 'blue', text: 'blue' },
              { key: 'dashboard', label: '📋 部署', border: 'cyan', text: 'cyan' },
              { key: 'org', label: '🏗️ 組織図', border: 'cyan', text: 'cyan' },
              { key: 'memos', label: '👨‍💼 メモ', border: 'yellow', text: 'yellow' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key as typeof view)}
                className={`px-2 py-1.5 text-[10px] rounded-lg border transition ${
                  view === tab.key
                    ? `border-${tab.border}-500 text-${tab.text}-400 bg-${tab.text}-500/10`
                    : 'border-gray-700 text-gray-500'
                }`}
                style={view === tab.key ? {
                  borderColor: tab.border === 'orange' ? '#F97316' : tab.border === 'purple' ? '#A855F7' : tab.border === 'emerald' ? '#10B981' : tab.border === 'blue' ? '#3B82F6' : tab.border === 'yellow' ? '#EAB308' : '#06B6D4',
                  color: tab.border === 'orange' ? '#FB923C' : tab.border === 'purple' ? '#C084FC' : tab.border === 'emerald' ? '#34D399' : tab.border === 'blue' ? '#60A5FA' : tab.border === 'yellow' ? '#FACC15' : '#22D3EE',
                  backgroundColor: (tab.border === 'orange' ? '#F97316' : tab.border === 'purple' ? '#A855F7' : tab.border === 'emerald' ? '#10B981' : tab.border === 'blue' ? '#3B82F6' : tab.border === 'yellow' ? '#EAB308' : '#06B6D4') + '15',
                } : {}}>
                {tab.label}
              </button>
            ))}
            <Link href="/documents"
              className="px-2 py-1.5 text-[10px] rounded-lg border border-gray-700 text-gray-500 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition">
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

        {/* 活動フィード（直近の指令実行状況） */}
        <ActivityFeed />

        {view === 'commands' ? (
          <CommandCenter />
        ) : view === 'workflows' ? (
          <WorkflowView />
        ) : view === 'sales' ? (
          <SalesStrategyView />
        ) : view === 'automation' ? (
          <AutomationView />
        ) : view === 'memos' ? (
          <ChairmanMemos />
        ) : view === 'products' ? (
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

            {/* AI・BtoB部門 */}
            <section>
              <h2 className="text-xs text-cyan-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                🤖 AI・BtoB部門（収益中核）— 年間売上目標 ¥1,500万
              </h2>
              <div className="space-y-4">
                {aiDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>

            {/* LP・制作部門 */}
            <section>
              <h2 className="text-xs text-pink-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
                🎨 LP・制作部門
              </h2>
              <div className="space-y-4">
                {contentDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
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
          大口ヘルスケアグループ バーチャルオフィス v3.0 — AI社員{totalEmployees}名 · {departments.length}部署体制
        </p>
      </footer>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { departments, cloudUsage, allEmployeesList } from './lib/data'
import type { Employee, Department } from './lib/data'
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
  return (
    <span className={`text-xs ${c.color} font-mono`}>
      {c.icon} {c.label}
    </span>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-400 font-mono w-10 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

function EmployeeCard({ emp, onChat }: { emp: Employee; onChat?: (emp: Employee) => void }) {
  return (
    <div
      className="flex items-start gap-3 bg-gray-900/50 rounded-lg p-3 border border-gray-800 cursor-pointer hover:border-cyan-800 hover:bg-gray-900/80 transition-all active:scale-[0.98]"
      onClick={() => onChat?.(emp)}
    >
      <div className="flex-shrink-0 relative">
        <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={56} />
        {/* 名前バッジ */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
          style={{ backgroundColor: emp.color + '33', color: emp.color, border: `1px solid ${emp.color}55` }}
        >
          {emp.name}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm" style={{ color: emp.color }}>
            【{emp.name}】
          </span>
          <StatusBadge status={emp.status} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
        <p className="text-xs text-cyan-400 mt-1 truncate">{emp.currentTask}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {Object.entries(emp.stats).map(([key, val]) => (
            <span key={key} className="text-[10px] text-gray-500">
              <span className="text-gray-600">{key}:</span>{' '}
              <span className="text-green-400 font-mono">{val}</span>
            </span>
          ))}
        </div>
        <div className="mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">
            💬 話しかける
          </span>
        </div>
      </div>
    </div>
  )
}

function DepartmentCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  const [expanded, setExpanded] = useState(dept.id === 'executive')
  const busyCount = dept.employees.filter(e => e.status === 'busy').length
  const workingCount = dept.employees.filter(e => e.status === 'working').length

  return (
    <div
      className="rounded-xl border-2 overflow-hidden transition-all"
      style={{ borderColor: dept.borderColor + '88', backgroundColor: '#0a0f1a' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-900/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dept.icon}</span>
          <div className="text-left">
            <h3 className="font-bold text-sm" style={{ color: dept.color }}>
              {dept.name}
            </h3>
            <p className="text-[10px] text-gray-500">部長: {dept.manager}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {busyCount > 0 && (
            <span className="text-xs text-red-400 font-mono">🔥 {busyCount}</span>
          )}
          {workingCount > 0 && (
            <span className="text-xs text-green-400 font-mono">💻 {workingCount}</span>
          )}
          <span className="text-xs text-gray-600 font-mono">{dept.employees.length}名</span>
          <span className="text-gray-600">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {dept.apps.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {dept.apps.map(app => (
            <span key={app} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {app}
            </span>
          ))}
        </div>
      )}

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

function OrgNode({ name, role, color, status, glow, children: nodeChildren }: {
  name: string; role: string; color: string; status: 'working' | 'busy' | 'idle' | 'meeting'; glow?: boolean; children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative rounded-xl px-4 py-3 text-center border-2 transition-all hover:scale-105 ${glow ? 'shadow-lg' : ''}`}
        style={{
          borderColor: color + '88',
          backgroundColor: color + '15',
          boxShadow: glow ? `0 0 20px ${color}33, 0 0 40px ${color}11` : undefined,
        }}
      >
        <div className="flex justify-center mb-1">
          <PixelCharacter name={name} color={color} status={status} size={48} />
        </div>
        <p className="font-bold text-sm" style={{ color }}>{name}</p>
        <p className="text-[10px] text-gray-400">{role}</p>
      </div>
      {nodeChildren}
    </div>
  )
}

function ConnectorVertical({ color = '#374151', height = 24 }: { color?: string; height?: number }) {
  return (
    <div className="flex justify-center">
      <div style={{ width: 2, height, background: `linear-gradient(to bottom, ${color}, ${color}44)` }} />
    </div>
  )
}

function ConnectorBranch({ color = '#374151' }: { color?: string }) {
  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-md" style={{ height: 20 }}>
        <div className="absolute left-1/4 right-1/4 top-0 border-t-2" style={{ borderColor: color + '66' }} />
        <div className="absolute left-1/4 top-0 w-0.5 h-full" style={{ backgroundColor: color + '66' }} />
        <div className="absolute right-1/4 top-0 w-0.5 h-full" style={{ backgroundColor: color + '66' }} />
      </div>
    </div>
  )
}

function DeptOrgCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  const busyCount = dept.employees.filter(e => e.status === 'busy').length
  const workingCount = dept.employees.filter(e => e.status === 'working').length
  const idleCount = dept.employees.filter(e => e.status === 'idle').length

  return (
    <div
      className="rounded-xl border p-3 hover:scale-[1.02] transition-all cursor-default"
      style={{
        borderColor: dept.borderColor + '66',
        backgroundColor: dept.color + '08',
        boxShadow: `0 0 12px ${dept.color}11`,
      }}
    >
      {/* 部署ヘッダー */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{dept.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: dept.color }}>{dept.name}</p>
          <div className="flex gap-2 mt-0.5">
            {busyCount > 0 && <span className="text-[9px] text-red-400">🔥{busyCount}</span>}
            {workingCount > 0 && <span className="text-[9px] text-green-400">💻{workingCount}</span>}
            {idleCount > 0 && <span className="text-[9px] text-gray-500">💤{idleCount}</span>}
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">{dept.employees.length}名</span>
      </div>

      {/* メンバーのピクセルキャラクター一覧 */}
      <div className="flex flex-wrap gap-1 justify-center">
        {dept.employees.map(emp => (
          <div
            key={emp.id}
            className="flex flex-col items-center group relative cursor-pointer hover:scale-110 transition-transform"
            onClick={() => onChat?.(emp)}
          >
            <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={36} />
            <span className="text-[8px] mt-0.5" style={{ color: emp.color }}>{emp.name}</span>
            {/* ホバーツールチップ */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 shadow-xl whitespace-nowrap">
                <p className="text-[10px] font-bold" style={{ color: emp.color }}>【{emp.name}】{emp.role}</p>
                <p className="text-[9px] text-cyan-400 mt-0.5">{emp.currentTask}</p>
                <p className="text-[9px] text-cyan-600 mt-0.5">💬 タップして話しかける</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 管轄アプリ */}
      {dept.apps.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-2 justify-center">
          {dept.apps.map(app => (
            <span key={app} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-800/50 text-gray-500 border border-gray-800">
              {app}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function OrgChart({ setChatTarget }: { setChatTarget: (emp: Employee) => void }) {
  const cooDepts = departments.filter(d => d.parentDivision === 'coo' && d.id !== 'executive')
  const ctoDepts = departments.filter(d => d.parentDivision === 'cto')
  const cfoDepts = departments.filter(d => d.parentDivision === 'cfo' && d.id !== 'finance')
  const cmoDepts = departments.filter(d => d.parentDivision === 'cmo')
  const financeDept = departments.find(d => d.id === 'finance')

  const divisions = [
    { key: 'coo', name: 'ソラト', role: 'COO（事業執行）', color: '#C0C0C0', icon: '⚡', label: 'COO管轄（事業部門）', depts: cooDepts, status: 'busy' as const },
    { key: 'cto', name: 'テツ', role: '技術統括', color: '#263238', icon: '🔧', label: '技術部門', depts: ctoDepts, status: 'busy' as const },
    { key: 'cfo', name: 'ミサ', role: 'CFO（財務・収益）', color: '#00C853', icon: '💰', label: 'CFO管轄（財務・収益部門）', depts: cfoDepts, status: 'working' as const },
    { key: 'cmo', name: 'マヤ', role: 'マーケ統括', color: '#C62828', icon: '📣', label: 'マーケ・メディア部門', depts: cmoDepts, status: 'busy' as const },
  ]

  const totalEmps = allEmployeesList.length

  return (
    <div className="space-y-3 pb-8">
      {/* タイトル */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-cyan-300">🏢 大口ヘルスケアグループ 組織図</h2>
        <p className="text-[10px] text-gray-600 mt-1">AI社員{totalEmps}名 + 会長 = {totalEmps + 1}名体制 | 9部署</p>
      </div>

      {/* 会長 */}
      <OrgNode name="大口 陽平" role="会長（最高意思決定者）" color="#FFD700" status="busy" glow />
      <ConnectorVertical color="#FFD700" />

      {/* CEO + COO */}
      <div className="flex justify-center gap-4 items-end">
        <OrgNode name="レイア" role="CEO（代表取締役社長）" color="#FFD700" status="busy" glow />
        <div className="flex flex-col items-center">
          <div className="text-[8px] text-yellow-600 mb-1">タッグ</div>
          <div className="w-12 h-0.5 bg-yellow-600/50" />
        </div>
        <OrgNode name="ソラト" role="COO（最高執行責任者）" color="#C0C0C0" status="busy" glow />
      </div>
      <ConnectorVertical color="#FFD700" />

      {/* 財務部 */}
      {financeDept && (
        <div className="flex justify-center">
          <div className="max-w-xs w-full">
            <DeptOrgCard dept={financeDept} onChat={setChatTarget} />
          </div>
        </div>
      )}
      <ConnectorVertical color="#666" />

      {/* 部門分岐 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {divisions.map(div => (
          <div key={div.key} className="text-center">
            <span
              className="text-[10px] bg-gray-900 px-2 py-0.5 rounded-full border inline-block"
              style={{ color: div.color, borderColor: div.color + '44' }}
            >
              {div.icon} {div.label}
            </span>
          </div>
        ))}
      </div>

      {/* 接続線 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {divisions.map(div => (
          <ConnectorVertical key={div.key} color={div.color} height={16} />
        ))}
      </div>

      {/* 部署群 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {divisions.map(div => (
          <div key={div.key} className="space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent" style={{ borderColor: div.color + '44' }} />
              <span
                className="text-[10px] bg-gray-900 px-2 py-0.5 rounded-full border"
                style={{ color: div.color, borderColor: div.color + '44' }}
              >
                {div.icon} {div.label}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent" style={{ borderColor: div.color + '44' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {div.depts.map(dept => (
                <DeptOrgCard key={dept.id} dept={dept} onChat={setChatTarget} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 全社統計 */}
      <div className="mt-6 bg-gradient-to-r from-cyan-900/10 via-purple-900/10 to-cyan-900/10 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-wrap justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-cyan-400">{totalEmps + 1}</p>
            <p className="text-[10px] text-gray-500">総社員数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">9</p>
            <p className="text-[10px] text-gray-500">部署数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">24</p>
            <p className="text-[10px] text-gray-500">稼働アプリ</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{allEmployeesList.filter(e => e.status === 'busy').length}</p>
            <p className="text-[10px] text-gray-500">激忙中</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VirtualOffice() {
  const [now, setNow] = useState('')
  const [view, setView] = useState<'dashboard' | 'org'>('dashboard')
  const [chatTarget, setChatTarget] = useState<Employee | null>(null)

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleString('ja-JP'))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const totalEmployees = allEmployeesList.length
  const busyProjects = allEmployeesList.filter(e => e.status === 'busy').length
  const activeProjects = allEmployeesList.filter(e => e.status === 'working').length
  const totalApps = departments.reduce((sum, d) => sum + d.apps.length, 0)

  const cooDepts = departments.filter(d => d.parentDivision === 'coo' && d.id !== 'executive')
  const ctoDepts = departments.filter(d => d.parentDivision === 'cto')
  const cfoDepts = departments.filter(d => d.parentDivision === 'cfo' && d.id !== 'finance')
  const cmoDepts = departments.filter(d => d.parentDivision === 'cmo')
  const execDept = departments.find(d => d.id === 'executive')
  const financeDept2 = departments.find(d => d.id === 'finance')

  return (
    <div className="min-h-screen bg-[#060b14] text-white font-mono">
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-cyan-400">🏢</span>{' '}
              <span className="text-cyan-300">大口ヘルスケアグループ</span>{' '}
              <span className="text-gray-600">バーチャルオフィス</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              LAST UPDATE: {now} | AI社員{totalEmployees}名体制
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                view === 'dashboard'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              📊 ダッシュボード
            </button>
            <button
              onClick={() => setView('org')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                view === 'org'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              🏗️ 組織図
            </button>
            <button
              onClick={() => setNow(new Date().toLocaleString('ja-JP'))}
              className="px-3 py-1.5 text-xs rounded-lg border border-cyan-800 text-cyan-400 hover:bg-cyan-900/30 transition"
            >
              [ REFRESH ]
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Cloud Usage */}
        <section className="bg-gray-900/50 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-bold text-yellow-400 mb-3">⚡ CLOUD USAGE</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cloudUsage.map(cu => (
              <div key={cu.service} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{cu.service}</span>
                  <span className="text-[10px] text-gray-600">{cu.cost}</span>
                </div>
                <ProgressBar
                  value={cu.used}
                  max={cu.limit}
                  color={cu.used / cu.limit > 0.8 ? '#EF4444' : cu.used / cu.limit > 0.5 ? '#F59E0B' : '#22D3EE'}
                />
                <p className="text-[10px] text-gray-600 text-right">
                  {cu.used} / {cu.limit} {cu.unit}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'AI EMPLOYEES', value: totalEmployees, color: '#22D3EE' },
            { label: 'BUSY', value: busyProjects, color: '#EF4444' },
            { label: 'WORKING', value: activeProjects, color: '#22C55E' },
            { label: 'TOTAL APPS', value: totalApps, color: '#A78BFA' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-1 tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {view === 'dashboard' ? (
          <>
            {/* 会長 */}
            <section className="bg-gradient-to-r from-yellow-900/20 to-transparent rounded-xl border-2 border-yellow-700/50 p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center text-3xl">
                  👨‍💼
                </div>
                <div>
                  <h2 className="text-lg font-bold text-yellow-400">大口 陽平</h2>
                  <p className="text-xs text-yellow-600">会長 — 最高意思決定者</p>
                  <p className="text-xs text-gray-500 mt-1">大口神経整体院 × 晴陽鍼灸院 × AI事業</p>
                </div>
              </div>
            </section>

            {execDept && <DepartmentCard dept={execDept} onChat={setChatTarget} />}
            {financeDept2 && <DepartmentCard dept={financeDept2} onChat={setChatTarget} />}

            <section>
              <h2 className="text-xs text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                ⚡ COO管轄（事業部門）— ソラト
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cooDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>

            <section>
              <h2 className="text-xs text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                🔧 技術部門 — テツ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ctoDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>

            <section>
              <h2 className="text-xs text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                💰 CFO管轄（財務・収益部門）— ミサ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cfoDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>

            <section>
              <h2 className="text-xs text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                📣 マーケ・メディア — マヤ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cmoDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
              </div>
            </section>
          </>
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
          大口ヘルスケアグループ バーチャルオフィス v1.0 — AI社員{totalEmployees}名体制
        </p>
      </footer>
    </div>
  )
}

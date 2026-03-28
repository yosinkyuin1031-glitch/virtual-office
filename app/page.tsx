'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { departments, cloudUsage, allEmployeesList, products, productCategories, workflowTemplates, workflowCategories, appBundles, automationTasks } from './lib/data'
import type { Employee, Department, Product, WorkflowTemplate } from './lib/data'
import PixelCharacter from './components/PixelCharacter'
import ChatModal from './components/ChatModal'
import GoalsEditor from './components/GoalsEditor'
import ContextEditor from './components/ContextEditor'
import AutoTasksPanel from './components/AutoTasksPanel'
import PDCADashboard from './components/PDCADashboard'

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

// 社員カード（暖色テーマ対応）
function EmployeeCard({ emp, onChat }: { emp: Employee; onChat?: (emp: Employee) => void }) {
  const [showSkills, setShowSkills] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden shadow-sm">
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-amber-50/50 transition-all active:scale-[0.99]"
        onClick={() => onChat?.(emp)}
      >
        <div className="flex-shrink-0 relative">
          <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={56} />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
            style={{ backgroundColor: emp.color + '22', color: emp.color, border: `1px solid ${emp.color}44` }}
          >
            {emp.name}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: emp.color }}>{emp.name}</span>
            <StatusBadge status={emp.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
          <p className="text-xs text-amber-700 mt-1 truncate">{emp.currentTask}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              話しかける
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSkills(!showSkills)}
        className="w-full px-3 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50 transition flex items-center justify-center gap-1"
      >
        {showSkills ? '▲ 閉じる' : '▼ できること一覧'}
      </button>

      {showSkills && (
        <div className="px-3 pb-3 space-y-1">
          {emp.skills.map((skill, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] text-amber-500 mt-0.5">●</span>
              <span className="text-[11px] text-gray-500">{skill}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 部署カード（暖色テーマ対応）
function DepartmentCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  const [expanded, setExpanded] = useState(false)
  const busyCount = dept.employees.filter(e => e.status === 'busy').length
  const workingCount = dept.employees.filter(e => e.status === 'working').length

  return (
    <div
      className="rounded-xl border-2 overflow-hidden transition-all bg-white shadow-sm"
      style={{ borderColor: dept.borderColor + '44' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-amber-50/30 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dept.icon}</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: dept.color }}>{dept.name}</h3>
              <p className="text-[10px] text-gray-400">{dept.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {busyCount > 0 && <span className="text-xs text-red-500">🔥{busyCount}</span>}
            {workingCount > 0 && <span className="text-xs text-green-600">💻{workingCount}</span>}
            <span className="text-xs text-gray-400">{dept.employees.length}名</span>
            <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      <div className="px-4 pb-2">
        <p className="text-[10px] text-gray-400 mb-1.5">この部署に頼めること：</p>
        <div className="flex flex-wrap gap-1">
          {dept.canAsk.map((item, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border text-gray-500"
              style={{ borderColor: dept.color + '33', backgroundColor: dept.color + '08' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {dept.apps.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {dept.apps.map(app => (
            <span key={app} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ホーム画面（新規追加）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function HomeView({ setChatTarget, setView }: { setChatTarget: (emp: Employee) => void; setView: (v: ViewType) => void }) {
  const [activities, setActivities] = useState<{id: string; employee_name: string; department: string; action: string; detail: string; created_at: string}[]>([])

  useEffect(() => {
    fetchActivity()
    const timer = setInterval(fetchActivity, 30000)
    return () => clearInterval(timer)
  }, [])

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/activity?limit=8')
      const data = await res.json()
      setActivities(data.activities || [])
    } catch {
      setActivities([])
    }
  }

  const totalEmployees = allEmployeesList.length
  const busyCount = allEmployeesList.filter(e => e.status === 'busy').length

  const quickApps = [
    { name: '顧客管理', icon: '👥', url: 'https://customer-mgmt.vercel.app', color: '#F59E0B' },
    { name: '予約管理', icon: '📅', url: 'https://reservation-app-steel.vercel.app', color: '#3B82F6' },
    { name: 'WEB問診', icon: '📝', url: 'https://web-monshin.vercel.app', color: '#8B5CF6' },
    { name: '検査シート', icon: '🔬', url: 'https://kensa-sheet-app.vercel.app', color: '#10B981' },
    { name: 'MEO勝ち上げくん', icon: '🏆', url: 'https://meo-kachiagekun.vercel.app', color: '#EF4444' },
    { name: 'LINE自動化', icon: '💬', url: 'https://line-automation.vercel.app', color: '#06B6D4' },
    { name: 'ECサイト', icon: '🛒', url: 'https://ec-shop-cyan.vercel.app', color: '#F97316' },
    { name: 'プロジェクト管理', icon: '📋', url: 'https://project-hub-three-chi.vercel.app', color: '#6366F1' },
    { name: '治療家AIマスター', icon: '🧠', url: 'https://ai-master.vercel.app', color: '#EC4899' },
    { name: 'VideoForge', icon: '🎬', url: 'https://video-forge-nu.vercel.app', color: '#14B8A6' },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* A. ヘッダーエリア */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI Solutions</h2>
            <p className="text-sm text-gray-500">会長：大口 陽平</p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              Mission - 「治療院の経営をテクノロジーで変える」
            </p>
          </div>
        </div>
      </div>

      {/* PDCA自動サイクル ダッシュボード */}
      <PDCADashboard />

      {/* B. 目標・KPIカード */}
      <GoalsEditor />

      {/* B2. 自動生成タスク */}
      <AutoTasksPanel />

      {/* C. 事業方針エリア */}
      <ContextEditor />

      {/* C2. よく使うアプリ */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          よく使うアプリ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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

      {/* D. 部署カード（グリッド） */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
            部署一覧
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>{departments.length} 部署</span>
            <span>{totalEmployees} 名</span>
            <span className="text-red-500">{busyCount} 名稼働中</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {departments.map(dept => (
            <DepartmentHomeCard key={dept.id} dept={dept} onChat={setChatTarget} setView={setView} />
          ))}
        </div>
      </div>

      {/* E. 最近の活動フィード */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
          最近の活動
        </h3>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">活動ログがまだありません</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 8).map(a => {
              const emp = allEmployeesList.find(e => e.name === a.employee_name)
              const ago = getTimeAgo(a.created_at)
              return (
                <div key={a.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  {emp ? (
                    <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={22} />
                  ) : (
                    <span className="text-gray-400 text-sm">🤖</span>
                  )}
                  <span className="text-xs font-medium" style={{ color: emp?.color || '#888' }}>{a.employee_name}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500 flex-1 truncate">{a.action}: {a.detail}</span>
                  <span className="text-[10px] text-gray-300 flex-shrink-0">{ago}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ホーム画面用の部署ミニカード
function DepartmentHomeCard({ dept, onChat, setView }: { dept: Department; onChat?: (emp: Employee) => void; setView: (v: ViewType) => void }) {
  const [showApps, setShowApps] = useState(false)
  const busyCount = dept.employees.filter(e => e.status === 'busy').length
  const workingCount = dept.employees.filter(e => e.status === 'working').length
  const manager = dept.employees.find(e => e.role.includes('部長') || e.role.includes('CEO') || e.role.includes('COO') || e.role.includes('CFO'))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dept.icon}</span>
          <div>
            <h4 className="text-sm font-bold" style={{ color: dept.color }}>{dept.name}</h4>
            <p className="text-[10px] text-gray-400">{dept.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {busyCount > 0 && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">🔥{busyCount}</span>}
          {workingCount > 0 && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">💻{workingCount}</span>}
        </div>
      </div>

      {/* マネージャー・メンバー数・最終活動 */}
      <div className="mt-3 flex items-center gap-3">
        {manager && (
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onChat?.(manager)}>
            <PixelCharacter name={manager.name} color={manager.color} status={manager.status} size={24} />
            <span className="text-[10px] font-medium" style={{ color: manager.color }}>{manager.name}</span>
          </div>
        )}
        <span className="text-[10px] text-gray-300">|</span>
        <span className="text-[10px] text-gray-400">{dept.employees.length}名</span>
        {dept.apps.length > 0 && (
          <>
            <span className="text-[10px] text-gray-300">|</span>
            <span className="text-[10px] text-gray-400">{dept.apps.length}アプリ</span>
          </>
        )}
      </div>

      {/* メンバーアバター一覧 */}
      <div className="mt-2 flex items-center gap-1">
        {dept.employees.map(emp => (
          <div
            key={emp.id}
            className="cursor-pointer hover:scale-125 transition-transform relative group"
            onClick={() => onChat?.(emp)}
          >
            <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={22} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                <p className="text-[9px] font-bold" style={{ color: emp.color }}>{emp.name}</p>
                <p className="text-[8px] text-gray-400">{emp.currentTask}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* アプリ展開ボタン */}
      {dept.apps.length > 0 && (
        <>
          <button
            onClick={() => setShowApps(!showApps)}
            className="mt-2 text-[10px] text-gray-400 hover:text-amber-600 transition flex items-center gap-1"
          >
            {showApps ? '▲ アプリを閉じる' : `▼ 管轄アプリ (${dept.apps.length})`}
          </button>
          {showApps && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {dept.apps.map(app => (
                <span key={app} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                  {app}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 組織図ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function OrgNode({ name, role, color, status, glow, onClick }: {
  name: string; role: string; color: string; status: Employee['status']; glow?: boolean; onClick?: () => void
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center border-2 transition-all bg-white ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${glow ? 'shadow-lg' : ''}`}
      style={{
        borderColor: color + '66',
        boxShadow: glow ? `0 4px 20px ${color}22` : undefined,
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

function OrgDeptCard({ dept, onChat }: { dept: Department; onChat?: (emp: Employee) => void }) {
  return (
    <div
      className="rounded-xl border p-3 hover:scale-[1.02] transition-all bg-white shadow-sm"
      style={{ borderColor: dept.borderColor + '44' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{dept.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: dept.color }}>{dept.name}</p>
          <p className="text-[9px] text-gray-400">{dept.description}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">{dept.employees.length}名</span>
      </div>

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
              <div className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-lg whitespace-nowrap">
                <p className="text-[10px] font-bold" style={{ color: emp.color }}>{emp.name}</p>
                <p className="text-[9px] text-gray-400">{emp.role}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">{emp.currentTask}</p>
                <p className="text-[9px] text-amber-500 mt-0.5">タップして話しかける</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-0.5 justify-center">
        {dept.canAsk.slice(0, 3).map((item, i) => (
          <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full text-gray-400"
            style={{ backgroundColor: dept.color + '08', border: `1px solid ${dept.color}18` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

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
        <h2 className="text-lg font-bold text-gray-800">大口ヘルスケアグループ 組織図</h2>
        <p className="text-[10px] text-gray-400 mt-1">AI社員{totalEmps}名 + 会長 = {totalEmps + 1}名体制 | {departments.length}部署</p>
      </div>

      <div className="flex justify-center">
        <OrgNode name="大口 陽平" role="会長（最高意思決定者）" color="#D97706" status="busy" glow />
      </div>
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-amber-300/50" /></div>

      {execDept && (
        <div className="max-w-md mx-auto">
          <OrgDeptCard dept={execDept} onChat={setChatTarget} />
        </div>
      )}
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-gray-300/50" /></div>

      {financeDept && (
        <div className="max-w-xs mx-auto">
          <OrgDeptCard dept={financeDept} onChat={setChatTarget} />
        </div>
      )}
      <div className="flex justify-center"><div className="w-0.5 h-6 bg-gray-300/50" /></div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
                🏢 実業サポート部門
              </span>
            </div>
            {opsDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full border border-cyan-200">
                🤖 AI・BtoB部門（収益中核）
              </span>
            </div>
            {aiDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1 rounded-full border border-pink-200">
                🎨 LP・制作部門
              </span>
            </div>
            {contentDepts.map(dept => (
              <OrgDeptCard key={dept.id} dept={dept} onChat={setChatTarget} />
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-200">
                🎬 全社横断メディア
              </span>
            </div>
            {mediaDept && <OrgDeptCard dept={mediaDept} onChat={setChatTarget} />}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-amber-600">{totalEmps + 1}</p>
            <p className="text-[10px] text-gray-400">総社員数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{departments.length}</p>
            <p className="text-[10px] text-gray-400">部署数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {departments.reduce((sum, d) => sum + d.apps.length, 0)}
            </p>
            <p className="text-[10px] text-gray-400">管轄アプリ</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">¥3,600万</p>
            <p className="text-[10px] text-gray-400">年間売上目標</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 制作物ボードビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProductBoard({ setChatTarget }: { setChatTarget: (emp: Employee) => void }) {
  const [filterCat, setFilterCat] = useState<string>('all')
  const cats = Object.entries(productCategories)
  const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat)
  const activeCount = products.filter(p => p.status === 'active').length
  const devCount = products.filter(p => p.status === 'development').length

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">制作物ボード</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          全{products.length}プロダクト | 稼働中 {activeCount} | 開発中 {devCount} | AI社員{allEmployeesList.length}名が担当
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
            filterCat === 'all' ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-400'
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
                filterCat === key ? 'bg-opacity-20' : 'border-gray-200 text-gray-400'
              }`}
              style={filterCat === key ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '12' } : {}}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} onClickMember={setChatTarget} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product, onClickMember }: { product: Product; onClickMember: (emp: Employee) => void }) {
  const cat = productCategories[product.category]
  const assignedEmployees = allEmployeesList.filter(e => product.assignedTo.includes(e.id))

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md bg-white"
      style={{ borderColor: cat.color + '33' }}
    >
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xl">{product.icon}</span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: product.status === 'active' ? '#22C55E14' : product.status === 'development' ? '#F59E0B14' : '#64748B14',
              color: product.status === 'active' ? '#16A34A' : product.status === 'development' ? '#D97706' : '#64748B',
              border: `1px solid ${product.status === 'active' ? '#22C55E33' : product.status === 'development' ? '#F59E0B33' : '#64748B33'}`,
            }}
          >
            {product.status === 'active' ? '稼働中' : product.status === 'development' ? '開発中' : '計画中'}
          </span>
        </div>
        <h4 className="text-xs font-bold text-gray-800 leading-tight">{product.name}</h4>
        <p className="text-[9px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
      </div>

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
                <div className="bg-white border border-gray-200 rounded px-1.5 py-1 shadow-lg whitespace-nowrap">
                  <p className="text-[9px] font-bold" style={{ color: emp.color }}>{emp.name}</p>
                  <p className="text-[8px] text-gray-400">{emp.role.split('（')[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pb-2 flex items-center justify-between">
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: cat.color + '12', color: cat.color, border: `1px solid ${cat.color}28` }}
        >
          {cat.label}
        </span>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-amber-600 hover:text-amber-800 transition"
            onClick={e => e.stopPropagation()}
          >
            🔗 開く
          </a>
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 会長メモビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ChairmanMemos() {
  const [memos, setMemos] = useState<{ id: string; content: string; category: string; source: string; department_tags: string[]; created_at: string }[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [filterCat, setFilterCat] = useState('all')
  const [loading, setLoading] = useState(false)

  const categories = [
    { key: 'direction', label: '方針・判断', icon: '🧭', color: '#D97706' },
    { key: 'insight', label: '気づき', icon: '💡', color: '#0891B2' },
    { key: 'task', label: 'タスク', icon: '📋', color: '#16A34A' },
    { key: 'feedback', label: 'FB', icon: '📝', color: '#D97706' },
    { key: 'general', label: 'その他', icon: '💬', color: '#7C3AED' },
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
        <h2 className="text-lg font-bold text-gray-800">会長メモ</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          あなたの言葉が全社員の知識になります | LINE返信も自動で反映されます
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-amber-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">👨‍💼</span>
          <span className="text-sm font-bold text-amber-700">大口 陽平</span>
          <span className="text-[10px] text-gray-400">会長</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                category === c.key ? '' : 'border-gray-200 text-gray-400'
              }`}
              style={category === c.key ? { borderColor: c.color, color: c.color, backgroundColor: c.color + '12' } : {}}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMemo() } }}
            placeholder="考えていること、方針、気づき、タスクをメモ..."
            rows={2}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-amber-400 transition"
          />
          <button
            onClick={sendMemo}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 bg-amber-500 hover:bg-amber-600 text-white"
          >
            保存
          </button>
        </div>

        <p className="text-[9px] text-gray-400">
          LINEからも入力可能: 「方針:〇〇」「気づき:〇〇」「タスク:〇〇」と送信すると自動分類されます
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
            filterCat === 'all' ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-400'
          }`}
        >
          すべて
        </button>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition ${
              filterCat === c.key ? '' : 'border-gray-200 text-gray-400'
            }`}
            style={filterCat === c.key ? { borderColor: c.color, color: c.color, backgroundColor: c.color + '12' } : {}}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {memos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">まだメモがありません</p>
            <p className="text-gray-300 text-[10px] mt-1">上のフォームから入力するか、LINEで送信してください</p>
          </div>
        )}
        {memos.map(memo => {
          const cat = categories.find(c => c.key === memo.category) || categories[4]
          const date = new Date(memo.created_at)
          const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          return (
            <div
              key={memo.id}
              className="rounded-xl border p-3 hover:bg-amber-50/30 transition group bg-white shadow-sm"
              style={{ borderColor: cat.color + '22' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color + '12', color: cat.color, border: `1px solid ${cat.color}28` }}
                    >
                      {cat.icon} {cat.label}
                    </span>
                    {memo.source === 'line' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                        LINE
                      </span>
                    )}
                    <span className="text-[9px] text-gray-300">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                  {memo.department_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {memo.department_tags.map(tag => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMemo(memo.id) }}
                  className="text-gray-300 active:text-red-500 hover:text-red-500 text-sm px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100 transition flex-shrink-0"
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
// 活動フィード（ステータスバー用の小さいバージョン）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ActivityFeed() {
  const [activities, setActivities] = useState<{id: string; employee_name: string; department: string; action: string; detail: string; created_at: string}[]>([])
  const [runningCount, setRunningCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchActivity()
    const timer = setInterval(fetchActivity, 15000)
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
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 font-bold">リアルタイム状況</span>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
              {runningCount}件 実行中
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              {pendingCount}件 待機中
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
                <span className="text-gray-400">🤖</span>
              )}
              <span style={{ color: emp?.color || '#888' }}>{a.employee_name}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 flex-1 truncate">{a.action}: {a.detail}</span>
              <span className="text-gray-300 flex-shrink-0">{ago}</span>
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
// 指令センター
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
    { key: 'urgent', label: '緊急', icon: '🔴', color: '#DC2626' },
    { key: 'high', label: '高', icon: '🟠', color: '#D97706' },
    { key: 'normal', label: '通常', icon: '🟢', color: '#16A34A' },
    { key: 'low', label: '低', icon: '⚪', color: '#6B7280' },
  ]

  const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
    pending: { label: '待機中', icon: '⏳', color: '#D97706' },
    running: { label: '実行中', icon: '⚡', color: '#2563EB' },
    completed: { label: '完了', icon: '✅', color: '#16A34A' },
    failed: { label: '失敗', icon: '❌', color: '#DC2626' },
    cancelled: { label: 'キャンセル', icon: '🚫', color: '#6B7280' },
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">指令センター</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          指示を出す → 5分以内に自動実行 → 結果がここに返ってくる
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-orange-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-orange-700">新しい指令</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {priorities.map(p => (
            <button key={p.key} onClick={() => setPriority(p.key)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${priority === p.key ? '' : 'border-gray-200 text-gray-400'}`}
              style={priority === p.key ? { borderColor: p.color, color: p.color, backgroundColor: p.color + '12' } : {}}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:border-orange-400">
          <option value="">自動割当（AIが判断）</option>
          {allEmployeesList.map(e => (
            <option key={e.id} value={e.name}>{e.name}（{e.department}・{e.role.split('（')[0]}）</option>
          ))}
        </select>

        <div className="flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCommand() } }}
            placeholder="実行したい指示を入力..."
            rows={2}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-orange-400 transition" />
          <button onClick={sendCommand} disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
            指令送信
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {['all', 'pending', 'running', 'completed', 'failed'].map(s => {
          const conf = s === 'all' ? { label: 'すべて', icon: '📋', color: '#D97706' } : statusConfig[s]
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filter === s ? '' : 'border-gray-200 text-gray-400'}`}
              style={filter === s ? { borderColor: conf.color, color: conf.color, backgroundColor: conf.color + '12' } : {}}>
              {conf.icon} {conf.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {commands.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">まだ指令がありません</p>
          </div>
        )}
        {commands.map(cmd => {
          const st = statusConfig[cmd.status] || statusConfig.pending
          const pri = priorities.find(p => p.key === cmd.priority)
          const date = new Date(cmd.created_at)
          const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          return (
            <div key={cmd.id} className="rounded-xl border p-3 hover:bg-amber-50/30 transition group bg-white shadow-sm"
              style={{ borderColor: st.color + '22' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: st.color + '12', color: st.color, border: `1px solid ${st.color}28` }}>
                      {st.icon} {st.label}
                    </span>
                    {pri && <span className="text-[9px]">{pri.icon}</span>}
                    {cmd.assigned_employee && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                        {cmd.assigned_employee}
                      </span>
                    )}
                    {cmd.workflow_id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                        ワークフロー
                      </span>
                    )}
                    <span className="text-[9px] text-gray-300">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{cmd.instruction}</p>
                  {cmd.result && (
                    <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-[10px] text-green-700 font-bold mb-0.5">実行結果:</p>
                      <p className="text-[10px] text-gray-500 whitespace-pre-wrap leading-relaxed">{cmd.result.substring(0, 500)}</p>
                    </div>
                  )}
                  {cmd.error && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-[10px] text-red-600">{cmd.error}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => deleteCommand(cmd.id)}
                  className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ワークフロービュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WorkflowView() {
  const [filterCat, setFilterCat] = useState('all')
  const [activeWorkflows, setActiveWorkflows] = useState<{id: string; name: string; status: string; current_step: number; total_steps: number; created_at: string; context?: Record<string, string>}[]>([])
  const [launching, setLaunching] = useState<string | null>(null)
  const [showLaunchModal, setShowLaunchModal] = useState<WorkflowTemplate | null>(null)
  const [launchSubject, setLaunchSubject] = useState('')
  const [launchDetail, setLaunchDetail] = useState('')
  const [launchGoal, setLaunchGoal] = useState('')

  useEffect(() => { fetchActiveWorkflows() }, [])

  const fetchActiveWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows?status=running')
      const data = await res.json()
      setActiveWorkflows(data.workflows || [])
    } catch { setActiveWorkflows([]) }
  }

  const openLaunchModal = (template: WorkflowTemplate) => {
    setShowLaunchModal(template)
    setLaunchSubject('')
    setLaunchDetail('')
    setLaunchGoal('')
  }

  const launchWorkflow = async () => {
    const template = showLaunchModal
    if (!template) return
    setLaunching(template.id)
    setShowLaunchModal(null)
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          name: template.name,
          steps: template.steps,
          context: {
            started_from: 'web',
            started_at: new Date().toISOString(),
            subject: launchSubject.trim(),
            detail: launchDetail.trim(),
            goal: launchGoal.trim(),
          },
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
        <h2 className="text-lg font-bold text-gray-800">ワークフロー</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          複数の社員が連携して自動で仕事を回す定型フロー
        </p>
      </div>

      {activeWorkflows.length > 0 && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-2">
          <h3 className="text-xs font-bold text-purple-700">実行中のワークフロー</h3>
          {activeWorkflows.map(wf => (
            <div key={wf.id} className="p-2 rounded-lg bg-white space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-800">{wf.name}</p>
                  {wf.context?.subject && (
                    <p className="text-[10px] text-purple-600 mt-0.5">{wf.context.subject}</p>
                  )}
                  <p className="text-[10px] text-gray-400">Step {wf.current_step} / {wf.total_steps}</p>
                </div>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${(wf.current_step / wf.total_steps) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 justify-center">
        <button onClick={() => setFilterCat('all')}
          className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === 'all' ? 'border-purple-400 text-purple-700 bg-purple-50' : 'border-gray-200 text-gray-400'}`}>
          すべて ({workflowTemplates.length})
        </button>
        {Object.entries(workflowCategories).map(([key, cat]) => {
          const count = workflowTemplates.filter(w => w.category === key).length
          if (count === 0) return null
          return (
            <button key={key} onClick={() => setFilterCat(key)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === key ? '' : 'border-gray-200 text-gray-400'}`}
              style={filterCat === key ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '12' } : {}}>
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(wf => (
          <div key={wf.id} className="rounded-xl border-2 overflow-hidden bg-white shadow-sm"
            style={{ borderColor: wf.color + '33' }}>
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{wf.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{wf.name}</h3>
                    <p className="text-[10px] text-gray-400">{wf.description}</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: wf.color + '12', color: wf.color }}>
                  {wf.estimatedTime}
                </span>
              </div>
            </div>

            <div className="px-4 pb-2 space-y-1.5">
              {wf.steps.map((step, i) => {
                const emp = allEmployeesList.find(e => e.name === step.employee)
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-300 w-4 text-right">{step.order}</span>
                    <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: wf.color + '44' }} />
                    {emp && <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={20} />}
                    <span style={{ color: emp?.color || '#999' }}>{step.employee}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-gray-500 flex-1 truncate">{step.action}</span>
                    {step.autoExecute && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">自動</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-gray-100">
              <button onClick={() => openLaunchModal(wf)} disabled={launching === wf.id}
                className="w-full py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
                style={{ backgroundColor: wf.color + '14', color: wf.color, border: `1px solid ${wf.color}33` }}>
                {launching === wf.id ? '起動中...' : 'ワークフロー起動'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ワークフロー起動モーダル */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowLaunchModal(null)}>
          <div className="bg-white rounded-2xl border-2 w-full max-w-md overflow-hidden shadow-xl"
            style={{ borderColor: showLaunchModal.color + '44' }}
            onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100" style={{ backgroundColor: showLaunchModal.color + '08' }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{showLaunchModal.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{showLaunchModal.name}</h3>
                  <p className="text-[10px] text-gray-400">{showLaunchModal.description}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] text-gray-500">何について実行するか、具体的に入力してください。</p>

              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                  対象・テーマ <span className="text-red-500">*必須</span>
                </label>
                <input
                  value={launchSubject}
                  onChange={e => setLaunchSubject(e.target.value)}
                  placeholder="例: 春の自律神経ケア、検査アプリの料金プラン提案"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-purple-400 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">補足・背景（任意）</label>
                <textarea
                  value={launchDetail}
                  onChange={e => setLaunchDetail(e.target.value)}
                  placeholder="なぜこれをやるのか、注意点、参考情報など"
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-purple-400 transition resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">期待するゴール（任意）</label>
                <input
                  value={launchGoal}
                  onChange={e => setLaunchGoal(e.target.value)}
                  placeholder="例: 記事を3本公開する、修正してデプロイまで"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-purple-400 transition"
                />
              </div>
            </div>

            <div className="p-4 pt-0 flex gap-2">
              <button onClick={() => setShowLaunchModal(null)}
                className="flex-1 py-2.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition">
                キャンセル
              </button>
              <button onClick={launchWorkflow} disabled={!launchSubject.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold transition disabled:opacity-30"
                style={{ backgroundColor: showLaunchModal.color + '14', color: showLaunchModal.color, border: `1px solid ${showLaunchModal.color}44` }}>
                この内容で起動
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 販売戦略ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalesStrategyView() {
  return (
    <div className="space-y-6 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">販売戦略・アプリ統合計画</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          {products.length}プロダクトを5つのバンドルに統合。段階的に統合プラットフォームへ移行。
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-green-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-green-600">¥89,000</p>
            <p className="text-[10px] text-gray-400">現在MRR</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">¥500,000</p>
            <p className="text-[10px] text-gray-400">6ヶ月後目標</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-600">¥1,250,000</p>
            <p className="text-[10px] text-gray-400">12ヶ月後目標</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">¥15,000,000</p>
            <p className="text-[10px] text-gray-400">年間売上目標</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">統合ロードマップ</h3>
        <div className="space-y-3">
          {[
            { phase: 'Phase 1（現在）', desc: '単品販売5本 + セット割引 + モニター10名', color: '#16A34A', status: '進行中' },
            { phase: 'Phase 2（3ヶ月後）', desc: '治療院OS・集客ダッシュボード・AIアシスタントの統合版リリース', color: '#D97706', status: '計画中' },
            { phase: 'Phase 3（6ヶ月後）', desc: '3プラットフォーム体制 + 訪問鍼灸OS + プレミアムプラン', color: '#DC2626', status: '計画中' },
          ].map(p => (
            <div key={p.phase} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: p.color }} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-700">{p.phase}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: p.color + '12', color: p.color }}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appBundles.map(bundle => {
          const bundleProducts = products.filter(p => bundle.apps.includes(p.id))
          return (
            <div key={bundle.id} className="rounded-xl border-2 overflow-hidden bg-white shadow-sm"
              style={{ borderColor: bundle.color + '33' }}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800">{bundle.name}</h3>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: bundle.phase === 'current' ? '#16A34A14' : bundle.phase === 'phase2' ? '#D9770614' : '#DC262614',
                          color: bundle.phase === 'current' ? '#16A34A' : bundle.phase === 'phase2' ? '#D97706' : '#DC2626' }}>
                        {bundle.phase === 'current' ? '販売中' : bundle.phase === 'phase2' ? 'Phase 2' : 'Phase 3'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{bundle.description}</p>
                    <p className="text-[9px] text-gray-300 mt-0.5">対象: {bundle.targetUser}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {bundleProducts.map(p => (
                    <span key={p.id} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                      {p.icon} {p.name}
                    </span>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">単品合計</span>
                    <span className="text-gray-400 line-through">{bundle.currentPrice}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-600">セット割引</span>
                    <span className="text-amber-700 font-bold">{bundle.bundlePrice}</span>
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
// 自動化ダッシュボード
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AutomationView() {
  const freqConfig: Record<string, { label: string; icon: string; color: string }> = {
    daily: { label: '毎日', icon: '🔄', color: '#2563EB' },
    weekly: { label: '毎週', icon: '📅', color: '#7C3AED' },
    monthly: { label: '毎月', icon: '📆', color: '#DB2777' },
    'on-demand': { label: '随時', icon: '⚡', color: '#D97706' },
  }

  const activeCount = automationTasks.filter(t => t.status === 'active').length
  const dailyCount = automationTasks.filter(t => t.frequency === 'daily').length
  const weeklyCount = automationTasks.filter(t => t.frequency === 'weekly').length

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">自動化ダッシュボード</h2>
        <p className="text-[10px] text-gray-400 mt-1">
          院内業務・コンテンツ作成・集客を自動化。会長の手を離れても回る仕組み。
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '稼働中', value: activeCount, color: '#16A34A' },
          { label: 'デイリー', value: dailyCount, color: '#2563EB' },
          { label: 'ウィークリー', value: weeklyCount, color: '#7C3AED' },
          { label: '全タスク', value: automationTasks.length, color: '#0891B2' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {automationTasks.map(task => {
          const freq = freqConfig[task.frequency]
          const assignedEmps = task.assignedTo.map(name => allEmployeesList.find(e => e.name === name)).filter(Boolean)
          return (
            <div key={task.id} className="rounded-xl border p-3 hover:bg-amber-50/30 transition bg-white shadow-sm"
              style={{ borderColor: task.status === 'active' ? freq.color + '22' : '#e5e7eb' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-700">{task.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: freq.color + '12', color: freq.color, border: `1px solid ${freq.color}28` }}>
                      {freq.icon} {freq.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      task.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' :
                      task.status === 'planned' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-gray-50 text-gray-400 border border-gray-200'
                    }`}>
                      {task.status === 'active' ? '稼働中' : task.status === 'planned' ? '計画中' : '一時停止'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-gray-300">{task.department}</span>
                    <div className="flex items-center gap-1">
                      {assignedEmps.map(emp => emp && (
                        <div key={emp.id} className="flex items-center gap-0.5">
                          <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={16} />
                          <span className="text-[8px]" style={{ color: emp.color }}>{emp.name}</span>
                        </div>
                      ))}
                    </div>
                    {task.command && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タスクビュー（新規追加）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TaskView() {
  const busyEmps = allEmployeesList.filter(e => e.status === 'busy')
  const workingEmps = allEmployeesList.filter(e => e.status === 'working')
  const idleEmps = allEmployeesList.filter(e => e.status === 'idle')

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">タスク状況</h2>
        <p className="text-[10px] text-gray-400 mt-1">全社員の現在のタスクを一覧表示</p>
      </div>

      {/* 激忙中 */}
      {busyEmps.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            激忙中 ({busyEmps.length}名)
          </h3>
          <div className="space-y-2">
            {busyEmps.map(emp => (
              <div key={emp.id} className="bg-white rounded-lg border border-red-100 p-3 flex items-center gap-3 shadow-sm">
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: emp.color }}>{emp.name}</span>
                    <span className="text-[10px] text-gray-400">{emp.department}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">{emp.currentTask}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 作業中 */}
      {workingEmps.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-green-600 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            作業中 ({workingEmps.length}名)
          </h3>
          <div className="space-y-2">
            {workingEmps.map(emp => (
              <div key={emp.id} className="bg-white rounded-lg border border-green-100 p-3 flex items-center gap-3 shadow-sm">
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: emp.color }}>{emp.name}</span>
                    <span className="text-[10px] text-gray-400">{emp.department}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">{emp.currentTask}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 待機中 */}
      {idleEmps.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
            待機中 ({idleEmps.length}名)
          </h3>
          <div className="space-y-2">
            {idleEmps.map(emp => (
              <div key={emp.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                <PixelCharacter name={emp.name} color={emp.color} status={emp.status} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: emp.color }}>{emp.name}</span>
                    <span className="text-[10px] text-gray-400">{emp.department}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{emp.currentTask}</p>
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
// 部署一覧ビュー（旧dashboard）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DepartmentsView({ setChatTarget }: { setChatTarget: (emp: Employee) => void }) {
  const execDept = departments.find(d => d.id === 'executive')
  const financeDept = departments.find(d => d.id === 'finance')
  const opsDepts = departments.filter(d => d.parentDivision === 'operations')
  const aiDepts = departments.filter(d => d.parentDivision === 'ai')
  const mediaDept = departments.find(d => d.id === 'media')
  const contentDepts = departments.filter(d => d.parentDivision === 'content')

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
            👨‍💼
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">大口 陽平</h2>
            <p className="text-xs text-amber-600">会長 — 最高意思決定者</p>
            <p className="text-[10px] text-gray-400 mt-0.5">大口神経整体院 × 晴陽鍼灸院 × AI事業</p>
          </div>
        </div>
      </section>

      {execDept && <DepartmentCard dept={execDept} onChat={setChatTarget} />}
      {financeDept && <DepartmentCard dept={financeDept} onChat={setChatTarget} />}

      <section>
        <h2 className="text-xs text-blue-600 tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          実業サポート部門（整体院・訪問鍼灸）
        </h2>
        <div className="space-y-4">
          {opsDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs text-cyan-600 tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full" />
          AI・BtoB部門（収益中核）
        </h2>
        <div className="space-y-4">
          {aiDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs text-pink-600 tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-pink-500 rounded-full" />
          LP・制作部門
        </h2>
        <div className="space-y-4">
          {contentDepts.map(dept => <DepartmentCard key={dept.id} dept={dept} onChat={setChatTarget} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs text-purple-600 tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full" />
          全社横断メディア
        </h2>
        {mediaDept && <DepartmentCard dept={mediaDept} onChat={setChatTarget} />}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-sm font-bold text-amber-700 mb-3">クラウド使用量</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cloudUsage.map(cu => {
            const pct = Math.min((cu.used / cu.limit) * 100, 100)
            const barColor = pct > 80 ? '#DC2626' : pct > 50 ? '#D97706' : '#0891B2'
            return (
              <div key={cu.service} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{cu.service}</span>
                  <span className="text-[10px] text-gray-400">{cu.cost}</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{Math.round(pct)}%</span>
                </div>
                <p className="text-[10px] text-gray-400 text-right">{cu.used} / {cu.limit} {cu.unit}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ViewType = 'home' | 'departments' | 'employees' | 'tasks' | 'products' | 'memos' | 'commands' | 'workflows' | 'sales' | 'automation' | 'org' | 'documents' | 'settings'

const sidebarItems: { key: ViewType; label: string; icon: string }[] = [
  { key: 'home', label: 'ダッシュボード', icon: '🏠' },
  { key: 'departments', label: '部署一覧', icon: '🏢' },
  { key: 'employees', label: '社員一覧', icon: '👥' },
  { key: 'tasks', label: 'タスク', icon: '📋' },
  { key: 'products', label: '制作物', icon: '📱' },
  { key: 'memos', label: '会長メモ', icon: '📝' },
  { key: 'commands', label: '指令センター', icon: '⚡' },
  { key: 'workflows', label: 'ワークフロー', icon: '🔄' },
  { key: 'sales', label: '販売戦略', icon: '💰' },
  { key: 'automation', label: '自動化', icon: '🤖' },
  { key: 'org', label: '組織図', icon: '🏗️' },
  { key: 'documents', label: '資料', icon: '📄' },
  { key: 'settings', label: '設定', icon: '⚙️' },
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
  const busyCount = allEmployeesList.filter(e => e.status === 'busy').length
  const workingCount = allEmployeesList.filter(e => e.status === 'working').length

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-800 font-sans">
      {/* ヘッダー */}
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ハンバーガーメニュー（モバイル） */}
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

          {/* ステータスバッジ */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {departments.length}部署
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {totalEmployees}名
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">
              {busyCount}名稼働
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 hidden sm:inline-block">
              {workingCount}名作業中
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* サイドバー（デスクトップ：常時表示、モバイル：オーバーレイ） */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
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
              if (item.key === 'documents') {
                return (
                  <Link
                    key={item.key}
                    href="/documents"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-gray-500 hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              }
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
          </nav>

          {/* サイドバー下部にミニ情報 */}
          <div className="mt-6 mx-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-[10px] text-amber-700 font-medium">AI Solutions v4.0</p>
            <p className="text-[9px] text-gray-400 mt-0.5">AI社員{totalEmployees}名 / {departments.length}部署</p>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full">
          {/* ホーム以外は活動フィードを表示 */}
          {view !== 'home' && (
            <div className="mb-4">
              <ActivityFeed />
            </div>
          )}

          {view === 'home' ? (
            <HomeView setChatTarget={setChatTarget} setView={setView} />
          ) : view === 'departments' ? (
            <DepartmentsView setChatTarget={setChatTarget} />
          ) : view === 'employees' ? (
            <div className="space-y-4 pb-8">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">社員一覧</h2>
                <p className="text-[10px] text-gray-400 mt-1">AI社員{totalEmployees}名</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allEmployeesList.map(emp => (
                  <EmployeeCard key={emp.id} emp={emp} onChat={setChatTarget} />
                ))}
              </div>
            </div>
          ) : view === 'tasks' ? (
            <TaskView />
          ) : view === 'commands' ? (
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
          ) : view === 'org' ? (
            <OrgChart setChatTarget={setChatTarget} />
          ) : view === 'settings' ? (
            <div className="space-y-6 pb-8">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">設定</h2>
                <p className="text-[10px] text-gray-400 mt-1">目標・KPI・事業方針をブラウザから編集できます</p>
              </div>
              <GoalsEditor fullPage />
              <ContextEditor fullPage />
            </div>
          ) : null}
        </main>
      </div>

      {/* チャットモーダル */}
      {chatTarget && (
        <ChatModal employee={chatTarget} onClose={() => setChatTarget(null)} />
      )}

      <footer className="border-t border-amber-200/60 bg-white/60 py-4 text-center">
        <p className="text-[10px] text-gray-400">
          AI Solutions v4.0 — AI社員{totalEmployees}名 / {departments.length}部署体制
        </p>
      </footer>
    </div>
  )
}

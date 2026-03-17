// AI社員・部署データ定義

export interface Employee {
  id: number
  name: string
  role: string
  department: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  avatar: string
  currentTask: string
  stats: Record<string, string | number>
}

export interface Department {
  id: string
  name: string
  icon: string
  color: string
  borderColor: string
  manager: string
  apps: string[]
  employees: Employee[]
  parentDivision: 'coo' | 'cto' | 'cfo' | 'cmo'
}

export interface CloudUsage {
  service: string
  used: number
  limit: number
  unit: string
  cost: string
}

// クラウド使用量データ
export const cloudUsage: CloudUsage[] = [
  { service: 'Vercel', used: 24, limit: 200, unit: 'projects', cost: '$20/月 (Pro)' },
  { service: 'Supabase', used: 1.2, limit: 8, unit: 'GB', cost: '¥0 (Free)' },
  { service: 'GitHub', used: 24, limit: 999, unit: 'repos', cost: '¥0 (Free)' },
  { service: 'Claude API', used: 42, limit: 100, unit: '$/month', cost: '$42/月' },
  { service: 'Anthropic Sessions', used: 10, limit: 100, unit: '%', cost: '—' },
  { service: 'Anthropic Weekly', used: 16, limit: 100, unit: '%', cost: '—' },
]

// 全社員データ（統合版：23名）
const allEmployees: Employee[] = [
  // 経営層（3名）
  { id: 1, name: 'レイア', role: 'CEO（代表取締役社長）', department: '経営層', color: '#FFD700', status: 'busy', avatar: '👑', currentTask: '全社戦略の策定・取締役会運営', stats: { '管轄部署': 9, '意思決定': '15件/月', 'KPI達成率': '87%' } },
  { id: 2, name: 'ソラト', role: 'COO（最高執行責任者）', department: '経営層', color: '#C0C0C0', status: 'busy', avatar: '⚡', currentTask: '事業部門の執行管理・売上拡大施策', stats: { '管轄部署': 9, '業務改善': '6件', '効率化': '+23%' } },
  { id: 3, name: 'ミコ', role: '秘書・スケジュール管理', department: '経営層', color: '#CE93D8', status: 'working', avatar: '📋', currentTask: '会長のスケジュール管理・KPIレポート', stats: { 'タスク管理': '48件', '日報': '作成済', 'KPI項目': 32 } },

  // 財務部（1名）
  { id: 4, name: 'ミサ', role: 'CFO（最高財務責任者）', department: '財務部', color: '#00C853', status: 'working', avatar: '💰', currentTask: '月次決算・キャッシュフロー最適化', stats: { '月次PL': '作成済', '削減率': '-12%', '投資管理': '稼働中' } },

  // 整体院事業部（3名）
  { id: 5, name: 'ハル', role: '部長', department: '整体院事業部', color: '#1565C0', status: 'busy', avatar: '🏥', currentTask: '整体院8アプリの運用統括', stats: { '管轄アプリ': 8, '月間予約': '120件', '稼働率': '95%' } },
  { id: 6, name: 'ナギ', role: '予約・顧客担当', department: '整体院事業部', color: '#4FC3F7', status: 'working', avatar: '📅', currentTask: '予約管理・顧客データ整理', stats: { '本日予約': 8, '顧客数': 342, '問診回答': '12件' } },
  { id: 7, name: 'リン', role: '分析・LP担当', department: '整体院事業部', color: '#26A69A', status: 'working', avatar: '📈', currentTask: '睡眠分析レポート・LP最適化', stats: { '分析数': 45, 'LP CVR': '3.2%', '検査数': 28 } },

  // 訪問鍼灸事業部（3名）
  { id: 8, name: 'アキ', role: '部長', department: '訪問鍼灸事業部', color: '#2E7D32', status: 'working', avatar: '🏠', currentTask: '訪問スケジュール最適化', stats: { '管轄アプリ': 4, '訪問数': '45件/月', 'スタッフ': 5 } },
  { id: 9, name: 'ユキ', role: 'レセプト担当', department: '訪問鍼灸事業部', color: '#8BC34A', status: 'working', avatar: '🧾', currentTask: 'レセプト請求処理', stats: { '請求件数': 38, '保険種別': 3, '承認率': '98%' } },
  { id: 10, name: 'サク', role: '営業・SNS担当', department: '訪問鍼灸事業部', color: '#AED581', status: 'busy', avatar: '📱', currentTask: 'Instagram投稿作成・営業リスト更新', stats: { '投稿数': 9, '営業先': 156, 'フォロワー': '—' } },

  // マーケ・コンテンツ部（4名）
  { id: 11, name: 'マヤ', role: '部長', department: 'マーケ・コンテンツ部', color: '#C62828', status: 'busy', avatar: '🎯', currentTask: '広告戦略の策定・ROAS最適化', stats: { '広告費': '¥45,000', 'ROAS': '320%', 'CPA': '¥2,800' } },
  { id: 12, name: 'フミ', role: 'コピーライター・SNS', department: 'マーケ・コンテンツ部', color: '#EF6C00', status: 'busy', avatar: '✍️', currentTask: 'SNS投稿コピー・LINE配信・口コミ返信', stats: { '作成数': 10, 'LINE友達': 280, '開封率': '68%' } },
  { id: 13, name: 'シオ', role: 'SEO・リサーチ', department: 'マーケ・コンテンツ部', color: '#6A1B9A', status: 'busy', avatar: '🔎', currentTask: 'キーワード戦略・SEO記事執筆・競合分析', stats: { '対策KW': 45, '上位率': '32%', '記事数': 8 } },
  { id: 14, name: 'ケイ', role: 'GBP・HeatScope', department: 'マーケ・コンテンツ部', color: '#7E57C2', status: 'working', avatar: '🔄', currentTask: 'GBP投稿作成・HeatScope分析・リライト', stats: { 'GBP投稿': 5, 'PV': '4,200', 'CTR': '2.1%' } },

  // MEO事業部（2名）
  { id: 15, name: 'トモ', role: '部長', department: 'MEO事業部', color: '#5D4037', status: 'working', avatar: '📍', currentTask: 'MEOツール販売戦略', stats: { '管轄ツール': 3, '顧客数': 12, '月額収益': '¥59,000' } },
  { id: 16, name: 'リク', role: '開発・運用', department: 'MEO事業部', color: '#8D6E63', status: 'working', avatar: '⚙️', currentTask: 'MEOチェッカー新機能開発', stats: { 'API稼働': '正常', '新機能': '開発中', '計測回数': '1,200' } },

  // EC事業部（2名）
  { id: 17, name: 'マリ', role: '部長', department: 'EC事業部', color: '#EC407A', status: 'working', avatar: '🛒', currentTask: '商品企画・サブスク管理', stats: { '商品数': 15, 'サブスク': 8, '月商': '¥85,000' } },
  { id: 18, name: 'ユナ', role: '運用担当', department: 'EC事業部', color: '#F06292', status: 'busy', avatar: '📦', currentTask: 'サブスク顧客フォロー・新商品ページ作成', stats: { '本日注文': 3, 'サブスク更新': 5, '新商品': '準備中' } },

  // AI・技術開発部（3名）
  { id: 19, name: 'テツ', role: '部長', department: 'AI・技術開発部', color: '#263238', status: 'busy', avatar: '🤖', currentTask: 'AI製品ロードマップ策定', stats: { '製品数': 3, 'B2B契約': 2, '月額': '¥29,600' } },
  { id: 20, name: 'コウ', role: 'AI開発', department: 'AI・技術開発部', color: '#455A64', status: 'working', avatar: '💻', currentTask: '治療家AIマスター機能改善', stats: { 'APIコール': '2,400/月', 'モデル': 'Sonnet', 'レスポンス': '1.2s' } },
  { id: 21, name: 'タク', role: 'インフラ・サイト運営', department: 'AI・技術開発部', color: '#0D47A1', status: 'busy', avatar: '🖥️', currentTask: 'サイト保守・Vercel/Supabase監視', stats: { 'サイト数': 24, '稼働率': '99.9%', 'Vercel': 24 } },

  // メディア事業部（2名）
  { id: 22, name: 'ツキ', role: '部長', department: 'メディア事業部', color: '#311B92', status: 'working', avatar: '🎬', currentTask: 'YouTube戦略・チャンネル最適化', stats: { '動画数': 168, '登録者': 450, '月間再生': '12,000' } },
  { id: 23, name: 'ルナ', role: '分析・リサーチ', department: 'メディア事業部', color: '#5C6BC0', status: 'working', avatar: '🌙', currentTask: 'サムネ改善・KPI分析・BGMトレンド調査', stats: { 'CTR': '4.2%', '視聴維持': '62%', '目標': '1,000人' } },
]

// 部署データ（統合版：9部署）
export const departments: Department[] = [
  {
    id: 'executive',
    name: '経営層',
    icon: '👑',
    color: '#FFD700',
    borderColor: '#B8860B',
    manager: 'レイア（CEO）',
    apps: [],
    employees: allEmployees.filter(e => e.department === '経営層'),
    parentDivision: 'coo',
  },
  {
    id: 'finance',
    name: '財務部',
    icon: '💰',
    color: '#00C853',
    borderColor: '#00962E',
    manager: 'ミサ（CFO）',
    apps: [],
    employees: allEmployees.filter(e => e.department === '財務部'),
    parentDivision: 'cfo',
  },
  {
    id: 'seitai',
    name: '整体院事業部',
    icon: '🏥',
    color: '#1565C0',
    borderColor: '#0D47A1',
    manager: 'ハル',
    apps: ['顧客管理', '予約管理', 'WEB問診', '検査シート', 'メニュー管理', '高額LP', '睡眠管理', '睡眠チェック'],
    employees: allEmployees.filter(e => e.department === '整体院事業部'),
    parentDivision: 'coo',
  },
  {
    id: 'houmon',
    name: '訪問鍼灸事業部',
    icon: '🏠',
    color: '#2E7D32',
    borderColor: '#1B5E20',
    manager: 'アキ',
    apps: ['スタッフ管理', 'レセプト管理', 'Instagram', '営業管理'],
    employees: allEmployees.filter(e => e.department === '訪問鍼灸事業部'),
    parentDivision: 'coo',
  },
  {
    id: 'marketing',
    name: 'マーケ・コンテンツ部',
    icon: '🎯',
    color: '#C62828',
    borderColor: '#B71C1C',
    manager: 'マヤ',
    apps: ['広告管理', 'LINE自動化', 'HeatScope', 'HPコンテンツ管理'],
    employees: allEmployees.filter(e => e.department === 'マーケ・コンテンツ部'),
    parentDivision: 'cmo',
  },
  {
    id: 'meo',
    name: 'MEO事業部',
    icon: '📍',
    color: '#5D4037',
    borderColor: '#3E2723',
    manager: 'トモ',
    apps: ['MEO自社用', 'MEO配布用', 'MEO勝ち上げくん'],
    employees: allEmployees.filter(e => e.department === 'MEO事業部'),
    parentDivision: 'cfo',
  },
  {
    id: 'ec',
    name: 'EC事業部',
    icon: '🛒',
    color: '#EC407A',
    borderColor: '#C2185B',
    manager: 'マリ',
    apps: ['ECサイト'],
    employees: allEmployees.filter(e => e.department === 'EC事業部'),
    parentDivision: 'cfo',
  },
  {
    id: 'ai_dev',
    name: 'AI・技術開発部',
    icon: '🤖',
    color: '#263238',
    borderColor: '#37474F',
    manager: 'テツ',
    apps: ['治療家AIマスター', '整体院AIツール', 'B2B販売LP', 'クリニックマーク', 'Vercel', 'Supabase', 'GitHub'],
    employees: allEmployees.filter(e => e.department === 'AI・技術開発部'),
    parentDivision: 'cto',
  },
  {
    id: 'media',
    name: 'メディア事業部',
    icon: '🎬',
    color: '#311B92',
    borderColor: '#1A237E',
    manager: 'ツキ',
    apps: ['YouTube月光ヒーリング'],
    employees: allEmployees.filter(e => e.department === 'メディア事業部'),
    parentDivision: 'cmo',
  },
]

export const allEmployeesList = allEmployees

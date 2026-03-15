// AI社員・部署データ定義

export interface Employee {
  id: number
  name: string
  role: string
  department: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  avatar: string // pixel art character identifier
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
  parentDivision: 'coo' | 'cto'
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
  { service: 'Vercel', used: 24, limit: 100, unit: 'projects', cost: '¥0 (Hobby)' },
  { service: 'Supabase', used: 1.2, limit: 8, unit: 'GB', cost: '¥0 (Free)' },
  { service: 'GitHub', used: 24, limit: 999, unit: 'repos', cost: '¥0 (Free)' },
  { service: 'Claude API', used: 42, limit: 100, unit: '$/month', cost: '$42/月' },
  { service: 'Anthropic Sessions', used: 10, limit: 100, unit: '%', cost: '—' },
  { service: 'Anthropic Weekly', used: 16, limit: 100, unit: '%', cost: '—' },
]

// 全社員データ
const allEmployees: Employee[] = [
  // 経営層
  { id: 1, name: 'レイア', role: 'CEO（代表取締役）', department: '経営層', color: '#FFD700', status: 'busy', avatar: '👑', currentTask: '全社戦略の策定・部署間調整', stats: { '管轄部署': 12, '意思決定': '15件/月', 'KPI達成率': '87%' } },
  { id: 2, name: 'ソラト', role: 'COO（最高執行責任者）', department: '経営層', color: '#C0C0C0', status: 'working', avatar: '⚡', currentTask: '事業部門の執行管理', stats: { '管轄部署': 8, '業務改善': '6件', '効率化': '+23%' } },
  { id: 3, name: 'カイト', role: 'CTO（最高技術責任者）', department: '経営層', color: '#1A237E', status: 'busy', avatar: '🔧', currentTask: '技術基盤の統括・インフラ監視', stats: { '管轄部署': 4, 'デプロイ数': 24, '稼働率': '99.8%' } },

  // 秘書室
  { id: 4, name: 'ミコ', role: '秘書室長', department: '秘書室', color: '#CE93D8', status: 'working', avatar: '📋', currentTask: '会長のスケジュール管理', stats: { 'タスク管理': '48件', '日報': '作成済', '次回MTG': '3/16' } },
  { id: 5, name: 'ルカ', role: 'KPI管理', department: '秘書室', color: '#F48FB1', status: 'working', avatar: '📊', currentTask: '月次KPIレポート作成', stats: { 'KPI項目': 32, '達成率': '85%', '更新': '毎日' } },

  // 整体院事業部
  { id: 6, name: 'ハル', role: '部長', department: '整体院事業部', color: '#1565C0', status: 'busy', avatar: '🏥', currentTask: '整体院8アプリの運用統括', stats: { '管轄アプリ': 8, '月間予約': '120件', '稼働率': '95%' } },
  { id: 7, name: 'ナギ', role: '予約・顧客担当', department: '整体院事業部', color: '#4FC3F7', status: 'working', avatar: '📅', currentTask: '予約管理・顧客データ整理', stats: { '本日予約': 8, '顧客数': 342, '問診回答': '12件' } },
  { id: 8, name: 'リン', role: '分析・LP担当', department: '整体院事業部', color: '#26A69A', status: 'working', avatar: '📈', currentTask: '睡眠分析レポート・LP最適化', stats: { '分析数': 45, 'LP CVR': '3.2%', '検査数': 28 } },

  // 訪問鍼灸事業部
  { id: 9, name: 'アキ', role: '部長', department: '訪問鍼灸事業部', color: '#2E7D32', status: 'working', avatar: '🏠', currentTask: '訪問スケジュール最適化', stats: { '管轄アプリ': 4, '訪問数': '45件/月', 'スタッフ': 5 } },
  { id: 10, name: 'ユキ', role: 'レセプト担当', department: '訪問鍼灸事業部', color: '#8BC34A', status: 'working', avatar: '🧾', currentTask: 'レセプト請求処理', stats: { '請求件数': 38, '保険種別': 3, '承認率': '98%' } },
  { id: 11, name: 'サク', role: '営業・SNS担当', department: '訪問鍼灸事業部', color: '#AED581', status: 'busy', avatar: '📱', currentTask: 'Instagram投稿作成・営業リスト更新', stats: { '投稿数': 9, '営業先': 156, 'フォロワー': '—' } },

  // マーケティング部
  { id: 12, name: 'マヤ', role: '部長', department: 'マーケティング部', color: '#C62828', status: 'busy', avatar: '🎯', currentTask: '広告戦略の策定・ROAS最適化', stats: { '広告費': '¥45,000', 'ROAS': '320%', 'CPA': '¥2,800' } },
  { id: 13, name: 'フミ', role: 'コピーライター', department: 'マーケティング部', color: '#EF6C00', status: 'busy', avatar: '✍️', currentTask: 'SNS投稿コピー作成', stats: { '作成数': 10, '保存率': '8.5%', 'いいね平均': 45 } },
  { id: 14, name: 'ノア', role: 'LINE・口コミ担当', department: 'マーケティング部', color: '#FF7043', status: 'working', avatar: '💬', currentTask: 'LINE配信設定・口コミ返信', stats: { 'LINE友達': 280, '開封率': '68%', '返信': '12件' } },
  { id: 15, name: 'スイ', role: '分析担当', department: 'マーケティング部', color: '#FF8A80', status: 'working', avatar: '🔍', currentTask: 'HeatScope分析・広告効果測定', stats: { 'PV': '4,200', 'CTR': '2.1%', '直帰率': '35%' } },

  // SEOコンテンツ部
  { id: 16, name: 'シオ', role: '部長', department: 'SEOコンテンツ部', color: '#6A1B9A', status: 'busy', avatar: '🔎', currentTask: 'キーワード戦略策定', stats: { '対策KW': 45, '上位率': '32%', '記事数': 8 } },
  { id: 17, name: 'アヤ', role: 'ライター', department: 'SEOコンテンツ部', color: '#AB47BC', status: 'busy', avatar: '📝', currentTask: 'SEO記事執筆（差別化5戦略）', stats: { '執筆数': 8, '平均文字数': '8,000', 'FAQ': '30問' } },
  { id: 18, name: 'ケイ', role: 'GBP・リライト', department: 'SEOコンテンツ部', color: '#7E57C2', status: 'working', avatar: '🔄', currentTask: 'GBP投稿作成・既存記事改善', stats: { 'GBP投稿': 5, 'リライト': 3, '改善率': '+18%' } },

  // MEO事業部
  { id: 19, name: 'トモ', role: '部長', department: 'MEO事業部', color: '#5D4037', status: 'working', avatar: '📍', currentTask: 'MEOツール販売戦略', stats: { '管轄ツール': 3, '顧客数': 12, '月額収益': '¥59,000' } },
  { id: 20, name: 'リク', role: '開発・運用', department: 'MEO事業部', color: '#8D6E63', status: 'idle', avatar: '⚙️', currentTask: '保守・モニタリング', stats: { 'API稼働': '正常', 'エラー率': '0.2%', '計測回数': '1,200' } },

  // EC事業部
  { id: 21, name: 'マリ', role: '部長', department: 'EC事業部', color: '#EC407A', status: 'working', avatar: '🛒', currentTask: '商品企画・サブスク管理', stats: { '商品数': 15, 'サブスク': 8, '月商': '¥85,000' } },
  { id: 22, name: 'ユナ', role: '運用担当', department: 'EC事業部', color: '#F06292', status: 'idle', avatar: '📦', currentTask: '受注処理・在庫管理', stats: { '本日注文': 3, '出荷待ち': 1, '在庫': '充足' } },

  // AI・プロダクト開発部
  { id: 23, name: 'テツ', role: '部長', department: 'AI開発部', color: '#263238', status: 'busy', avatar: '🤖', currentTask: 'AI製品ロードマップ策定', stats: { '製品数': 3, 'B2B契約': 2, '月額': '¥29,600' } },
  { id: 24, name: 'コウ', role: 'AI開発', department: 'AI開発部', color: '#455A64', status: 'working', avatar: '💻', currentTask: '治療家AIマスター機能改善', stats: { 'APIコール': '2,400/月', 'モデル': 'Sonnet', 'レスポンス': '1.2s' } },
  { id: 25, name: 'レナ', role: '販売担当', department: 'AI開発部', color: '#78909C', status: 'working', avatar: '💼', currentTask: 'ClinicDX営業資料作成', stats: { 'リード数': 8, '商談': 3, '成約率': '25%' } },

  // メディア事業部
  { id: 26, name: 'ツキ', role: '部長', department: 'メディア事業部', color: '#311B92', status: 'working', avatar: '🎬', currentTask: 'YouTube戦略・チャンネル最適化', stats: { '動画数': 168, '登録者': 450, '月間再生': '12,000' } },
  { id: 27, name: 'ヒカ', role: '音楽リサーチ', department: 'メディア事業部', color: '#3949AB', status: 'idle', avatar: '🎵', currentTask: '競合分析・楽曲トレンド調査', stats: { '分析ch': 15, 'トレンド': '更新済', '提案': 3 } },
  { id: 28, name: 'ルナ', role: '成長分析', department: 'メディア事業部', color: '#5C6BC0', status: 'working', avatar: '🌙', currentTask: 'サムネ改善・KPI分析', stats: { 'CTR': '4.2%', '視聴維持': '62%', '目標': '1,000人' } },

  // リサーチ部
  { id: 29, name: 'ジン', role: '部長', department: 'リサーチ部', color: '#1B5E20', status: 'working', avatar: '🔬', currentTask: 'リサーチ統括・レポート作成', stats: { '調査数': 12, 'レポート': 5, '更新頻度': '週次' } },
  { id: 30, name: 'モモ', role: '競合分析', department: 'リサーチ部', color: '#388E3C', status: 'working', avatar: '🏪', currentTask: '競合院調査（大阪エリア）', stats: { '分析院数': 25, 'エリア': '大阪', '更新': '3/14' } },
  { id: 31, name: 'セナ', role: '市場分析', department: 'リサーチ部', color: '#66BB6A', status: 'idle', avatar: '🌐', currentTask: '業界トレンド調査', stats: { '市場規模': '調査中', 'トレンド': 8, 'レポート': 3 } },

  // サイト運営部
  { id: 32, name: 'タク', role: '部長', department: 'サイト運営部', color: '#0D47A1', status: 'busy', avatar: '🖥️', currentTask: 'サイト保守・デプロイ統括', stats: { 'サイト数': 24, '稼働率': '99.9%', 'デプロイ': '3/15' } },
  { id: 33, name: 'ユウ', role: 'インフラ担当', department: 'サイト運営部', color: '#1976D2', status: 'working', avatar: '🔌', currentTask: 'Vercel/Supabase監視', stats: { 'Vercel': 24, 'Supabase': '1.2GB', 'GitHub': 24 } },
]

// 部署データ
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
    id: 'secretary',
    name: '秘書室',
    icon: '📋',
    color: '#CE93D8',
    borderColor: '#AB47BC',
    manager: 'ミコ',
    apps: [],
    employees: allEmployees.filter(e => e.department === '秘書室'),
    parentDivision: 'coo',
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
    name: 'マーケティング部',
    icon: '🎯',
    color: '#C62828',
    borderColor: '#B71C1C',
    manager: 'マヤ',
    apps: ['広告管理', 'LINE自動化', 'HeatScope'],
    employees: allEmployees.filter(e => e.department === 'マーケティング部'),
    parentDivision: 'coo',
  },
  {
    id: 'seo',
    name: 'SEOコンテンツ部',
    icon: '🔎',
    color: '#6A1B9A',
    borderColor: '#4A148C',
    manager: 'シオ',
    apps: ['HPコンテンツ管理'],
    employees: allEmployees.filter(e => e.department === 'SEOコンテンツ部'),
    parentDivision: 'coo',
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
    parentDivision: 'cto',
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
    parentDivision: 'coo',
  },
  {
    id: 'ai_dev',
    name: 'AI開発部',
    icon: '🤖',
    color: '#263238',
    borderColor: '#37474F',
    manager: 'テツ',
    apps: ['治療家AIマスター', '整体院AIツール', 'B2B販売LP'],
    employees: allEmployees.filter(e => e.department === 'AI開発部'),
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
    parentDivision: 'coo',
  },
  {
    id: 'research',
    name: 'リサーチ部',
    icon: '🔬',
    color: '#1B5E20',
    borderColor: '#0D3B12',
    manager: 'ジン',
    apps: [],
    employees: allEmployees.filter(e => e.department === 'リサーチ部'),
    parentDivision: 'coo',
  },
  {
    id: 'site_ops',
    name: 'サイト運営部',
    icon: '🖥️',
    color: '#0D47A1',
    borderColor: '#0A3170',
    manager: 'タク',
    apps: ['クリニックマーク', 'Vercel', 'Supabase', 'GitHub'],
    employees: allEmployees.filter(e => e.department === 'サイト運営部'),
    parentDivision: 'cto',
  },
]

export const allEmployeesList = allEmployees

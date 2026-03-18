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
  skills: string[]
  stats: Record<string, string | number>
}

export interface Department {
  id: string
  name: string
  icon: string
  color: string
  borderColor: string
  manager: string
  description: string
  canAsk: string[]
  apps: string[]
  employees: Employee[]
  parentDivision: 'executive' | 'operations' | 'ai' | 'media'
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

// 全社員データ（確定版：16名・6部署）
const allEmployees: Employee[] = [
  // 経営層（3名）
  {
    id: 1, name: 'レイア', role: 'CEO（全社戦略・壁打ち参謀）', department: '経営層',
    color: '#FFD700', status: 'busy', avatar: '👑',
    currentTask: '1,500万戦略の進捗管理・事業判断サポート',
    skills: ['事業戦略の立案・壁打ち', 'KPI進捗の整理・報告', '新規事業の判断材料作成', '全社課題の洗い出し', '投資判断のサポート'],
    stats: { '管轄部署': 6, '戦略立案': '稼働中', 'KPI達成率': '87%' },
  },
  {
    id: 2, name: 'ソラト', role: 'COO（執行管理・進捗チェック）', department: '経営層',
    color: '#C0C0C0', status: 'busy', avatar: '⚡',
    currentTask: '各部署の執行状況トラッキング',
    skills: ['各部署の進捗確認・報告', '業務フローの改善提案', 'タスクの優先順位づけ', '部署間の連携調整', '週次レポート作成'],
    stats: { '管轄部署': 6, '業務改善': '6件', '効率化': '+23%' },
  },
  {
    id: 3, name: 'ミコ', role: '秘書（スケジュール・タスク整理）', department: '経営層',
    color: '#CE93D8', status: 'working', avatar: '📋',
    currentTask: '会長の日次タスク整理・優先順位管理',
    skills: ['今日のタスク整理', 'スケジュール提案・調整', '議事録・メモ作成', '日報・週報の作成', 'やることの言語化・整理'],
    stats: { 'タスク管理': '48件', '日報': '作成済', 'スケジュール': '管理中' },
  },

  // 財務部（1名）
  {
    id: 4, name: 'ミサ', role: 'CFO（決済・キャッシュフロー・請求書・投資）', department: '財務部',
    color: '#00C853', status: 'working', avatar: '💰',
    currentTask: 'Stripe本番化準備・月次キャッシュフロー管理',
    skills: ['月次収支の整理・PL作成', 'キャッシュフロー予測', '請求書・領収書の管理', 'Stripe決済の管理', '投資判断の数値整理', 'コスト削減の提案'],
    stats: { '月次PL': '作成済', '請求管理': '稼働中', '投資管理': '稼働中' },
  },

  // 整体院事業部（3名）
  {
    id: 5, name: 'ハル', role: '部長（マーケ・MEO・集客戦略）', department: '整体院事業部',
    color: '#1565C0', status: 'busy', avatar: '🏥',
    currentTask: 'MEO対策・GBP投稿・広告運用・集客戦略',
    skills: ['GBP投稿文の作成', 'MEO対策・順位改善', '広告運用・ROAS改善', '集客戦略の立案', '競合分析', 'SEOキーワード提案'],
    stats: { 'MEO順位': '3位', 'GBP投稿': '週2本', '広告ROAS': '320%' },
  },
  {
    id: 6, name: 'ナギ', role: 'アプリ管理（予約・顧客・問診・検査・物販）', department: '整体院事業部',
    color: '#4FC3F7', status: 'working', avatar: '📅',
    currentTask: '予約管理・顧客データ整理・物販管理',
    skills: ['予約状況の確認・整理', '顧客データの分析', 'リピート率の改善提案', '物販商品の管理', 'アプリの使い方サポート'],
    stats: { '管轄アプリ': 8, '顧客数': 342, '物販商品': 15 },
  },
  {
    id: 7, name: 'フミ', role: 'SNS・LINE・コピーライティング', department: '整体院事業部',
    color: '#EF6C00', status: 'busy', avatar: '✍️',
    currentTask: 'SNS投稿・LINE配信・口コミ返信・SEO記事',
    skills: ['Instagram投稿文の作成', 'LINE配信の文面作成', '口コミ返信の代筆', 'SEO記事の執筆', 'LP・広告のコピー作成', 'キャンペーン文の作成'],
    stats: { 'LINE友達': 280, '開封率': '68%', 'SNS投稿': '週3本' },
  },

  // 訪問鍼灸事業部（3名）
  {
    id: 8, name: 'アキ', role: '部長（マーケ・MEO・営業戦略）', department: '訪問鍼灸事業部',
    color: '#2E7D32', status: 'working', avatar: '🏠',
    currentTask: 'MEO対策・ケアマネ営業・集客戦略',
    skills: ['ケアマネ向け営業資料の作成', 'MEO対策・GBP投稿', '営業戦略の立案', '訪問エリアの分析', '集客チャネルの提案'],
    stats: { '訪問数': '45件/月', 'スタッフ': 5, '営業先': 156 },
  },
  {
    id: 9, name: 'ユキ', role: 'アプリ管理（スタッフ・レセプト・営業管理）', department: '訪問鍼灸事業部',
    color: '#8BC34A', status: 'working', avatar: '🧾',
    currentTask: 'レセプト請求・スタッフ管理・物販管理',
    skills: ['レセプト請求の整理', 'スタッフシフトの管理', '営業リストの管理', '物販の管理', 'アプリの使い方サポート'],
    stats: { '請求件数': 38, '承認率': '98%', '管轄アプリ': 4 },
  },
  {
    id: 10, name: 'サク', role: 'SNS・Instagram・営業リスト', department: '訪問鍼灸事業部',
    color: '#AED581', status: 'busy', avatar: '📱',
    currentTask: 'Instagram投稿・営業リスト更新・ケアマネ向け資料',
    skills: ['Instagram投稿文の作成', '営業リストの作成・更新', 'ケアマネ向け資料作成', 'SNS投稿のネタ出し', 'チラシ・POPの文面作成'],
    stats: { '投稿数': '週3本', '営業先': 156, 'フォロワー': '—' },
  },

  // AI開発部（4名）★収益の中核
  {
    id: 11, name: 'テツ', role: '部長（AI製品ロードマップ・BtoB戦略）', department: 'AI開発部',
    color: '#263238', status: 'busy', avatar: '🤖',
    currentTask: 'BtoB SaaS販売戦略・検査アプリクラウド化計画',
    skills: ['BtoB営業資料の作成', 'AI製品のロードマップ策定', '料金プランの設計', '競合SaaSの分析', '導入提案書の作成', 'Facebook投稿文の作成'],
    stats: { '製品数': 5, 'BtoB契約': 2, '月額収益': '¥89,000' },
  },
  {
    id: 12, name: 'コウ', role: 'AI開発（治療家AIマスター・整体院AIツール）', department: 'AI開発部',
    color: '#455A64', status: 'working', avatar: '💻',
    currentTask: '治療家AIマスター機能改善・BtoB販売LP',
    skills: ['AI製品の機能改善', 'プロンプト設計・最適化', 'API連携の開発', 'LP・サイトの改修', 'バグ修正・品質改善'],
    stats: { 'AI製品': 2, 'APIコール': '2,400/月', 'レスポンス': '1.2s' },
  },
  {
    id: 13, name: 'リク', role: 'SaaS開発（MEOツール・検査アプリ）', department: 'AI開発部',
    color: '#8D6E63', status: 'working', avatar: '⚙️',
    currentTask: 'MEO勝ち上げくん改善・検査アプリクラウド化',
    skills: ['MEOツールの開発・改善', '検査アプリのクラウド化', 'SaaS機能の追加開発', 'マルチテナント対応', 'Stripe課金実装'],
    stats: { 'MEOツール': 3, '顧客数': 12, '新機能': '開発中' },
  },
  {
    id: 14, name: 'タク', role: 'インフラ（Vercel/Supabase/GitHub・全サイト保守）', department: 'AI開発部',
    color: '#0D47A1', status: 'busy', avatar: '🖥️',
    currentTask: '全24サイト保守・デプロイ管理・監視',
    skills: ['サイトの稼働監視', 'デプロイ・ビルド管理', 'Supabaseのデータ管理', 'ドメイン・SSL管理', 'エラー調査・復旧'],
    stats: { 'サイト数': 24, '稼働率': '99.9%', 'Vercel': 24 },
  },

  // メディア部（2名）
  {
    id: 15, name: 'ツキ', role: '部長（YouTube戦略・動画企画・チャンネル運営）', department: 'メディア部',
    color: '#311B92', status: 'working', avatar: '🎬',
    currentTask: 'YouTube月光ヒーリング運営・チャンネル成長戦略',
    skills: ['YouTube動画のタイトル・説明文作成', '動画テーマの企画', 'チャンネル成長戦略', '投稿スケジュール管理', 'アフィリエイト戦略'],
    stats: { '動画数': 168, '登録者': 450, '月間再生': '12,000' },
  },
  {
    id: 16, name: 'ルナ', role: 'コンテンツ生成・サムネ・分析', department: 'メディア部',
    color: '#5C6BC0', status: 'working', avatar: '🌙',
    currentTask: 'サムネ改善・BGMトレンド・各部署コンテンツ支援',
    skills: ['サムネイル改善案の提案', 'BGM・トレンド調査', '再生数・CTRの分析', '各部署向けコンテンツ作成', '文章・キャッチコピー生成'],
    stats: { 'CTR': '4.2%', '視聴維持': '62%', 'コンテンツ支援': '全社' },
  },
]

// 部署データ（確定版：6部署）
export const departments: Department[] = [
  {
    id: 'executive',
    name: '経営層',
    icon: '👑',
    color: '#FFD700',
    borderColor: '#B8860B',
    manager: 'レイア（CEO）',
    description: '全社の戦略立案・執行管理・スケジュール管理を担当',
    canAsk: ['事業戦略の相談・壁打ち', '今日やるべきことの整理', 'KPI進捗の確認', '各部署の状況チェック', 'スケジュール・計画の提案'],
    apps: [],
    employees: allEmployees.filter(e => e.department === '経営層'),
    parentDivision: 'executive',
  },
  {
    id: 'finance',
    name: '財務部',
    icon: '💰',
    color: '#00C853',
    borderColor: '#00962E',
    manager: 'ミサ（CFO）',
    description: '決済・キャッシュフロー・請求書/領収書・投資を一元管理',
    canAsk: ['月次の収支整理', 'Stripe決済の管理', '請求書・領収書の整理', 'コスト削減の提案', '投資判断の数値整理'],
    apps: ['Stripe管理', '請求書管理', '月次PL'],
    employees: allEmployees.filter(e => e.department === '財務部'),
    parentDivision: 'executive',
  },
  {
    id: 'seitai',
    name: '整体院事業部',
    icon: '🏥',
    color: '#1565C0',
    borderColor: '#0D47A1',
    manager: 'ハル',
    description: '大口神経整体院のマーケティング・集客・アプリ管理・SNS運用',
    canAsk: ['GBP投稿文の作成', 'Instagram・SNS投稿の作成', 'LINE配信文の作成', '口コミ返信の代筆', 'SEO記事の作成', '広告・集客の相談'],
    apps: ['顧客管理', '予約管理', 'WEB問診', '検査シート', 'メニュー管理', '高額LP', '睡眠管理', '睡眠チェック', 'ECサイト', '広告管理', 'LINE自動化', 'HeatScope', 'HPコンテンツ管理'],
    employees: allEmployees.filter(e => e.department === '整体院事業部'),
    parentDivision: 'operations',
  },
  {
    id: 'houmon',
    name: '訪問鍼灸事業部',
    icon: '🏠',
    color: '#2E7D32',
    borderColor: '#1B5E20',
    manager: 'アキ',
    description: '晴陽鍼灸院のマーケティング・営業・アプリ管理・SNS運用',
    canAsk: ['ケアマネ向け営業資料の作成', 'Instagram投稿の作成', 'MEO・GBP投稿の作成', '営業リストの整理', '営業戦略の相談'],
    apps: ['スタッフ管理', 'レセプト管理', 'Instagram', '営業管理'],
    employees: allEmployees.filter(e => e.department === '訪問鍼灸事業部'),
    parentDivision: 'operations',
  },
  {
    id: 'ai_dev',
    name: 'AI開発部',
    icon: '🤖',
    color: '#263238',
    borderColor: '#37474F',
    manager: 'テツ',
    description: 'AI会社の収益中核。BtoB SaaS・AI製品の開発・販売・インフラ管理',
    canAsk: ['BtoB営業資料の作成', '製品ロードマップの相談', 'AI機能の改善提案', 'サイトの稼働状況確認', '新規SaaSの企画相談'],
    apps: ['治療家AIマスター', '整体院AIツール', 'BtoB販売LP', 'クリニックマーク', 'MEO勝ち上げくん', 'MEO配布用', 'MEO自社用', '検査アプリ（クラウド版）', 'Vercel', 'Supabase', 'GitHub'],
    employees: allEmployees.filter(e => e.department === 'AI開発部'),
    parentDivision: 'ai',
  },
  {
    id: 'media',
    name: 'メディア部',
    icon: '🎬',
    color: '#311B92',
    borderColor: '#1A237E',
    manager: 'ツキ',
    description: 'YouTube運営・コンテンツ生成で全社を横断支援',
    canAsk: ['YouTube動画のタイトル・説明文', '動画テーマの企画', 'サムネイル改善案', '文章・キャッチコピーの生成', 'トレンド調査'],
    apps: ['YouTube月光ヒーリング'],
    employees: allEmployees.filter(e => e.department === 'メディア部'),
    parentDivision: 'media',
  },
]

export const allEmployeesList = allEmployees

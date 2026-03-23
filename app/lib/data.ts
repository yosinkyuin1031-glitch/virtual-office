// AI社員・部署・プロダクトデータ定義

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
  parentDivision: 'executive' | 'operations' | 'ai' | 'media' | 'finance' | 'content'
}

export interface Product {
  id: string
  name: string
  url?: string
  category: 'clinic-app' | 'houmon-app' | 'ai-saas' | 'marketing' | 'media' | 'lp' | 'content' | 'tool'
  status: 'active' | 'development' | 'planned'
  assignedTo: number[] // employee IDs
  description: string
  icon: string
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
  { service: 'Vercel', used: 30, limit: 200, unit: 'projects', cost: '$20/月 (Pro)' },
  { service: 'Supabase', used: 1.5, limit: 8, unit: 'GB', cost: '¥0 (Free)' },
  { service: 'GitHub', used: 30, limit: 999, unit: 'repos', cost: '¥0 (Free)' },
  { service: 'Claude API', used: 42, limit: 100, unit: '$/month', cost: '$42/月' },
  { service: 'Anthropic Sessions', used: 10, limit: 100, unit: '%', cost: '—' },
  { service: 'Anthropic Weekly', used: 16, limit: 100, unit: '%', cost: '—' },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全社員データ（拡張版：24名・8部署）
// 各々が課題を解決できるプロの役割を持った集団
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const allEmployees: Employee[] = [
  // ── 経営層（3名） ──
  {
    id: 1, name: 'レイア', role: 'CEO（全社戦略・壁打ち参謀）', department: '経営層',
    color: '#FFD700', status: 'busy', avatar: '👑',
    currentTask: '年商2,500万戦略の進捗管理・事業判断サポート',
    skills: ['事業戦略の立案・壁打ち', 'KPI進捗の整理・報告', '新規事業の判断材料作成', '全社課題の洗い出し', '投資判断のサポート'],
    stats: { '管轄部署': 8, '戦略立案': '稼働中', 'KPI達成率': '87%' },
  },
  {
    id: 2, name: 'ソラト', role: 'COO（執行管理・進捗チェック）', department: '経営層',
    color: '#C0C0C0', status: 'busy', avatar: '⚡',
    currentTask: '各部署の執行状況トラッキング',
    skills: ['各部署の進捗確認・報告', '業務フローの改善提案', 'タスクの優先順位づけ', '部署間の連携調整', '週次レポート作成'],
    stats: { '管轄部署': 8, '業務改善': '6件', '効率化': '+23%' },
  },
  {
    id: 3, name: 'ミコ', role: '秘書（スケジュール・タスク整理）', department: '経営層',
    color: '#CE93D8', status: 'working', avatar: '📋',
    currentTask: '会長の日次タスク整理・優先順位管理',
    skills: ['今日のタスク整理', 'スケジュール提案・調整', '議事録・メモ作成', '日報・週報の作成', 'やることの言語化・整理'],
    stats: { 'タスク管理': '48件', '日報': '作成済', 'スケジュール': '管理中' },
  },

  // ── 財務部（1名） ──
  {
    id: 4, name: 'ミサ', role: 'CFO（決済・キャッシュフロー・請求書・投資）', department: '財務部',
    color: '#00C853', status: 'working', avatar: '💰',
    currentTask: 'Stripe本番化準備・月次キャッシュフロー管理',
    skills: ['月次収支の整理・PL作成', 'キャッシュフロー予測', '請求書・領収書の管理', 'Stripe決済の管理', '投資判断の数値整理', 'コスト削減の提案'],
    stats: { '月次PL': '作成済', '請求管理': '稼働中', '投資管理': '稼働中' },
  },

  // ── 整体院事業部（3名） ──
  {
    id: 5, name: 'ハル', role: '部長（MEO・広告・集客戦略のプロ）', department: '整体院事業部',
    color: '#1565C0', status: 'busy', avatar: '🏥',
    currentTask: 'MEO対策・GBP投稿・広告運用・集客戦略',
    skills: ['GBP投稿文の作成', 'MEO対策・順位改善', '広告運用・ROAS改善', '集客戦略の立案', '競合分析', 'SEOキーワード提案'],
    stats: { 'MEO順位': '3位', 'GBP投稿': '週2本', '広告ROAS': '320%' },
  },
  {
    id: 6, name: 'ナギ', role: 'アプリ管理のプロ（予約・顧客・問診・検査・物販）', department: '整体院事業部',
    color: '#4FC3F7', status: 'working', avatar: '📅',
    currentTask: '予約管理・顧客データ整理・物販管理',
    skills: ['予約状況の確認・整理', '顧客データの分析', 'リピート率の改善提案', '物販商品の管理', 'アプリの使い方サポート'],
    stats: { '管轄アプリ': 10, '顧客数': 342, '物販商品': 15 },
  },
  {
    id: 7, name: 'フミ', role: 'コピーライティングのプロ（SNS・LINE・LP文章）', department: '整体院事業部',
    color: '#EF6C00', status: 'busy', avatar: '✍️',
    currentTask: 'SNS投稿・LINE配信・口コミ返信・SEO記事',
    skills: ['Instagram投稿文の作成', 'LINE配信の文面作成', '口コミ返信の代筆', 'SEO記事の執筆', 'LP・広告のコピー作成', 'キャンペーン文の作成'],
    stats: { 'LINE友達': 280, '開封率': '68%', 'SNS投稿': '週3本' },
  },

  // ── 訪問鍼灸事業部（3名） ──
  {
    id: 8, name: 'アキ', role: '部長（訪問営業・ケアマネ攻略のプロ）', department: '訪問鍼灸事業部',
    color: '#2E7D32', status: 'working', avatar: '🏠',
    currentTask: 'MEO対策・ケアマネ営業・集客戦略',
    skills: ['ケアマネ向け営業資料の作成', 'MEO対策・GBP投稿', '営業戦略の立案', '訪問エリアの分析', '集客チャネルの提案'],
    stats: { '訪問数': '45件/月', 'スタッフ': 5, '営業先': 156 },
  },
  {
    id: 9, name: 'ユキ', role: 'レセプト・労務管理のプロ', department: '訪問鍼灸事業部',
    color: '#8BC34A', status: 'working', avatar: '🧾',
    currentTask: 'レセプト請求・スタッフ管理・施術報告書',
    skills: ['レセプト請求の整理', 'スタッフシフトの管理', '営業リストの管理', '施術報告書の作成', '保険請求の管理'],
    stats: { '請求件数': 38, '承認率': '98%', '管轄アプリ': 4 },
  },
  {
    id: 10, name: 'サク', role: 'SNS・営業リスト管理のプロ', department: '訪問鍼灸事業部',
    color: '#AED581', status: 'busy', avatar: '📱',
    currentTask: 'Instagram投稿・営業リスト更新・ケアマネ向け資料',
    skills: ['Instagram投稿文の作成', '営業リストの作成・更新', 'ケアマネ向け資料作成', 'SNS投稿のネタ出し', 'チラシ・POPの文面作成'],
    stats: { '投稿数': '週3本', '営業先': 156, 'フォロワー': '—' },
  },

  // ── AI開発部（4名）★収益中核 ──
  {
    id: 11, name: 'テツ', role: '部長（BtoB SaaS戦略・プロダクト設計のプロ）', department: 'AI開発部',
    color: '#263238', status: 'busy', avatar: '🤖',
    currentTask: 'BtoB SaaS販売戦略・検査アプリクラウド化計画',
    skills: ['BtoB営業資料の作成', 'AI製品のロードマップ策定', '料金プランの設計', '競合SaaSの分析', '導入提案書の作成', 'Facebook投稿文の作成'],
    stats: { '製品数': 8, 'BtoB契約': 2, '月額収益': '¥89,000' },
  },
  {
    id: 12, name: 'コウ', role: 'AI開発のプロ（プロンプト設計・API連携）', department: 'AI開発部',
    color: '#455A64', status: 'working', avatar: '💻',
    currentTask: '治療家AIマスター機能改善・BtoB販売LP',
    skills: ['AI製品の機能改善', 'プロンプト設計・最適化', 'API連携の開発', 'LP・サイトの改修', 'バグ修正・品質改善'],
    stats: { 'AI製品': 3, 'APIコール': '2,400/月', 'レスポンス': '1.2s' },
  },
  {
    id: 13, name: 'リク', role: 'SaaS開発のプロ（マルチテナント・課金実装）', department: 'AI開発部',
    color: '#8D6E63', status: 'working', avatar: '⚙️',
    currentTask: 'MEO勝ち上げくん改善・検査アプリSaaS化',
    skills: ['MEOツールの開発・改善', '検査アプリのクラウド化', 'SaaS機能の追加開発', 'マルチテナント対応', 'Stripe課金実装'],
    stats: { 'SaaS製品': 3, 'モニター': 10, '新機能': '開発中' },
  },
  {
    id: 14, name: 'タク', role: 'インフラのプロ（Vercel/Supabase/GitHub保守）', department: 'AI開発部',
    color: '#0D47A1', status: 'busy', avatar: '🖥️',
    currentTask: '全30サイト保守・デプロイ管理・監視',
    skills: ['サイトの稼働監視', 'デプロイ・ビルド管理', 'Supabaseのデータ管理', 'ドメイン・SSL管理', 'エラー調査・復旧'],
    stats: { 'サイト数': 30, '稼働率': '99.9%', 'Vercel': 30 },
  },

  // ── メディア部（2名） ──
  {
    id: 15, name: 'ツキ', role: 'YouTube戦略・チャンネル運営のプロ', department: 'メディア部',
    color: '#311B92', status: 'working', avatar: '🎬',
    currentTask: 'YouTube月光ヒーリング運営・24時間ライブ',
    skills: ['YouTube動画のタイトル・説明文作成', '動画テーマの企画', 'チャンネル成長戦略', '投稿スケジュール管理', 'アフィリエイト戦略'],
    stats: { '動画数': 180, '登録者': 500, '月間再生': '15,000' },
  },
  {
    id: 16, name: 'ルナ', role: 'コンテンツ生成・分析のプロ', department: 'メディア部',
    color: '#5C6BC0', status: 'working', avatar: '🌙',
    currentTask: 'サムネ改善・BGMトレンド・各部署コンテンツ支援',
    skills: ['サムネイル改善案の提案', 'BGM・トレンド調査', '再生数・CTRの分析', '各部署向けコンテンツ作成', '文章・キャッチコピー生成'],
    stats: { 'CTR': '4.2%', '視聴維持': '62%', 'コンテンツ支援': '全社' },
  },

  // ── LP・Web制作部（3名）★新設 ──
  {
    id: 17, name: 'マヤ', role: 'LP設計・デザインのプロ', department: 'LP・Web制作部',
    color: '#E91E63', status: 'busy', avatar: '🎨',
    currentTask: '症状別LP制作・LP作成ツール改善',
    skills: ['LP構成・ワイヤーフレーム設計', 'ファーストビュー最適化', 'コンバージョン改善', 'テンプレートデザイン', 'A/Bテスト設計'],
    stats: { 'LP制作': 12, 'CVR平均': '3.2%', 'テンプレ': 10 },
  },
  {
    id: 18, name: 'リン', role: 'HP・SEOコンテンツのプロ', department: 'LP・Web制作部',
    color: '#F48FB1', status: 'working', avatar: '📝',
    currentTask: 'SEO記事執筆・症状別ページ作成・HP改善',
    skills: ['SEO記事の執筆', '症状別ページの作成', 'HP構成の改善提案', 'メタデータ最適化', 'FAQ記事の作成'],
    stats: { '記事数': 45, '検索流入': '+32%', 'キーワード': 95 },
  },
  {
    id: 19, name: 'ノア', role: '高額商品LP・セールスページのプロ', department: 'LP・Web制作部',
    color: '#AD1457', status: 'working', avatar: '💎',
    currentTask: '睡眠・頭髪・ダイエットの高額LP改善',
    skills: ['高額商品のLP設計', 'セールスライティング', '松竹梅の価格設計', 'ビフォーアフター構成', '保証・特典の設計'],
    stats: { '高額LP': 3, '平均単価': '20万', 'CV数': '月5件' },
  },

  // ── BtoB営業部（2名）★新設 ──
  {
    id: 20, name: 'ジン', role: 'BtoB営業・提案書のプロ', department: 'BtoB営業部',
    color: '#FF6F00', status: 'busy', avatar: '🤝',
    currentTask: 'Facebook BtoB投稿・治療家向け営業',
    skills: ['BtoB提案書の作成', 'Facebook投稿の作成', '競合分析・差別化資料', 'モニター募集・管理', 'オンライン商談の準備'],
    stats: { 'モニター': 10, '商談': '月3件', 'FB投稿': '週2本' },
  },
  {
    id: 21, name: 'セナ', role: 'リサーチ・競合分析のプロ', department: 'BtoB営業部',
    color: '#FFB74D', status: 'working', avatar: '🔍',
    currentTask: '競合SaaS調査・市場リサーチ・モニターフォロー',
    skills: ['競合整体院の調査', '市場・トレンドリサーチ', 'ツール比較資料の作成', 'モニター満足度調査', 'ユーザーヒアリング整理'],
    stats: { '調査件数': 24, 'レポート': '月2本', '競合DB': 50 },
  },

  // ── 動画・デザイン制作部（2名）★新設 ──
  {
    id: 22, name: 'ヒカ', role: '動画編集・映像制作のプロ', department: '動画・デザイン制作部',
    color: '#00BCD4', status: 'working', avatar: '🎥',
    currentTask: 'VideoForge改善・セルフケア動画・広告動画',
    skills: ['動画編集・テロップ入れ', '広告用動画の制作', 'セルフケア動画の制作', 'サムネイル制作', 'Shorts編集・最適化'],
    stats: { '動画制作': '月8本', 'Shorts': '12本/日', '編集ツール': 'VideoForge' },
  },
  {
    id: 23, name: 'スイ', role: 'デザイン・POP・チラシのプロ', department: '動画・デザイン制作部',
    color: '#4DD0E1', status: 'working', avatar: '🖌️',
    currentTask: 'チラシ・POP・のぼり旗・リッチメニュー画像制作',
    skills: ['チラシ・POPデザイン', 'のぼり旗デザイン', 'LINEリッチメニュー画像', 'メニュー表デザイン', 'Instagram画像制作'],
    stats: { 'デザイン': '月10件', 'POP': 8, 'チラシ': 4 },
  },

  // ── 書類・仕組み化部（1名）★新設 ──
  {
    id: 24, name: 'ルカ', role: '書類・マニュアル・仕組み化のプロ', department: '経営層',
    color: '#9575CD', status: 'working', avatar: '📑',
    currentTask: '誓約書・サブスク書類・ご案内ブック・マニュアル作成',
    skills: ['契約書・誓約書の作成', 'サブスク契約書類の作成', 'ご案内ブックの作成', '業務マニュアルの作成', '提案書テンプレート管理'],
    stats: { '書類': 12, 'マニュアル': 5, 'テンプレ': 8 },
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 部署データ（拡張版：8部署）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const departments: Department[] = [
  {
    id: 'executive',
    name: '経営層',
    icon: '👑',
    color: '#FFD700',
    borderColor: '#B8860B',
    manager: 'レイア（CEO）',
    description: '全社の戦略立案・執行管理・スケジュール管理・書類作成',
    canAsk: ['事業戦略の相談・壁打ち', '今日やるべきことの整理', 'KPI進捗の確認', '各部署の状況チェック', 'スケジュール・計画の提案', '契約書・誓約書の作成'],
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
    apps: ['経理管理', '固定費管理', '数字比較ダッシュボード'],
    employees: allEmployees.filter(e => e.department === '財務部'),
    parentDivision: 'finance',
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
    apps: ['顧客管理シート', '予約管理', 'WEB問診', '検査シート作成', 'メニュー管理', '睡眠管理アプリ', '睡眠チェック分析', 'ECサイト', '広告管理ツール', 'LINE自動化', 'HeatScope', 'HPコンテンツ管理'],
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
    apps: ['訪問鍼灸スタッフ管理', 'レセプト管理', '営業管理アプリ', '訪問鍼灸管理アプリ'],
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
    apps: ['治療家AIマスター', '整体院AIツール', 'MEO勝ち上げくん', 'MEOチェッカー(自社)', 'MEOチェッカー(配布)', 'クリニックマーク', '検査シートSaaS', 'バーチャルオフィス'],
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
    apps: ['YouTube月光ヒーリング', 'YouTube海外版(Stellar Sleep)'],
    employees: allEmployees.filter(e => e.department === 'メディア部'),
    parentDivision: 'media',
  },
  {
    id: 'lp_web',
    name: 'LP・Web制作部',
    icon: '🎨',
    color: '#E91E63',
    borderColor: '#AD1457',
    manager: 'マヤ',
    description: 'LP制作・SEO記事・HP改善・高額商品ページの設計',
    canAsk: ['LP構成の設計・改善', 'SEO記事の作成', '症状別ページの作成', '高額商品LPの設計', 'コンバージョン改善'],
    apps: ['LP作成ツール', '高額メニューLP', 'BtoB販売LP', '提案書ジェネレーター', '強みワークシート'],
    employees: allEmployees.filter(e => e.department === 'LP・Web制作部'),
    parentDivision: 'content',
  },
  {
    id: 'btob',
    name: 'BtoB営業部',
    icon: '🤝',
    color: '#FF6F00',
    borderColor: '#E65100',
    manager: 'ジン',
    description: '治療家向けBtoB営業・モニター管理・競合調査',
    canAsk: ['BtoB提案書の作成', 'Facebook投稿の作成', '競合分析レポート', 'モニター管理', '市場リサーチ'],
    apps: ['アプリ購入サイト', 'MEOモニター管理'],
    employees: allEmployees.filter(e => e.department === 'BtoB営業部'),
    parentDivision: 'ai',
  },
  {
    id: 'design',
    name: '動画・デザイン制作部',
    icon: '🎥',
    color: '#00BCD4',
    borderColor: '#00838F',
    manager: 'ヒカ',
    description: '動画編集・チラシ・POP・画像制作で全社を横断支援',
    canAsk: ['動画編集・テロップ入れ', 'チラシ・POPデザイン', 'のぼり旗デザイン', 'Instagram画像制作', 'リッチメニュー画像'],
    apps: ['VideoForge動画エディタ'],
    employees: allEmployees.filter(e => e.department === '動画・デザイン制作部'),
    parentDivision: 'content',
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全プロダクト一覧（制作物ボード用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const products: Product[] = [
  // 整体院アプリ
  { id: 'customer-mgmt', name: '顧客管理シート', url: 'https://customer-mgmt.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6, 14], description: 'マルチテナント対応・離反アラート・AI分析・CSV取込', icon: '👥' },
  { id: 'reservation', name: '予約管理', url: 'https://reservation-app-steel.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6, 14], description: 'LINE予約ページ付き・カレンダー表示', icon: '📅' },
  { id: 'web-monshin', name: 'WEB問診', url: 'https://web-monshin.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6, 14], description: 'LINE導線・名寄せ精度向上済み', icon: '📝' },
  { id: 'kensa-sheet', name: '検査シート作成', url: 'https://kensa-sheet-app.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6, 13, 14], description: '歪み分析・セルフケア印刷・SaaS化進行中', icon: '🔬' },
  { id: 'menu-manager', name: 'メニュー管理', url: 'https://menu-manager.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6], description: 'メニュー・価格表・POP管理', icon: '🍽️' },
  { id: 'sleep-app', name: '睡眠管理アプリ', category: 'clinic-app', status: 'active', assignedTo: [6, 12], description: '睡眠データ記録・分析', icon: '😴' },
  { id: 'sleep-checker', name: '睡眠チェック分析', category: 'clinic-app', status: 'active', assignedTo: [6, 12], description: '睡眠品質チェック・カウンセリング用', icon: '🌙' },
  { id: 'ec-shop', name: 'ECサイト（物販+サブスク）', url: 'https://ec-shop-cyan.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [6, 14], description: 'サプリ・物販のオンライン販売', icon: '🛒' },
  { id: 'ad-manager', name: '広告管理ツール', url: 'https://ad-manager-mu.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [5, 14], description: 'Google Ads API連携・カスタムKPI', icon: '📊' },
  { id: 'line-auto', name: 'LINE自動化', url: 'https://line-automation.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [7, 14], description: 'API連携・スケジュール実行・ステップ配信', icon: '💬' },
  { id: 'heatscope', name: 'HeatScope', url: 'https://heatscope.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [5, 14], description: 'ヒートマップ分析ツール', icon: '🔥' },
  { id: 'hp-content', name: 'HPコンテンツ管理', url: 'https://hp-content-manager.vercel.app', category: 'clinic-app', status: 'active', assignedTo: [18, 14], description: 'ブログ生成・リッチエディタ', icon: '🌐' },

  // 訪問鍼灸アプリ
  { id: 'houmon-staff', name: '訪問鍼灸スタッフ管理', url: 'https://houmon-staff-manager.vercel.app', category: 'houmon-app', status: 'active', assignedTo: [9, 14], description: 'スタッフシフト・勤怠管理', icon: '👨‍⚕️' },
  { id: 'receipt-manager', name: 'レセプト管理', url: 'https://receipt-manager-taupe.vercel.app', category: 'houmon-app', status: 'active', assignedTo: [9, 14], description: '保険請求・施術報告書・別添フォーマット', icon: '🧾' },
  { id: 'sales-manager', name: '営業管理アプリ', url: 'https://sales-manager-orpin.vercel.app', category: 'houmon-app', status: 'active', assignedTo: [8, 14], description: 'CSV取り込み改善済み・営業リスト管理', icon: '📈' },
  { id: 'houmon-manager', name: '訪問鍼灸管理アプリ', category: 'houmon-app', status: 'active', assignedTo: [9, 14], description: 'Supabase Auth+RLS・マルチクリニック対応・日報・施術報告書', icon: '🏠' },

  // AI SaaS製品
  { id: 'ai-master', name: '治療家AIマスター', url: 'https://ai-master.vercel.app', category: 'ai-saas', status: 'active', assignedTo: [12, 11], description: '症状分析・施術提案・経営相談AI', icon: '🧠' },
  { id: 'ai-tools', name: '整体院AIツール', url: 'https://seitai-ai-tools.vercel.app', category: 'ai-saas', status: 'active', assignedTo: [12, 14], description: 'ブログ生成・診断・クイズ', icon: '🤖' },
  { id: 'meo-winner', name: 'MEO勝ち上げくん', url: 'https://meo-kachiagekun.vercel.app', category: 'ai-saas', status: 'active', assignedTo: [13, 11, 14], description: 'Supabase Auth・RLS・GSC連携・AI改善提案', icon: '🏆' },
  { id: 'meo-checker-self', name: 'MEOチェッカー（自社用）', url: 'https://meo-tracker.vercel.app', category: 'ai-saas', status: 'active', assignedTo: [13, 14], description: '自社MEO順位トラッキング', icon: '📍' },
  { id: 'meo-checker-dist', name: 'MEOチェッカー（配布用）', url: 'https://meo-checker-three.vercel.app', category: 'ai-saas', status: 'active', assignedTo: [13, 14], description: 'モニター向け配布版', icon: '📦' },
  { id: 'clinicmark', name: 'クリニックマーク', category: 'ai-saas', status: 'active', assignedTo: [12, 14], description: 'マーケティング管理生成サイト', icon: '✨' },
  { id: 'kensa-saas', name: '検査シートSaaS', category: 'ai-saas', status: 'development', assignedTo: [13, 11], description: 'Stripe月額課金・マルチテナント化進行中', icon: '🔬' },
  { id: 'virtual-office', name: 'バーチャルオフィス', category: 'ai-saas', status: 'active', assignedTo: [14, 12], description: 'AI社員24名のバーチャル会社', icon: '🏢' },

  // LP・Web制作物
  { id: 'lp-builder', name: 'LP作成ツール', url: 'https://lp-builder-weld.vercel.app', category: 'lp', status: 'active', assignedTo: [17, 14], description: '10テンプレ・3訴求軸・道のりセクション・ヒーロー7カスタム', icon: '🏗️' },
  { id: 'premium-lp', name: '高額メニューLP', url: 'https://premium-lp.vercel.app', category: 'lp', status: 'active', assignedTo: [19, 17], description: '睡眠/頭髪/ダイエット3コース', icon: '💎' },
  { id: 'clinic-saas-lp', name: 'BtoB販売LP', url: 'https://clinic-saas-lp.vercel.app', category: 'lp', status: 'active', assignedTo: [20, 17], description: '治療院DXツール3点セットの販売ページ', icon: '🤝' },
  { id: 'tsuyomi-worksheet', name: '強みワークシート', url: 'https://tsuyomi-worksheet.vercel.app', category: 'tool', status: 'active', assignedTo: [17, 7], description: '強み・差別化・ストーリーの言語化', icon: '💪' },
  { id: 'proposal-gen', name: '提案書ジェネレーター', category: 'tool', status: 'active', assignedTo: [24, 12], description: '施術提案書の自動生成', icon: '📄' },

  // マーケティング・コンテンツ
  { id: 'fb-templates', name: 'Facebook投稿テンプレート', category: 'content', status: 'active', assignedTo: [20, 7], description: 'BtoB向け5投稿＋7日間シリーズ', icon: '📘' },
  { id: 'instagram-posts', name: 'Instagram投稿', category: 'content', status: 'active', assignedTo: [7, 23], description: '画像＋キャプション自動生成', icon: '📸' },
  { id: 'seo-articles', name: 'SEO記事', category: 'content', status: 'active', assignedTo: [18, 7], description: '症状別95キーワード対応', icon: '📰' },
  { id: 'gbp-posts', name: 'GBP投稿', category: 'content', status: 'active', assignedTo: [5, 7], description: 'Googleビジネスプロフィール投稿', icon: '📍' },
  { id: 'gmb-posts', name: 'GMB投稿管理', category: 'content', status: 'active', assignedTo: [5, 7], description: 'Googleマップ投稿の一括管理', icon: '🗺️' },

  // メディア
  { id: 'youtube-healing', name: 'YouTube月光ヒーリング', category: 'media', status: 'active', assignedTo: [15, 16, 22], description: '2時間動画2本+Shorts12本/日・24時間ライブ', icon: '🎵' },
  { id: 'youtube-stellar', name: 'YouTube海外版(Stellar Sleep)', category: 'media', status: 'active', assignedTo: [15, 16], description: '海外向け睡眠チャンネル・cron稼働中', icon: '🌟' },
  { id: 'video-forge', name: 'VideoForge動画エディタ', url: 'https://video-forge-nu.vercel.app', category: 'media', status: 'active', assignedTo: [22, 14], description: '19ツール搭載・FFmpeg.wasm・治療家テンプレ50種', icon: '🎬' },
]

// カテゴリ定義
export const productCategories: Record<Product['category'], { label: string; color: string; icon: string }> = {
  'clinic-app': { label: '整体院アプリ', color: '#1565C0', icon: '🏥' },
  'houmon-app': { label: '訪問鍼灸アプリ', color: '#2E7D32', icon: '🏠' },
  'ai-saas': { label: 'AI SaaS製品', color: '#263238', icon: '🤖' },
  'marketing': { label: 'マーケティング', color: '#E91E63', icon: '📣' },
  'media': { label: 'メディア', color: '#311B92', icon: '🎬' },
  'lp': { label: 'LP・Web', color: '#E91E63', icon: '🎨' },
  'content': { label: 'コンテンツ', color: '#EF6C00', icon: '📝' },
  'tool': { label: 'ツール', color: '#00BCD4', icon: '🛠️' },
}

export const allEmployeesList = allEmployees

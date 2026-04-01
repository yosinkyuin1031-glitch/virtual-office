// 部署データの強化版（data.tsの部署データを補完する独立ファイル）
// data.tsの既存Department型・departmentsはそのまま維持し、
// ここでは部署の色テーマ・詳細情報を追加定義する

export interface DepartmentTheme {
  id: string
  name: string
  englishName: string
  description: string
  manager: { name: string; avatar: string }
  members: { name: string; role: string; avatar: string }[]
  apps: { name: string; url: string; status: 'active' | 'development' | 'planned' }[]
  currentTasks: string[]
  lastActivity: string
  color: string // Tailwind色名
}

// 各部署のテーマカラーと詳細情報
export const departmentThemes: DepartmentTheme[] = [
  {
    id: 'executive',
    name: '経営層',
    englishName: 'Executive Office',
    description: '全社の戦略立案・執行管理・スケジュール管理・書類作成',
    manager: { name: 'レイア', avatar: '👑' },
    members: [
      { name: 'レイア', role: 'CEO（全社戦略・壁打ち参謀）', avatar: '👑' },
      { name: 'ソラト', role: 'COO（執行管理・進捗チェック）', avatar: '⚡' },
      { name: 'ミコ', role: '秘書（スケジュール・タスク整理）', avatar: '📋' },
      { name: 'ルカ', role: '書類・マニュアル・仕組み化', avatar: '📑' },
    ],
    apps: [],
    currentTasks: [
      'アプリ事業拡大戦略・統合プラン設計',
      '法人化準備（令和8年度）',
      '指令センター運用・ワークフロー進捗管理',
      'BtoB利用規約整備・統合プラン契約書テンプレート',
    ],
    lastActivity: '2026-04-01',
    color: 'amber',
  },
  {
    id: 'finance',
    name: '財務部',
    englishName: 'Finance Department',
    description: '決済・キャッシュフロー・請求書/領収書・投資を一元管理',
    manager: { name: 'ミサ', avatar: '💰' },
    members: [
      { name: 'ミサ', role: 'CFO（決済・キャッシュフロー・請求書・投資）', avatar: '💰' },
    ],
    apps: [
      { name: '数字比較ダッシュボード', url: 'https://quarterly-dashboard-nu.vercel.app', status: 'active' },
      { name: '固定費管理', url: 'https://koteihi-kanri.vercel.app', status: 'active' },
      { name: '請求書作成アプリ', url: 'https://invoice-forge-ashy.vercel.app', status: 'active' },
    ],
    currentTasks: [
      '統合プラン価格設計・Stripe課金フロー構築',
      '月次PL・キャッシュフロー予測',
    ],
    lastActivity: '2026-04-01',
    color: 'blue',
  },
  {
    id: 'seitai',
    name: '整体院事業部',
    englishName: 'Clinic Operations',
    description: '大口神経整体院のマーケティング・集客・アプリ管理・SNS運用',
    manager: { name: 'ハル', avatar: '🏥' },
    members: [
      { name: 'ハル', role: 'MEO・広告・集客戦略', avatar: '🏥' },
      { name: 'ナギ', role: 'アプリ管理（予約・顧客・問診・検査・物販）', avatar: '📅' },
      { name: 'フミ', role: 'コピーライティング（SNS・LINE・LP文章）', avatar: '✍️' },
    ],
    apps: [
      { name: '顧客管理シート', url: 'https://customer-mgmt.vercel.app', status: 'active' },
      { name: '予約管理', url: 'https://reservation-app-steel.vercel.app', status: 'active' },
      { name: 'WEB問診', url: 'https://web-monshin.vercel.app', status: 'active' },
      { name: '検査シート作成', url: 'https://kensa-sheet-app.vercel.app', status: 'active' },
      { name: 'メニュー管理', url: 'https://menu-manager.vercel.app', status: 'active' },
      { name: 'ECサイト', url: 'https://ec-shop-cyan.vercel.app', status: 'active' },
      { name: 'LINE自動化', url: 'https://line-automation.vercel.app', status: 'active' },
      { name: 'HeatScope', url: 'https://heatscope.vercel.app', status: 'active' },
    ],
    currentTasks: [
      '4月キャンペーン準備・GBP週2投稿',
      '顧客管理シートBtoB納品準備・データ移行手順整備',
      '4月SNS投稿カレンダー作成・LINE配信文面準備',
    ],
    lastActivity: '2026-04-01',
    color: 'purple',
  },
  {
    id: 'houmon',
    name: '訪問鍼灸事業部',
    englishName: 'Home Visit Division',
    description: '晴陽鍼灸院のマーケティング・営業・アプリ管理・SNS運用',
    manager: { name: 'アキ', avatar: '🏠' },
    members: [
      { name: 'アキ', role: '訪問営業・ケアマネ攻略', avatar: '🏠' },
      { name: 'ユキ', role: 'レセプト・労務管理', avatar: '🧾' },
      { name: 'サク', role: 'SNS・営業リスト管理', avatar: '📱' },
    ],
    apps: [
      { name: '訪問鍼灸スタッフ管理', url: 'https://houmon-staff-manager.vercel.app', status: 'active' },
      { name: 'レセプト管理', url: 'https://receipt-manager-taupe.vercel.app', status: 'active' },
      { name: '営業管理アプリ', url: 'https://sales-manager-orpin.vercel.app', status: 'active' },
    ],
    currentTasks: [
      'ケアマネ新規営業10件・GBP投稿強化',
      '月末レセプト請求処理・4月シフト確定',
      '訪問鍼灸Instagram週3投稿・営業先リスト更新',
    ],
    lastActivity: '2026-04-01',
    color: 'green',
  },
  {
    id: 'ai_dev',
    name: 'AI開発部',
    englishName: 'AI Development',
    description: 'AI会社の収益中核。BtoB SaaS・AI製品の開発・販売・インフラ管理',
    manager: { name: 'テツ', avatar: '🤖' },
    members: [
      { name: 'テツ', role: 'BtoB SaaS戦略・プロダクト設計', avatar: '🤖' },
      { name: 'コウ', role: 'AI開発（プロンプト設計・API連携）', avatar: '💻' },
      { name: 'リク', role: 'SaaS開発（マルチテナント・課金実装）', avatar: '⚙️' },
      { name: 'タク', role: 'インフラ（Vercel/Supabase/GitHub保守）', avatar: '🖥️' },
    ],
    apps: [
      { name: 'MEO勝ち上げくん', url: 'https://meo-kachiagekun.vercel.app', status: 'active' },
      { name: '治療家AIマスター', url: 'https://ai-master.vercel.app', status: 'active' },
      { name: '整体院AIツール', url: 'https://seitai-ai-tools.vercel.app', status: 'active' },
      { name: 'バーチャルオフィス', url: 'https://virtual-office.vercel.app', status: 'active' },
      { name: '検査シートSaaS', url: '', status: 'development' },
    ],
    currentTasks: [
      'アプリ統合プラン「治療院OS」設計',
      'バーチャルオフィスv3改修・指令センター連携強化',
      '検査アプリStripe月額課金実装・マルチテナント最終テスト',
      'v3.0デプロイ完了・全30サイト稼働監視中',
    ],
    lastActivity: '2026-04-01',
    color: 'cyan',
  },
  {
    id: 'media',
    name: 'メディア部',
    englishName: 'Media Division',
    description: 'YouTube運営・コンテンツ生成で全社を横断支援',
    manager: { name: 'ツキ', avatar: '🎬' },
    members: [
      { name: 'ツキ', role: 'YouTube戦略・チャンネル運営', avatar: '🎬' },
      { name: 'ルナ', role: 'コンテンツ生成・分析', avatar: '🌙' },
    ],
    apps: [
      { name: 'VideoForge動画エディタ', url: 'https://video-forge-nu.vercel.app', status: 'active' },
    ],
    currentTasks: [
      '4月の動画スケジュール策定・Shorts自動投稿稼働中',
      'CTR改善テスト・4月BGMトレンド調査',
    ],
    lastActivity: '2026-04-01',
    color: 'violet',
  },
  {
    id: 'lp_web',
    name: 'LP・Web制作部',
    englishName: 'LP & Web Production',
    description: 'LP制作・SEO記事・HP改善・高額商品ページの設計',
    manager: { name: 'マヤ', avatar: '🎨' },
    members: [
      { name: 'マヤ', role: 'LP設計・デザイン', avatar: '🎨' },
      { name: 'リン', role: 'HP・SEOコンテンツ', avatar: '📝' },
      { name: 'ノア', role: '高額商品LP・セールスページ', avatar: '💎' },
    ],
    apps: [
      { name: 'LP作成ツール', url: 'https://lp-builder-weld.vercel.app', status: 'active' },
      { name: '高額メニューLP', url: 'https://premium-lp.vercel.app', status: 'active' },
      { name: 'HPコンテンツ管理', url: 'https://hp-content-manager.vercel.app', status: 'active' },
      { name: '提案書ジェネレーター', url: 'https://proposal-generator-gold.vercel.app', status: 'active' },
    ],
    currentTasks: [
      '自律神経LP最適化・4月キャンペーンLP準備',
      '気圧×自律神経のSEO記事執筆・FAQ記事2本生成',
      'ダイエットLP CVR改善・睡眠プログラムLP更新',
    ],
    lastActivity: '2026-04-01',
    color: 'pink',
  },
  {
    id: 'btob',
    name: 'BtoB営業部',
    englishName: 'BtoB Sales',
    description: '治療家向けBtoB営業・モニター管理・競合調査',
    manager: { name: 'ジン', avatar: '🤝' },
    members: [
      { name: 'ジン', role: 'BtoB営業・提案書', avatar: '🤝' },
      { name: 'セナ', role: 'リサーチ・競合分析', avatar: '🔍' },
    ],
    apps: [
      { name: 'アプリ購入サイト', url: 'https://clinic-saas-lp.vercel.app', status: 'active' },
    ],
    currentTasks: [
      '4月FB投稿20本カレンダー実行・Zoom商談3件',
      '競合AI姿勢分析ツール調査・差別化レポート作成',
    ],
    lastActivity: '2026-04-01',
    color: 'orange',
  },
  {
    id: 'design',
    name: '動画・デザイン制作部',
    englishName: 'Creative Studio',
    description: '動画編集・チラシ・POP・画像制作で全社を横断支援',
    manager: { name: 'ヒカ', avatar: '🎥' },
    members: [
      { name: 'ヒカ', role: '動画編集・映像制作', avatar: '🎥' },
      { name: 'スイ', role: 'デザイン・POP・チラシ', avatar: '🖌️' },
    ],
    apps: [
      { name: 'VideoForge動画エディタ', url: 'https://video-forge-nu.vercel.app', status: 'active' },
    ],
    currentTasks: [
      'アプリ紹介動画制作・4月広告用ショート動画',
      '4月キャンペーンチラシ・LINEリッチメニュー更新',
    ],
    lastActivity: '2026-04-01',
    color: 'pink',
  },
  {
    id: 'product_mgmt',
    name: 'プロダクト管理部',
    englishName: 'Product Management',
    description: 'アプリの品質管理・統合計画・UI改善・販売戦略を統括',
    manager: { name: 'カナ', avatar: '📊' },
    members: [
      { name: 'カナ', role: 'PM（要件定義・販売戦略）', avatar: '📊' },
      { name: 'ミオ', role: 'UX/UIデザイナー', avatar: '🎯' },
      { name: 'レン', role: 'QA（品質保証・テスト）', avatar: '🔍' },
    ],
    apps: [
      { name: 'プロジェクト管理', url: 'https://project-hub-three-chi.vercel.app', status: 'active' },
    ],
    currentTasks: [
      'アプリ統合計画・販売戦略策定・ロードマップ管理',
      'アプリUI統一・使いやすさ改善・デザインシステム構築',
      '全アプリ品質チェック・バグ修正・パフォーマンス監視',
    ],
    lastActivity: '2026-04-01',
    color: 'purple',
  },
  {
    id: 'customer_success',
    name: 'カスタマーサクセス部',
    englishName: 'Customer Success',
    description: 'BtoB顧客の導入支援・定着化・売上拡大・セミナー企画',
    manager: { name: 'アオイ', avatar: '🤗' },
    members: [
      { name: 'アオイ', role: '導入支援・定着化', avatar: '🤗' },
      { name: 'ショウ', role: 'セールスマーケター（BtoB集客・売上拡大）', avatar: '🚀' },
    ],
    apps: [],
    currentTasks: [
      'モニター10名のフォロー・オンボーディング改善・解約防止',
      'BtoB集客自動化・セミナー企画・パートナー開拓',
    ],
    lastActivity: '2026-04-01',
    color: 'cyan',
  },
]

// 部署IDから色を取得するヘルパー
export function getDepartmentColor(departmentId: string): string {
  const theme = departmentThemes.find(d => d.id === departmentId)
  return theme?.color || 'gray'
}

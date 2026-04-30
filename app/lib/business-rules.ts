// 事業別の「投稿・タスク生成ルール」
// 陽平さんの作業負荷を守るため、AIが勝手にタスク生成・コンテンツ生成しない仕組み
// 各事業ごとに「今週/今月、何をどれだけ生成していいか」を宣言する
//
// 2026-04-30 戦略更新：整体・アプリは導線含めフル構築モード／訪問鍼灸はHP/IG重視／
// コンサル/機器は投稿停止／月光ヒーリングはリサーチモード

export type Channel =
  | 'gbp'
  | 'threads'
  | 'instagram'
  | 'facebook'
  | 'line_step'    // LINEステップ配信（友達追加後）
  | 'line_blast'   // LINE一斉配信
  | 'youtube'
  | 'youtube_short'
  | 'blog_seo'
  | 'lp'
  | 'hp'           // ホームページ更新
  | 'meo'
  | 'mail'
  | 'research'     // リサーチタスク（投稿前段階）
  | 'task_internal' // 社内タスク（広告運用、KPIチェック等）

export type Mode = 'build' | 'maintain' | 'research' | 'paused'
// build = 導線/コンテンツを積極構築 / maintain = 既存維持のみ
// research = 投稿せず調査のみ / paused = 全停止

export interface BusinessRule {
  business: 'seitai' | 'houmon' | 'app' | 'consulting' | 'device' | 'youtube_music' | 'common'
  label: string
  emoji: string
  mode: Mode
  // チャネルごとの「週次／月次の生成上限」
  channels: Partial<Record<Channel, { weekly?: number; monthly?: number; note?: string }>>
  // 在庫としてためてOKな枠の上限（受信箱の未対応上限）
  inboxLimit: number
  // タスク自動実行を許可するか
  autoExecuteTasks: boolean
  // この事業の戦略メモ（プロンプトに供給）
  strategicNote?: string
}

export const DEFAULT_RULES: BusinessRule[] = [
  {
    business: 'seitai',
    label: '大口神経整体院',
    emoji: '🏥',
    mode: 'build',
    channels: {
      gbp: { weekly: 3, note: '神経痛・重症慢性痛訴求／患者の声を必ず引用' },
      blog_seo: { weekly: 2, note: '症状ページ＋ブログ／3ステップ施術フレームを使用' },
      instagram: { weekly: 3, note: '症例ビフォーアフター／院内日常／治療哲学' },
      threads: { weekly: 7, note: '1日1本・整体院アカウント' },
      line_step: { monthly: 1, note: '友達追加後のステップ（初回〜10回まで設計）' },
      line_blast: { monthly: 2, note: '既存患者へのキャンペーン告知' },
      lp: { monthly: 2, note: '症状別LP・キャンペーンLP' },
      hp: { weekly: 1, note: 'HPの記事追加・FAQ拡充' },
    },
    inboxLimit: 12,
    autoExecuteTasks: true,
    strategicNote: '整体は導線フル構築モード。HP→LP→LINE→提案書→契約→リピートまでの全動線をAIが回す。患者の声をすべての生成に必ず1つ以上含める。',
  },
  {
    business: 'app',
    label: 'アプリ事業',
    emoji: '💻',
    mode: 'build',
    channels: {
      facebook: { weekly: 3, note: '陽平さん本人ストーリー口調・LP誘導' },
      threads: { weekly: 7, note: '1日1本・治療家のアプリ作り視点' },
      youtube_short: { weekly: 1, note: '週1本のショート（カラダマップ等のデモ）' },
      line_step: { monthly: 1, note: 'カラダマップLP→LINE登録→ステップ配信' },
      line_blast: { monthly: 2, note: 'BtoB見込みリスト向けキャンペーン告知' },
      lp: { monthly: 2, note: 'カラダマップ・Clinic Core・MEO勝ち上げ各LP' },
      blog_seo: { weekly: 1, note: '治療家向けの「アプリ導入ガイド」記事' },
    },
    inboxLimit: 12,
    autoExecuteTasks: true,
    strategicNote: 'アプリは導線フル構築モード。FB→LP→LINE→デモ→購入まで自動化を目指す。「治療家のアプリ作りといえば大口陽平」のポジション獲得。',
  },
  {
    business: 'houmon',
    label: '晴陽鍼灸院',
    emoji: '🏠',
    mode: 'build',
    channels: {
      hp: { weekly: 1, note: 'HP整備が最優先（信頼の母艦）' },
      instagram: { weekly: 3, note: '訪問現場・スタッフ・患者ストーリー（個人特定NG）' },
      gbp: { weekly: 1, note: '週1本でOK' },
      blog_seo: { weekly: 1, note: '訪問鍼灸の症例・地域情報' },
    },
    inboxLimit: 6,
    autoExecuteTasks: true,
    strategicNote: '訪問鍼灸はケアマネ営業を行わない方針。HP→IG→GBPで「地域での認知」を作る。患者の声DBはまだゼロなので、当面は院長の知見ベースで生成。',
  },
  {
    business: 'consulting',
    label: '治療家コミュニティ・コンサル',
    emoji: '🤝',
    mode: 'paused',
    channels: {},
    inboxLimit: 0,
    autoExecuteTasks: false,
    strategicNote: '今は投稿不要。既存メンバーのフォローのみ手動で行う。',
  },
  {
    business: 'device',
    label: '治療機器販売',
    emoji: '🔧',
    mode: 'paused',
    channels: {},
    inboxLimit: 0,
    autoExecuteTasks: false,
    strategicNote: '今は投稿不要。商談ベースで個別対応。',
  },
  {
    business: 'youtube_music',
    label: '月光ヒーリング（YouTube音楽）',
    emoji: '🌙',
    mode: 'research',
    channels: {
      research: { weekly: 3, note: '競合分析・タイトル/サムネ研究・需要キーワード調査' },
    },
    inboxLimit: 6,
    autoExecuteTasks: true,
    strategicNote: 'リサーチ先行モード。フォロワー増・ライブ配信運用を目指すが、投稿本数や時間帯はMakumee氏合流後に詳細決定。今はリサーチアウトプットだけを溜める。',
  },
  {
    business: 'common',
    label: '全社共通',
    emoji: '🏢',
    mode: 'maintain',
    channels: {
      task_internal: { weekly: 1, note: '経理・労務のリマインドのみ' },
    },
    inboxLimit: 3,
    autoExecuteTasks: false,
  },
]

// 部署名→事業IDの判定（task-engineと整合）
export function classifyToBusinessId(department: string, title: string): BusinessRule['business'] {
  const text = `${department} ${title}`.toLowerCase()
  if (text.includes('整体') || text.includes('神経整体') || text.includes('カラダマップ') || text.includes('meo') || text.includes('gbp')) return 'seitai'
  if (text.includes('訪問') || text.includes('鍼灸') || text.includes('晴陽') || text.includes('ケアマネ') || text.includes('リハビリ')) return 'houmon'
  if (text.includes('アプリ') || text.includes('saas') || text.includes('btob') || text.includes('開発') || text.includes('vercel')) return 'app'
  if (text.includes('コミュニティ') || text.includes('コンサル') || text.includes('セミナー') || text.includes('治療家')) return 'consulting'
  if (text.includes('機器') || text.includes('br') || text.includes('血管') || text.includes('顕微鏡')) return 'device'
  if (text.includes('月光') || text.includes('ヒーリング') || text.includes('youtube音楽') || text.includes('ヒーリング音楽')) return 'youtube_music'
  return 'common'
}

// 事業のルールを取得
export function getBusinessRule(business: BusinessRule['business']): BusinessRule {
  return DEFAULT_RULES.find((r) => r.business === business) ?? DEFAULT_RULES[DEFAULT_RULES.length - 1] // common
}

// タスクの自動実行を許可するか
export function shouldAutoExecute(department: string, title: string): boolean {
  // グローバル無効化（環境変数で全停止可能）
  if (process.env.AUTO_EXECUTE_DISABLED === '1') return false
  const business = classifyToBusinessId(department, title)
  const rule = getBusinessRule(business)
  return rule.autoExecuteTasks
}

// タスクの自動生成を許可するか（PDCA cycleがタスクを作る時に使う）
export function shouldAutoGenerate(business: BusinessRule['business']): boolean {
  if (process.env.AUTO_GENERATE_DISABLED === '1') return false
  const rule = getBusinessRule(business)
  return rule.autoExecuteTasks
}

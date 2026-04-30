// 事業別の「投稿・タスク生成ルール」
// 陽平さんの作業負荷を守るため、AIが勝手にタスク生成・コンテンツ生成しない仕組み
// 各事業ごとに「今週/今月、何をどれだけ生成していいか」を宣言する

export type Channel =
  | 'gbp'
  | 'threads'
  | 'instagram'
  | 'facebook'
  | 'line'
  | 'youtube'
  | 'blog_seo'
  | 'lp'
  | 'meo'
  | 'mail'
  | 'task_internal' // 社内タスク（広告運用、KPIチェック等）

export interface BusinessRule {
  business: 'seitai' | 'houmon' | 'app' | 'consulting' | 'device' | 'common'
  label: string
  emoji: string
  // チャネルごとの「週次／月次の生成上限」
  // null = 生成しない (AIがタスクを作らない)
  channels: Partial<Record<Channel, { weekly?: number; monthly?: number; note?: string }>>
  // 在庫としてためてOKな枠の上限（受信箱の未対応上限）
  inboxLimit: number
  // タスク自動実行を許可するか
  autoExecuteTasks: boolean
}

// デフォルトのルール（全部「最小限」モード）
// 陽平さんが各事業のページで個別に上書きできる
export const DEFAULT_RULES: BusinessRule[] = [
  {
    business: 'seitai',
    label: '大口神経整体院',
    emoji: '🏥',
    channels: {
      gbp: { weekly: 2, note: '週2本まで・「重症慢性痛」訴求' },
      blog_seo: { weekly: 1, note: '週1本のSEO記事' },
      line: { monthly: 2, note: '月2本のLINE一斉配信のみ' },
      instagram: { weekly: 0, note: '当面は出さない' },
      facebook: { weekly: 0, note: 'アプリ事業のみ可' },
    },
    inboxLimit: 5,
    autoExecuteTasks: false, // 宣言したものだけ
  },
  {
    business: 'houmon',
    label: '晴陽鍼灸院',
    emoji: '🏠',
    channels: {
      gbp: { weekly: 1, note: '週1本でOK' },
      mail: { monthly: 1, note: '月1のケアマネレター' },
      task_internal: { weekly: 1, note: 'スタッフ管理タスクのみ' },
    },
    inboxLimit: 3,
    autoExecuteTasks: false,
  },
  {
    business: 'app',
    label: 'アプリ事業',
    emoji: '💻',
    channels: {
      facebook: { weekly: 3, note: '陽平さん本人ストーリー口調・LP誘導' },
      threads: { weekly: 7, note: '1日1本・治療家のアプリ作り視点' },
      youtube: { weekly: 1, note: '週1本のショート' },
    },
    inboxLimit: 8,
    autoExecuteTasks: true, // アプリ事業は積極的に生成
  },
  {
    business: 'consulting',
    label: '治療家コミュニティ・コンサル',
    emoji: '🤝',
    channels: {
      mail: { monthly: 2, note: 'メンバーへの情報配信のみ' },
      task_internal: { monthly: 2, note: '勉強会企画タスクのみ' },
    },
    inboxLimit: 3,
    autoExecuteTasks: false,
  },
  {
    business: 'device',
    label: '治療機器販売',
    emoji: '🔧',
    channels: {
      task_internal: { monthly: 1, note: '商談フォローのみ' },
    },
    inboxLimit: 2,
    autoExecuteTasks: false,
  },
  {
    business: 'common',
    label: '全社共通',
    emoji: '🏢',
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
  return 'common'
}

// 事業のルールを取得
export function getBusinessRule(business: BusinessRule['business']): BusinessRule {
  return DEFAULT_RULES.find((r) => r.business === business) ?? DEFAULT_RULES[5] // common
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

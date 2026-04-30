// 5年事業計画（31歳〜35歳・2027-2031）
// 元データ: 4/26コンサル + 2/22石川先生セミナー
// 単位は基本「万円/年」、スタッフは「人」

export type BusinessId = 'seitai' | 'houmon' | 'app' | 'consulting' | 'device' | 'new-venture'

export interface BusinessLine {
  id: string
  name: string
  business: BusinessId
  unit: string
  current: number | null // 現状値（不明なら null）
  year1: number | null // 31歳 / 2027
  year2: number | null // 32歳 / 2028
  year3: number | null // 33歳 / 2029
  year4: number | null // 34歳 / 2030
  year5: number | null // 35歳 / 2031
  launchYear?: number // 立ち上げ年（0=既存、1-5=その年）
  notes?: string
}

export interface BusinessVision {
  id: BusinessId
  name: string
  emoji: string
  color: string
  description: string
}

export const BUSINESS_VISIONS: BusinessVision[] = [
  {
    id: 'seitai',
    name: '大口神経整体院',
    emoji: '🏥',
    color: '#22D3EE',
    description: '重症慢性痛・神経痛専門の自費整体院。3ステップ施術（リセット→プラス→機能性）',
  },
  {
    id: 'houmon',
    name: '晴陽鍼灸院',
    emoji: '🏠',
    color: '#10B981',
    description: '訪問鍼灸リハビリ。大阪市南部・堺市で技術力と認知獲得',
  },
  {
    id: 'app',
    name: 'アプリ事業',
    emoji: '💻',
    color: '#3B82F6',
    description: '治療院向けBtoB SaaS。「治療家のアプリ作りといえば大口陽平」のポジション',
  },
  {
    id: 'consulting',
    name: '治療家コミュニティ・コンサル',
    emoji: '🤝',
    color: '#A78BFA',
    description: '治療家の秘密基地・グループコンサル・技術セミナー',
  },
  {
    id: 'device',
    name: '治療機器販売',
    emoji: '🔧',
    color: '#F59E0B',
    description: 'BR・血管顕微鏡のBtoB卸販売',
  },
  {
    id: 'new-venture',
    name: '新規事業ライン',
    emoji: '🌱',
    color: '#EC4899',
    description: 'サロン・ジム・ゴルフ施設・レンタルスペース等の新ベンチャー',
  },
]

export const BUSINESS_LINES: BusinessLine[] = [
  // 整体院
  {
    id: 'seitai-main',
    name: '大口神経整体院',
    business: 'seitai',
    unit: '万円/年',
    current: null,
    year1: 2200,
    year2: 1800,
    year3: 1500,
    year4: 1500,
    year5: 1200,
    launchYear: 0,
    notes: '訪問拡大に伴い段階的に縮小。施術頻度は週2-3に',
  },

  // 訪問鍼灸
  {
    id: 'houmon-main',
    name: '晴陽鍼灸院（訪問）',
    business: 'houmon',
    unit: '万円/年',
    current: null,
    year1: 2160,
    year2: 3600,
    year3: 4200,
    year4: 6480,
    year5: 7200,
    launchYear: 0,
    notes: '5年で売上3倍超。スタッフ拡大が成長エンジン',
  },
  {
    id: 'houmon-staff',
    name: '訪問スタッフ数',
    business: 'houmon',
    unit: '人',
    current: 2,
    year1: 3,
    year2: 5,
    year3: 7,
    year4: 9,
    year5: 10,
    launchYear: 0,
    notes: '5年後は堺市拠点増設・大阪市南部+堺市で認知獲得',
  },

  // アプリ事業
  {
    id: 'app-main',
    name: 'アプリ事業（BtoB SaaS）',
    business: 'app',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: null,
    year3: null,
    year4: null,
    year5: 1200,
    launchYear: 0,
    notes: '5年計画では明示的に1,200万。1-4年目は別途月次目標で運用',
  },

  // コンサル・セミナー
  {
    id: 'consulting-tech-seminar',
    name: '技術セミナー',
    business: 'consulting',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: 300,
    year3: 150,
    year4: 150,
    year5: null,
    launchYear: 2,
    notes: '2年目立ち上げ・3年目以降は他事業者と組んでスケール',
  },

  // 治療機器販売
  {
    id: 'device-main',
    name: '治療機器卸販売',
    business: 'device',
    unit: '万円/年',
    current: null,
    year1: 300,
    year2: 150,
    year3: 150,
    year4: 150,
    year5: null,
    launchYear: 0,
    notes: '5年目はメイン事業から外す（他業種立ち上げにシフト）',
  },

  // 新規事業ライン
  {
    id: 'rental-space',
    name: 'レンタルスペース',
    business: 'new-venture',
    unit: '万円/年',
    current: null,
    year1: 60,
    year2: 100,
    year3: 100,
    year4: 100,
    year5: 100,
    launchYear: 1,
    notes: '小規模だが安定収入',
  },
  {
    id: 'salon-jiritsu',
    name: '自律神経・睡眠特化サロン',
    business: 'new-venture',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: 1200,
    year3: 1500,
    year4: 1800,
    year5: 1800,
    launchYear: 2,
    notes: '2年目立ち上げ・整体院のクロスセル先',
  },
  {
    id: 'gym-osaka',
    name: 'スポーツジム経営',
    business: 'new-venture',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: null,
    year3: 1800,
    year4: 1800,
    year5: 1800,
    launchYear: 3,
    notes: '3年目立ち上げ',
  },
  {
    id: 'golf-seitai',
    name: 'ゴルフ×整体施設',
    business: 'new-venture',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: null,
    year3: null,
    year4: 1200,
    year5: 1200,
    launchYear: 4,
    notes: '4年目立ち上げ・パフォーマンス特化',
  },
  {
    id: 'gym-nara',
    name: '奈良スポーツジム2号店',
    business: 'new-venture',
    unit: '万円/年',
    current: null,
    year1: null,
    year2: null,
    year3: null,
    year4: null,
    year5: 1000,
    launchYear: 5,
    notes: '5年目立ち上げ',
  },
]

// 年次合計目標
export const YEAR_TOTALS = [
  { year: 1, age: 31, total: 4720, label: '1年後' },
  { year: 2, age: 32, total: 6850, label: '2年後' },
  { year: 3, age: 33, total: 9400, label: '3年後' },
  { year: 4, age: 34, total: 12880, label: '4年後' },
  { year: 5, age: 35, total: 15500, label: '5年後' },
]

// 5年後の理想状態（数字以外のビジョン）
export const VISION_2031 = [
  '大阪市南部と堺市で晴陽鍼灸の認知獲得',
  'みんなが集まれる場所（サウナ・シーシャ・ゴルフ・ビリヤード・カラオケ）',
  '自分が稼働せずとも事業が回る',
  '各事業に信頼できる右腕がいる',
  '一緒に楽しめる仲間がいる',
  '自分も関わってくれる人の健康',
  '週2-3で施術、他は事務',
  '病院と連携した地域医療',
  '他業種で事業を立ち上げている',
  'チャレンジしたい時にチャレンジできる',
  '家族との時間を自然と取れている',
]

// 必要マインド・スキル
export const REQUIRED_MINDSET = [
  '人を巻き込める',
  '0からでも数字を作り出せる',
  '自分を売り出せる',
  '頭を下げれる',
  '隙がある',
  'オフラインで強い',
  'AI・SNS',
  '時代の流れに敏感',
  '決めた時の集中力と馬力',
]

// 自己評価（2026年4月時点・10項目）
export const SELF_ASSESSMENT_2026 = {
  date: '2026-02-22',
  source: '石川先生セミナー',
  total: 65,
  max: 100,
  items: [
    { name: '競合が来ようが関係のない差別化', score: 8 },
    { name: '価値を引き上げ欲しいと言われるセールス力', score: 7 },
    { name: '質の高い集客力', score: 7 },
    { name: '目標を数字から逆算出来る分析能力', score: 5 },
    { name: 'ビジネスモデルや仕組みの理解・構築力', score: 6 },
    { name: '本質を追求する意識', score: 7 },
    { name: '人間の感情への理解力', score: 6 },
    { name: '揺るがないマインドセット', score: 5 },
    { name: '問題に対する直面能力', score: 6 },
    { name: '高い志と学ぶ能力', score: 8 },
  ],
}

// マーケ哲学（AI社員プロンプトに参照される）
export const MARKETING_PHILOSOPHY = {
  outflow: {
    title: 'アウトフロー思考',
    points: [
      '常にアウトフロー（与える）でいる',
      '相手が求める価値を理解する',
      '出したアウトフローが相手に良い変化を与える → 良いインフロー',
      '豊富なエクスチェンジ（与える > 受ける）が理想',
    ],
  },
  monopoly: {
    title: 'ピーター・ティール独占理論',
    points: [
      '競争は敗者のすること・独占を作って守る',
      '0→1を目指す（既存改良ではない）',
      '10倍の改善で誰も乗り換えない',
      'ラストムーバー（最後に市場支配する者が最大利益）',
      '4要素：①独自技術 ②ネットワーク効果 ③規模の経済 ④ブランディング',
    ],
  },
  ltv: {
    title: 'LTV最大化',
    points: [
      '結論：CPAを抑えてLTVを伸ばす＝利益LTVを伸ばす',
      '「問題解決＋目標達成＋目標再設定」を仕込む',
      '痛み除去だけでなくパフォーマンス向上まで',
      '来れば来るほど患者の利益になる流れ',
    ],
  },
}

// 神経整体3ステップ施術フレーム
export const TREATMENT_FRAMEWORK = {
  steps: [
    {
      step: 1,
      name: 'リセット',
      sub: 'マイナスをゼロに戻す',
      description: '可動域＋筋出力を正常化。代償動作を解消し最大値を引き出す',
    },
    {
      step: 2,
      name: 'プラスを作る',
      sub: '基礎を積み上げる',
      description: '姿勢保持筋・基礎筋力を向上。楽に良い姿勢を保てる状態へ',
    },
    {
      step: 3,
      name: '機能性向上＋パフォーマンス',
      sub: '人生のパフォーマンスを上げる',
      description: '日常動作・スポーツ動作のトレーニング。人生で出したいパフォーマンスへ',
    },
  ],
  functionalValue: [
    '原因がわかる',
    '生活が変わる',
    '再発への不安が減る',
    '自分で対処できる感覚が戻る',
    '将来を諦めなくていいと思える',
  ],
  emotionalValue: [
    '安心',
    '納得',
    '尊重されている感覚',
    '希望',
    '主体性が戻る',
    '「やっと理解された」',
  ],
}

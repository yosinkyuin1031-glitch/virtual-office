// 事業目標・KPI・年度ターゲットデータ
// メモリファイルから正確な数字を反映（2026-03-27時点）

export interface KPI {
  label: string
  value: string
  current: string
  icon: string
}

export interface YearlyTarget {
  revenue: string
  detail: string
}

export interface BusinessGoals {
  mission: string
  vision: string
  value: string
  role: string
  kpis: KPI[]
  currentFocus: string[]
  yearlyTargets: Record<string, YearlyTarget>
  fourPillars: { name: string; role: string; scalability: string }[]
  csf: string[]
}

export const businessGoals: BusinessGoals = {
  // 2026年3月24日 新横浜経営合宿にて策定
  mission: '「できない」を「できる」に変え、光を灯す。',
  vision: '挑戦を諦めない人が増え、温かく支え合える社会。',
  value: '想いを創造し、チャレンジを楽しむ。',
  role: '想いに寄り添い、共に成長できる環境を創るサポーター。',

  kpis: [
    { label: '整体院 月商目標', value: '200〜300万円', current: '約240万円', icon: '💰' },
    { label: '訪問鍼灸 月商目標', value: '160〜300万円', current: '—', icon: '🏠' },
    { label: 'BtoB アプリ導入院数', value: '50院', current: '10院（MEOモニター）', icon: '🏥' },
    { label: '開発プロダクト数', value: '—', current: '45個', icon: '📱' },
    { label: '物販サブスク月額', value: '15万円/月', current: '—', icon: '🛒' },
    { label: 'サブスク会員数', value: '—', current: '27人（月54〜61万円）', icon: '🔄' },
    { label: '月間MRR（BtoB）', value: '125万円（12ヶ月後）', current: '8.9万円', icon: '📈' },
    { label: '既存単価UP', value: '12,000円', current: '9,500円', icon: '⬆️' },
  ],

  currentFocus: [
    '検査アプリSaaS化（Supabase Auth + RLS + Stripe月額5,500円）',
    'MEO勝ち上げくんモニター10名→有料転換（月額1,980円、6月切替）',
    'BtoB Facebook教育ローンチ（認知→Zoom商談→月額契約）',
    '高額メニュー3つ作成（睡眠・頭髪・体質改善ダイエット）',
    'UTAGE構築（広告→リスト→教育→来院→成約の自動化）',
    '訪問スタッフ3名体制の確立（業務委託）',
  ],

  yearlyTargets: {
    '令和8年（2026年）': {
      revenue: '整体院2,400〜3,600万 + 訪問鍼灸1,920〜3,600万',
      detail: '整体院月商200-300万（週3.5-4日）、訪問鍼灸月商160-300万、BtoB SaaS立ち上げ、法人化準備',
    },
    '2年後（32歳）': {
      revenue: '6,850万円',
      detail: '訪問スタッフ5人、技術セミナー300万、睡眠・自律神経特化サロン年1,200万',
    },
    '3年後（33歳）': {
      revenue: '9,400万円',
      detail: '訪問スタッフ7人、スポーツジム経営開始年1,800万',
    },
  },

  fourPillars: [
    { name: '整体院経営', role: '実績・ノウハウの源泉、安定収益', scalability: '低（労働集約）' },
    { name: '訪問鍼灸リハビリ', role: 'スタッフ稼働で売上拡大', scalability: '中（人を増やせば伸びる）' },
    { name: '治療機器販売', role: 'BR 44万・血管顕微鏡 33万のBtoB', scalability: '中（高単価・実績ベース）' },
    { name: 'アプリ開発（BtoB SaaS）', role: 'Claude Codeで開発、ストック型収益', scalability: '高（ストック型）' },
  ],

  csf: [
    '既存単価UP（9,500円→12,000円）',
    '高額メニュー作成（睡眠・頭髪・ダイエット）',
    'YouTube＋折込に広告費集中（ROAS最良チャネル）',
    'BtoB SaaS 限定20名ベータ→月額課金転換',
  ],
}

// 2025年実績サマリー
export const performance2025 = {
  annualRevenue: '24,354,226円',
  newPatientRevenue: '17,975,928円（70%）',
  existingRevenue: '6,378,298円（30%）',
  newPatients: 148,
  averageLTV: '121,459円',
  repeaterLTV: '151,058円',
  totalVisits: 1909,
  monthlyCards: 50,
  visitFrequency: 3.0,
  bestMonth: '369万円（11月）',
  topChannels: [
    { name: 'YouTube', ltv: '21万円', patients: 21 },
    { name: 'チラシ', ltv: '20万円', patients: 5 },
    { name: '折込', ltv: '20万円', patients: 28 },
    { name: 'HP', ltv: '13万円', patients: 85 },
  ],
}

// BtoB SaaS 価格表
export const btobPricing = {
  apps: [
    { name: '検査アプリ', monthly: '5,500円', buyout: '55,000〜110,000円', priority: 1 },
    { name: '顧客管理シート', monthly: '4,980円', buyout: '49,800円', priority: 2 },
    { name: '予約管理', monthly: '2,980円', buyout: '29,800円', priority: 3 },
    { name: 'WEB問診', monthly: '2,980円', buyout: '29,800円', priority: 4 },
    { name: 'MEO勝ち上げくん', monthly: '2,980円', buyout: '29,800円', priority: 5 },
    { name: '睡眠チェック', monthly: '1,980円', buyout: '19,800円', priority: 6 },
  ],
  setDiscount: [
    { count: 2, discount: '5%OFF' },
    { count: 3, discount: '10%OFF' },
    { count: 4, discount: '15%OFF' },
    { count: 5, discount: '20%OFF' },
    { count: 6, discount: '25%OFF' },
  ],
  integratedPlan: {
    standard: '月額19,800円（5アプリ統合）/ 年額198,000円',
    premium: '月額39,800円（全機能+カスタマイズ+サポート）',
    setupFee: '初期設定費用110,000円',
  },
}

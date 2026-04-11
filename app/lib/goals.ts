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
    { name: 'Clinic Core', monthly: '4,980円', buyout: '49,800円', priority: 2 },
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

// 整体院 詳細KPI
export const seitaiDetailKPIs = {
  monthlyRevenue: { target: '200〜300万円', current: '約240万円' },
  karteCount: { target: '65枚', current: '61枚' },
  visitFrequency: { target: '3.5回', current: '3.0回' },
  subscriptionRevenue: { target: '80万円', current: '54〜61万円' },
  utilizationRate: { target: '75%', current: '71%' },
  unitPrice: { target: '12,000円', current: '9,500円' },
  subscriptionMembers: { target: '35人', current: '27人' },
  highEndMenus: { target: '3つ（睡眠・頭髪・ダイエット）', current: '準備中' },
  physicalProductsMonthly: { target: '15万円/月', current: '—' },
}

// 訪問鍼灸ロードマップ
export const houmonRoadmap = {
  current: { staff: 2, monthlyRevenue: '160万円', model: '健康保険モデル・取り分25〜30%' },
  year1: { staff: 3, monthlyRevenue: '220万円', focus: '業務委託契約化・右腕育成・初芝事務所整備' },
  year2: { staff: 5, monthlyRevenue: '—', age: '32歳' },
  year3: { staff: 7, monthlyRevenue: '—', age: '33歳' },
}

// 2026年 重点施策8つ
export const priorityInitiatives2026 = [
  '初芝事務所の施術・セミナー対応化',
  '訪問スタッフ3人の業務委託契約化',
  '右腕育成（施術長候補）',
  'BR・血管顕微鏡のBtoBツール化',
  'オンライン睡眠カウンセリング開始',
  'UTAGE構築（広告→リスト→教育→来院→成約の自動化）',
  '既存患者の教育自動化（LINE・動画）',
  '検査アプリSaaS化・BtoB月額課金スタート',
]

// 長期ビジョン
export const longTermVision = [
  { timeline: '2026年', goal: '法人化準備・4事業体制確立', revenue: '4,320〜7,200万円' },
  { timeline: '2年後（32歳）', goal: '技術セミナー300万・睡眠特化サロン年1,200万', revenue: '6,850万円' },
  { timeline: '3年後（33歳）', goal: 'スポーツジム経営開始・年1,800万', revenue: '9,400万円' },
  { timeline: '長期', goal: '市内マンション購入・奈良に川サウナ・アーシング施設', revenue: '—' },
]

// BtoB販売導線
export const btobSalesFunnel = [
  { step: 1, name: '認知', channel: 'Facebook投稿（週3〜5回）', detail: 'AIアプリ優先 / 治療機器 / 整体院経営 / 訪問鍼灸 / ストーリー' },
  { step: 2, name: 'リスト取り', channel: 'オープンチャット「治療家のためのアプリ活用ラボ」', detail: '価値提供8：告知2の比率' },
  { step: 3, name: '検討', channel: 'Zoom実演会/個別相談（月1〜2回）', detail: '実際の画面を見せてデモ' },
  { step: 4, name: '購入', channel: 'アプリ購入サイト（Stripe決済）', detail: '限定20名ベータ→月額転換' },
  { step: 5, name: '継続', channel: '導入サポート・アップセル', detail: 'カスタマーサクセスによる定着化' },
]

// BtoBポジショニング
export const btobPositioning = {
  title: '治療家プログラマー',
  name: '大口陽平',
  uniqueness: '現役治療家が自分で使うアプリを作って同業者に売る唯一のポジション',
  brandMessage: '治療家が、自分の手で院を変えられる時代が来た。僕はそのためのツールを、現場の治療家として作り続ける。',
  stance: '「売る人」ではなく「一緒に現場を良くする仲間」。押し売りしない、必要ない人には正直に言う。成功も失敗も泥臭い部分も見せる。',
}

// 院のポジショニング・ブランド
export const clinicBrand = {
  positioning: '病院と整体院のあいだで、筋骨格だけではなく神経まで含めて身体を見直す場所',
  taglines: [
    'どこに行っても変わらなかった理由を、一緒に見つける整体院',
    '治療の前に、まず原因を知る場所',
  ],
  strengths: [
    '神経整体 × 内臓 × 骨格 × 東洋医学と幅広い考えがある',
    'ソフトな施術が中心',
    '重症・慢性症状に特化した治療院',
    '姿勢・歩行・生活動作まで確認する',
    '改善後の未来づくりまで寄り添う',
  ],
  purpose: '痛みや不調で止まった人生に、もう一度「自由にやりたい事をやってもいい」という選択肢を渡すため。',
  fivePrinciples: [
    { name: '判断を奪わない', do: '選択肢を出して「どうしたいですか？」で締める', dont: '結論を決めてあげない' },
    { name: '人生を否定しない', do: '過去の治療・選択を肯定する', dont: '他院・過去・人生の否定' },
    { name: '誠実に伝える', do: '良いこと＋厳しいことをセットで言う', dont: '断言・誇張' },
    { name: '尊厳を守る', do: '結果が出なくても関係を切らない', dont: '成果＝価値にしない' },
    { name: '人生のベクトルを忘れない', do: 'ゴールは生活・人生の中に置く', dont: '痛みだけを見る' },
  ],
}

// 商品コンセプト5段階
export const productConcept = [
  { step: 1, label: '痛み和らげる' },
  { step: 2, label: '歪み整える' },
  { step: 3, label: '血流・腸内環境の改善・吸収排泄の改善' },
  { step: 4, label: '栄養補給' },
  { step: 5, label: '自律神経失調症改善' },
]

// スケールトーク5段階
export const scaleTalk = [
  { level: 1, label: '疲労感・軽度のストレス', detail: 'ストレスでだるくなる' },
  { level: 2, label: '身体的不調', detail: '何かしらの症状出る' },
  { level: 3, label: '精神的な疾患・情緒不安定', detail: '内臓の不調、お通じ、逆流性' },
  { level: 4, label: '社会生活の困難', detail: '精神的にやむ' },
  { level: 5, label: '日常生活の困難', detail: '動けなくなる→社会復帰できない、家族と疎遠' },
]

// 週間設計
export const weeklyDesign = [
  { day: '月', content: '新規のみ・作業', patients: 10, meaning: '判断・評価' },
  { day: '火', content: '施術', patients: 10, meaning: '安定' },
  { day: '水', content: '思考・構築', patients: 0, meaning: '未来（院にいない日）' },
  { day: '木', content: '施術', patients: 10, meaning: '安定' },
  { day: '金', content: '施術', patients: 10, meaning: '安定' },
  { day: '土', content: '施術・学び', patients: 8, meaning: '余白' },
  { day: '日', content: '完全オフ', patients: 0, meaning: '回復' },
]

// 稼働設計
export const operationDesign = {
  daysPerMonth: 15,
  hoursPerDay: 10,
  slotsPerHour: 2,
  totalSlots: 300,
  utilizationTarget: '70%',
  activeSlots: 210,
  newPatientSlots: '月10人（2時間枠 = 20時間）',
}

// 月別キャンペーン計画
export const monthlyCampaigns = [
  { month: 1, theme: 'ダイエット＋お年玉', target: '新規・既存', hook: '正月太りリセット' },
  { month: 2, theme: '痛み・痺れ', target: '新規・掘り起こし', hook: '冷え×神経痛' },
  { month: 3, theme: '腸内環境・ファスティング・物販', target: '既存', hook: '花粉・アレルギー対策' },
  { month: 4, theme: '自律神経', target: '新規', hook: '新生活疲労' },
  { month: 5, theme: '自律神経', target: '新規', hook: '5月病・GW明け疲労' },
  { month: 6, theme: '頭痛', target: '新規', hook: '梅雨×気圧×頭痛' },
  { month: 7, theme: 'ダイエット＋七夕', target: '新規・既存', hook: '熱中症予防の体作り・冷房病対策' },
  { month: 8, theme: '睡眠', target: '新規', hook: '熱中症予防・睡眠の質' },
  { month: 9, theme: '抜け毛・薄毛・育毛', target: '既存', hook: '夏ダメージ×抜け毛' },
  { month: 10, theme: '痛み・痺れ', target: '新規・掘り起こし', hook: '年末に向けた早期対策' },
  { month: 11, theme: '腸内環境・ファスティング・物販', target: '既存', hook: '冷え性予防・冷えに強い体作り' },
  { month: 12, theme: '関節痛・神経痛', target: '新規', hook: '寒さによる関節痛対策' },
]

// 広告チャネル別ROAS
export const adChannelROAS = [
  { channel: 'YouTube', ltv: '21万円', patients: 21, roas: '最高', note: '信頼度が高く来院意欲も高い' },
  { channel: 'チラシ', ltv: '20万円', patients: 5, roas: '高い', note: '少数だがLTVが高い' },
  { channel: '折込', ltv: '20万円', patients: 28, roas: '高い', note: '件数も多くバランス良い' },
  { channel: 'HP', ltv: '13万円', patients: 85, roas: '中', note: '最多だがLTVは相対的に低い' },
]

// 契約ルール
export const contractRules = {
  minContractPeriod: '6ヶ月（月額プラン）',
  earlyTerminationFee: '残り月数 × 月額料金',
  reRegistration: '不可（解約済みメールアドレスはブロック）',
  suspensionBehavior: 'is_active=false → /suspended ページにリダイレクト',
}

// 顧客セグメント
export const customerSegments = [
  { name: '超優良', criteria: 'サブスク + 物販 + 回数券再購入', approach: 'VIP対応・特別案内' },
  { name: '優良', criteria: '回数券購入・定期来院', approach: '継続フォロー・アップセル' },
  { name: 'リピーター', criteria: '月1〜2回来院', approach: '頻度向上・サブスク提案' },
  { name: 'その他', criteria: '単発・離脱予備軍', approach: '再来院フォロー・LINE配信' },
]

// 事業全体タスク（10カテゴリ）
export const businessTaskCategories = [
  { id: 1, name: '整体院の安定化', key: 'stability', tasks: ['回数券再購入増', 'リピートトーク見直し', 'サブスクで80万円', 'カルテ65枚', 'LTV向上', '来院頻度3→3.5回'] },
  { id: 2, name: '集客', key: 'marketing', tasks: ['HP編集', 'GMB投稿', 'LINE配信', 'Instagram', 'YouTube', 'LP作成', 'Facebook', 'チラシ'] },
  { id: 3, name: '物販で50万円', key: 'products', tasks: ['棚づくり', 'POP作成', 'パッケージ化', '栄養学習', '仕入れ値と販売値の確認'] },
  { id: 4, name: 'ダイエットメニュー', key: 'diet', tasks: ['松竹梅の作成', 'モニター募集', 'LINE配信', '口コミ集め'] },
  { id: 5, name: '睡眠カウンセリング', key: 'sleep', tasks: ['メニュー作成', 'リール動画', 'LINE設定', 'セミナー学習'] },
  { id: 6, name: '訪問鍼灸', key: 'houmon', tasks: ['LP移行', '技術育成', '新聞折込', '施設体験会', 'スタッフ追加', 'PPC広告'] },
  { id: 7, name: 'ファン化', key: 'fan', tasks: ['LINE教育', 'YouTubeセルフケア', '差し入れ', 'ストーリー共有'] },
  { id: 8, name: 'マインド', key: 'mindset', tasks: ['自然・温泉', 'メンター', '目標確認', '運動', 'ぶれない自分軸'] },
  { id: 9, name: '運気', key: 'luck', tasks: ['望み続ける', '目標待ち受け', '参拝', '思考', '断捨離', '掃除', '親孝行'] },
  { id: 10, name: '環境整備', key: 'environment', tasks: ['サブスク書類', 'POP作成', '院内模様替え', '固定費見直し', '体重管理'] },
]

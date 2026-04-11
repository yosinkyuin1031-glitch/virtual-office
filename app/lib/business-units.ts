// 5事業の定義と分類ロジック

export interface BusinessUnit {
  name: string
  emoji: string
  keywords: string[] // 部署名・タスク名からマッチングするキーワード
}

export const BUSINESS_UNITS: BusinessUnit[] = [
  {
    name: '経営本社',
    emoji: '🏢',
    keywords: ['経営', '家賃', '引き落とし', 'アメックス', '振込', '統計表', '月間目標', '翌月目標', '業務委託費', '財務', '経理', '法人'],
  },
  {
    name: '大口神経整体院',
    emoji: '🏥',
    keywords: ['整体', '大口', 'MEO', 'GBP', 'LP', 'SEO', '集客', '予約', '顧客管理', '問診', '検査', 'メニュー', 'EC', '物販', 'HeatScope', 'ポイント', 'カラダマップ', '睡眠チェック', '栄養', '腸内'],
  },
  {
    name: '晴陽鍼灸院',
    emoji: '🏠',
    keywords: ['訪問', '鍼灸', '晴陽', 'ケアマネ', 'レセプト', '訪問鍼灸', 'リハビリ', 'スタッフ管理'],
  },
  {
    name: '治療機器販売',
    emoji: '🔧',
    keywords: ['BR', '血管', '機器', '治療機器', 'バイオレゾナンス', '顕微鏡'],
  },
  {
    name: 'アプリ事業',
    emoji: '💻',
    keywords: ['SaaS', 'アプリ', 'BtoB', '開発', 'Stripe', '課金', 'バーチャルオフィス', 'AI開発', 'プロダクト', 'インフラ', 'Vercel', 'Supabase', 'GitHub', 'MEO勝ち上げ', '販売サイト', '統合プラン'],
  },
  {
    name: '治療家コミュニティ・コンサル',
    emoji: '🤝',
    keywords: ['コミュニティ', 'FCL', 'セミナー', 'コンサル', 'アカデミー', '瀬戸口', 'Facebook', '治療家', '川口村', '西村', 'グループコンサル', '隠居'],
  },
]

// 部署名・タスク名から5事業のいずれかに分類
export function classifyTaskByUnit(department: string, title: string): string {
  const text = `${department} ${title}`.toLowerCase()

  for (const unit of BUSINESS_UNITS) {
    for (const keyword of unit.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return unit.name
      }
    }
  }

  // 部署名による直接マッチ
  if (department.includes('経営') || department.includes('財務')) return '経営本社'
  if (department.includes('整体院')) return '大口神経整体院'
  if (department.includes('訪問鍼灸')) return '晴陽鍼灸院'
  if (department.includes('BtoB営業')) return '治療機器販売'
  if (department.includes('AI開発') || department.includes('プロダクト')) return 'アプリ事業'
  if (department.includes('カスタマー')) return '治療家コミュニティ'

  // デフォルト: アプリ事業
  return 'アプリ事業'
}

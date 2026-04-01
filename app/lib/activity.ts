// 活動ログデータ（社員の作業履歴を時系列で記録）

export interface ActivityLog {
  id: string
  employee: string
  department: string
  action: string
  detail: string
  timestamp: string
  status: 'completed' | 'in_progress' | 'failed'
  icon?: string
}

// 最新の活動ログ
export const activityLogs: ActivityLog[] = [
  {
    id: 'act-001',
    employee: 'コウ',
    department: 'AI開発部',
    action: 'バーチャルオフィス データ拡充',
    detail: '目標・KPI・週間設計・キャンペーン・BtoB販売導線など53件のコンテキストデータ投入',
    timestamp: '2026-04-01T10:00:00',
    status: 'completed',
    icon: '💻',
  },
  {
    id: 'act-002',
    employee: 'ハル',
    department: '整体院事業部',
    action: '4月キャンペーン開始',
    detail: '自律神経ケアキャンペーン開始・GBP投稿スケジュール設定・新生活疲労訴求',
    timestamp: '2026-04-01T09:00:00',
    status: 'in_progress',
    icon: '🏥',
  },
  {
    id: 'act-003',
    employee: 'テツ',
    department: 'AI開発部',
    action: 'BtoB SaaS 4月戦略策定',
    detail: 'MEOモニター有料転換準備・検査アプリSaaS課金テスト・Zoom商談3件予定',
    timestamp: '2026-04-01T08:30:00',
    status: 'in_progress',
    icon: '🤖',
  },
  {
    id: 'act-004',
    employee: 'ジン',
    department: 'BtoB営業部',
    action: 'Facebook投稿カレンダー実行中',
    detail: '4月FB投稿20本計画・Zoom商談3件・競合AI姿勢分析ツール差別化レポート完成',
    timestamp: '2026-04-01T08:00:00',
    status: 'in_progress',
    icon: '🤝',
  },
  {
    id: 'act-005',
    employee: 'アキ',
    department: '訪問鍼灸事業部',
    action: '4月営業計画スタート',
    detail: 'ケアマネ新規営業10件・訪問スタッフ3名体制に向けた採用活動開始',
    timestamp: '2026-04-01T08:00:00',
    status: 'in_progress',
    icon: '🏠',
  },
  {
    id: 'act-006',
    employee: 'リク',
    department: 'AI開発部',
    action: '検査アプリStripe課金テスト完了',
    detail: 'マルチテナント最終テスト・月額5,500円のStripe Checkout+Webhook動作確認済み',
    timestamp: '2026-03-31T20:00:00',
    status: 'completed',
    icon: '⚙️',
  },
  {
    id: 'act-007',
    employee: 'ミサ',
    department: '財務部',
    action: '3月度収支確定',
    detail: '整体院月商240万円・訪問鍼灸月商確定・4月投資計画策定',
    timestamp: '2026-03-31T18:00:00',
    status: 'completed',
    icon: '💰',
  },
  {
    id: 'act-008',
    employee: 'アオイ',
    department: 'カスタマーサクセス部',
    action: 'モニター10名フォロー完了',
    detail: 'MEOモニター全10名の利用状況確認・キーワード選定サポート・6月有料転換準備',
    timestamp: '2026-03-31T16:00:00',
    status: 'completed',
    icon: '🤗',
  },
  {
    id: 'act-009',
    employee: 'マヤ',
    department: 'LP・Web制作部',
    action: '自律神経LP最適化完了',
    detail: '4月キャンペーン用LP準備・気圧×自律神経のSEO記事公開',
    timestamp: '2026-03-31T14:00:00',
    status: 'completed',
    icon: '🎨',
  },
  {
    id: 'act-010',
    employee: 'タク',
    department: 'AI開発部',
    action: '全サイト稼働監視中',
    detail: '全30サイト正常稼働確認・バーチャルオフィスv4.0デプロイ完了',
    timestamp: '2026-04-01T07:00:00',
    status: 'completed',
    icon: '🖥️',
  },
]

// ステータスの表示設定
export const activityStatusConfig: Record<ActivityLog['status'], { label: string; color: string; bgColor: string }> = {
  completed: { label: '完了', color: '#22C55E', bgColor: '#F0FDF4' },
  in_progress: { label: '進行中', color: '#3B82F6', bgColor: '#EFF6FF' },
  failed: { label: '失敗', color: '#EF4444', bgColor: '#FEF2F2' },
}

// 新しい活動ログを生成するヘルパー
export function createActivityLog(
  employee: string,
  department: string,
  action: string,
  detail: string,
  status: ActivityLog['status'] = 'completed',
  icon?: string
): ActivityLog {
  return {
    id: `act-${Date.now()}`,
    employee,
    department,
    action,
    detail,
    timestamp: new Date().toISOString(),
    status,
    icon,
  }
}

// 部署別にフィルタするヘルパー
export function getActivitiesByDepartment(department: string): ActivityLog[] {
  return activityLogs.filter(a => a.department === department)
}

// 日付でソートして取得するヘルパー
export function getRecentActivities(limit: number = 10): ActivityLog[] {
  return [...activityLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

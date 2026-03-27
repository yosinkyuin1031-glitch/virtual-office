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

// 最新の活動ログ（サンプルデータ）
export const activityLogs: ActivityLog[] = [
  {
    id: 'act-001',
    employee: 'タク',
    department: 'AI開発部',
    action: 'デプロイ完了',
    detail: 'バーチャルオフィスv3.0をVercelにデプロイ完了・全30サイト稼働監視中',
    timestamp: '2026-03-27T18:00:00',
    status: 'completed',
    icon: '🖥️',
  },
  {
    id: 'act-002',
    employee: 'リク',
    department: 'AI開発部',
    action: 'MEO勝ち上げくん機能強化',
    detail: 'UX改善・競合分析パネル・順位変動アラート・Stripe課金基盤・利用規約ページ追加',
    timestamp: '2026-03-26T20:00:00',
    status: 'completed',
    icon: '⚙️',
  },
  {
    id: 'act-003',
    employee: 'ジン',
    department: 'BtoB営業部',
    action: 'MEOモニター配布',
    detail: 'LINEグループにガイドURL送信済み・モニターが自己サインアップで登録開始',
    timestamp: '2026-03-26T15:00:00',
    status: 'completed',
    icon: '🤝',
  },
  {
    id: 'act-004',
    employee: 'レン',
    department: 'プロダクト管理部',
    action: 'セキュリティ監査',
    detail: '全アプリセキュリティ監査実施。WEB問診・睡眠管理・MEO・検査シートを修正済み',
    timestamp: '2026-03-27T14:00:00',
    status: 'completed',
    icon: '🔍',
  },
  {
    id: 'act-005',
    employee: 'コウ',
    department: 'AI開発部',
    action: 'バーチャルオフィス改修中',
    detail: '事業目標・KPI・知識管理のデータ構造を追加',
    timestamp: '2026-03-27T19:00:00',
    status: 'in_progress',
    icon: '💻',
  },
  {
    id: 'act-006',
    employee: 'ミサ',
    department: '財務部',
    action: 'Stripe課金フロー設計',
    detail: '統合プラン（月額19,800円）のStripe Checkout+Webhook設計中',
    timestamp: '2026-03-27T16:00:00',
    status: 'in_progress',
    icon: '💰',
  },
  {
    id: 'act-007',
    employee: 'カナ',
    department: 'プロダクト管理部',
    action: 'アプリ統合計画策定',
    detail: '治療院OS（院内5アプリ統合）のロードマップ・Phase1〜3の計画',
    timestamp: '2026-03-27T12:00:00',
    status: 'in_progress',
    icon: '📊',
  },
  {
    id: 'act-008',
    employee: 'ハル',
    department: '整体院事業部',
    action: '4月キャンペーン準備',
    detail: 'Q2訴求テーマ：気圧×自律神経・頭痛・肩首痛。GBP週2投稿スケジュール設定',
    timestamp: '2026-03-27T10:00:00',
    status: 'in_progress',
    icon: '🏥',
  },
  {
    id: 'act-009',
    employee: 'マヤ',
    department: 'LP・Web制作部',
    action: 'MEO勝ち上げくん営業スライド作成',
    detail: '競合調査→5つの強み→HTMLプレゼンテーション完成',
    timestamp: '2026-03-27T11:00:00',
    status: 'completed',
    icon: '🎨',
  },
  {
    id: 'act-010',
    employee: 'アオイ',
    department: 'カスタマーサクセス部',
    action: 'モニターフォロー',
    detail: 'MEOモニター10名の利用状況確認・サインアップ問題解決・キーワード選定サポート',
    timestamp: '2026-03-26T18:00:00',
    status: 'completed',
    icon: '🤗',
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

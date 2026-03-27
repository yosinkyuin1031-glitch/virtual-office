// 知識管理データ（AIが学んだ情報・フィードバック・ルールの蓄積）
// メモリファイルのfeedback_系から構築

export interface KnowledgeEntry {
  id: string
  category: 'work_style' | 'personality' | 'preference' | 'business_rule' | 'quality' | 'security'
  title: string
  content: string
  source: 'auto_learned' | 'manual' | 'feedback'
  learnedAt: string
  priority: 'high' | 'medium' | 'low'
}

export const knowledgeCategories: Record<KnowledgeEntry['category'], { label: string; icon: string; color: string }> = {
  work_style: { label: '作業スタイル', icon: '🔧', color: '#3B82F6' },
  personality: { label: '性格・特性', icon: '🧠', color: '#8B5CF6' },
  preference: { label: '好み・方針', icon: '💡', color: '#F59E0B' },
  business_rule: { label: '事業ルール', icon: '📏', color: '#EF4444' },
  quality: { label: '品質基準', icon: '✅', color: '#22C55E' },
  security: { label: 'セキュリティ', icon: '🔒', color: '#6366F1' },
}

export const knowledgeBase: KnowledgeEntry[] = [
  // === 作業スタイル（work_style） ===
  {
    id: 'ws-001',
    category: 'work_style',
    title: '確認クリック完全省略',
    content: '確認クリックを省略し自然に処理を進める。Yes/No確認・Enter押下を一切求めず、指示されたことをそのまま最後まで自動で進める。途中で「よろしいですか？」と聞かない。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ws-002',
    category: 'work_style',
    title: 'デプロイは自動化済み',
    content: 'git push後Vercel自動デプロイ。新規の場合はgit init→push→vercel --yes→vercel --prod。環境変数はVercel CLIで設定。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ws-003',
    category: 'work_style',
    title: 'フォルダ整理の厳守',
    content: 'アプリ・サイト作成時は必ず /Users/ooguchiyouhei/事業/ 配下に専用フォルダ+プロジェクト情報.mdを作成。日本語で分かりやすい名前。随時整理。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ws-004',
    category: 'work_style',
    title: '三点一致ルール',
    content: 'フォルダ名・管理ファイル（data.ts）・画面表示の3つを必ず同時に更新する。片方だけの更新は禁止。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ws-005',
    category: 'work_style',
    title: 'スキルファイルの随時更新',
    content: 'アプリに新機能を追加したり構成を変更した場合は、対応するスキルファイルも更新する。新しいアプリにはスキルファイルも新規作成。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
  {
    id: 'ws-006',
    category: 'work_style',
    title: 'プロジェクトハブの随時更新',
    content: '新しいアプリやサイトを作成・URL変更・削除した際はプロジェクト管理ダッシュボード（project-hub）のデータも必ず更新。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
  {
    id: 'ws-007',
    category: 'work_style',
    title: 'バーチャルオフィス同期ルール',
    content: '文章添削・投稿テンプレート修正時は、mdファイルだけでなくバーチャルオフィスのdocuments.tsにも必ずHTML変換して反映する。指示がなくても自動同期。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ws-008',
    category: 'work_style',
    title: '毎晩22時の日報ルール',
    content: '毎日夜10時（22:00）に全社活動レポートを報告する。各部署ごとに完了事項・成果物・数値をまとめる。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
  {
    id: 'ws-009',
    category: 'work_style',
    title: 'アプリ完成時にスライド作成',
    content: 'アプリが完成・機能整備されたら営業・紹介用スライドを作成する。競合リサーチ→構成設計→HTMLスライド→強み資料の流れ。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },

  // === 性格・特性（personality） ===
  {
    id: 'ps-001',
    category: 'personality',
    title: '結果重視',
    content: '技術の細かい説明より結果を重視する。技術に不慣れなため、丁寧な案内が必要。',
    source: 'auto_learned',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'ps-002',
    category: 'personality',
    title: '得意と苦手',
    content: '得意：挑戦、とりあえずやる、コツコツ、傾聴、発想、立案。苦手：数字の分析、入力作業、言語化、整理、デザイン、最後まで突き詰める。苦手な部分をAI社員が補完する。',
    source: 'auto_learned',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
  {
    id: 'ps-003',
    category: 'personality',
    title: 'モチベーション源泉',
    content: '自由と挑戦とパワーの可能性。ワクワクすること・成長を最優先。虚無らないために「本人が自分で選べる状態を取り戻す」立ち位置にいる。',
    source: 'auto_learned',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },

  // === 好み・方針（preference） ===
  {
    id: 'pf-001',
    category: 'preference',
    title: '文章作成スタイル',
    content: 'AI記事っぽい文体にしない。絵文字を使わない。AI独特の記号（━━、★、▶︎、✅ など）を使わない。アプリ紹介は名前だけの箇条書きで数の多さで圧倒させる。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'pf-002',
    category: 'preference',
    title: '所在地は大阪',
    content: '所在地は大阪（横浜ではない）。大口神経整体院は大阪市住吉区長居。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },

  // === 事業ルール（business_rule） ===
  {
    id: 'br-001',
    category: 'business_rule',
    title: 'BtoB表記ルール',
    content: 'BtoBと表記する（B2Bではなく）。全ての文書・コード・UIで統一。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'br-002',
    category: 'business_rule',
    title: '顧客対応5原則',
    content: '①判断を奪わない ②人生を否定しない ③誠実に伝える ④尊厳を守る ⑤人生のベクトルを忘れない',
    source: 'manual',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'br-003',
    category: 'business_rule',
    title: '外注先フォルダ管理',
    content: '外注パートナーのアプリは /事業/AI会社/外注先/[パートナー名]/ に保存。現在：ファンチャンネル、瀬戸口、田中新作。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
  {
    id: 'br-004',
    category: 'business_rule',
    title: 'デスクトップ整理は随時',
    content: 'デスクトップ・フォルダの整理は随時行う。スクショは「スクショ」フォルダ、画面収録は「画面収録」フォルダに移動。不要ファイルは削除。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'low',
  },

  // === 品質基準（quality） ===
  {
    id: 'qa-001',
    category: 'quality',
    title: '外部展開を見据えた品質',
    content: '顧客管理シートは外部展開予定。不具合を根本から潰す。全角/半角スペース、部分一致、表記ゆれのエッジケースを事前に潰す。場当たり的でなく根本的・汎用的な解決。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },

  // === セキュリティ（security） ===
  {
    id: 'sc-001',
    category: 'security',
    title: '全アプリ共通セキュリティ基準',
    content: '認証ミドルウェア必須、RLS（clinic_idでデータ分離）、APIキーは環境変数管理、APIルート保護、XSS対策（DOMPurify）、サーバーサイドクライアント推奨。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'high',
  },
  {
    id: 'sc-002',
    category: 'security',
    title: 'Vercelプロジェクト名ルール',
    content: '汎用名（app, web, site等）は禁止。アプリが特定できる名前にする。例: meo-kachiagekun, customer-mgmt。',
    source: 'feedback',
    learnedAt: '2026-03-27',
    priority: 'medium',
  },
]

// カテゴリ別に知識を取得するヘルパー
export function getKnowledgeByCategory(category: KnowledgeEntry['category']): KnowledgeEntry[] {
  return knowledgeBase.filter(k => k.category === category)
}

// 優先度でソートして取得するヘルパー
export function getKnowledgeSorted(): KnowledgeEntry[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...knowledgeBase].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

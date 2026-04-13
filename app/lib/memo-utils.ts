// 音声メモ・Plaud同期 共通ユーティリティ
// voice-memo/route.ts と plaud-sync/route.ts から共通で使用

export const BUSINESS_KEYWORDS: Record<string, string> = {
  '整体': 'seitai',
  '訪問': 'houmon',
  '鍼灸': 'houmon',
  '晴陽': 'houmon',
  'アプリ': 'app_sales',
  'カラダマップ': 'app_sales',
  'クリニックコア': 'app_sales',
  'Clinic Core': 'app_sales',
  'ポイント管理': 'app_sales',
  'BR': 'device',
  '機器': 'device',
  '血管': 'device',
  'コンサル': 'consulting',
  '秘密基地': 'consulting',
  '西村': 'consulting',
}

export const DEPT_KEYWORDS: Record<string, string> = {
  '整体': '整体院事業部',
  '訪問': '訪問鍼灸事業部',
  'AI': 'AI開発部',
  'BtoB': 'BtoB営業部',
  'YouTube': 'メディア部',
  '動画': 'メディア部',
  'LP': 'LP・Web制作部',
  'SEO': 'LP・Web制作部',
  'デザイン': '動画・デザイン制作部',
  '財務': '財務部',
  '経理': '財務部',
  'リサーチ': 'リサーチ・ナレッジ部',
  '競合': 'リサーチ・ナレッジ部',
  'ヒアリング': 'リサーチ・ナレッジ部',
  'コンサル': 'コンサル事業部',
  '秘密基地': 'コンサル事業部',
  '機器': '治療機器販売部',
  'BR': '治療機器販売部',
  '広告': '広告運用部',
  'Meta': '広告運用部',
}

export function detectBusinessTags(text: string): string[] {
  const tags = new Set<string>()
  for (const [kw, tag] of Object.entries(BUSINESS_KEYWORDS)) {
    if (text.includes(kw)) tags.add(tag)
  }
  return Array.from(tags)
}

export function detectDepartmentTags(text: string): string[] {
  const tags = new Set<string>()
  for (const [kw, dept] of Object.entries(DEPT_KEYWORDS)) {
    if (text.includes(kw)) tags.add(dept)
  }
  return Array.from(tags)
}

export function detectCategory(text: string): { category: string; cleaned: string } {
  const trimmed = text.trim()
  if (trimmed.startsWith('方針:') || trimmed.startsWith('方針：')) {
    return { category: 'direction', cleaned: trimmed.replace(/^方針[:：]\s*/, '') }
  }
  if (trimmed.startsWith('気づき:') || trimmed.startsWith('気づき：')) {
    return { category: 'insight', cleaned: trimmed.replace(/^気づき[:：]\s*/, '') }
  }
  if (trimmed.startsWith('タスク:') || trimmed.startsWith('タスク：')) {
    return { category: 'task', cleaned: trimmed.replace(/^タスク[:：]\s*/, '') }
  }
  // キーワードベースで自動推定
  if (/決めた|やる|やらない|方針|戦略|絶対|必ず/.test(trimmed)) {
    return { category: 'direction', cleaned: trimmed }
  }
  if (/気づき|発見|なるほど|わかった|学んだ|知った/.test(trimmed)) {
    return { category: 'insight', cleaned: trimmed }
  }
  return { category: 'general', cleaned: trimmed }
}

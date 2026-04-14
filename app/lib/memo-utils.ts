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

// 長文を事業トピックごとに分割する
export interface TopicBlock {
  content: string
  business_tags: string[]
  department_tags: string[]
  category: string
  title: string
}

export function splitByTopics(text: string): TopicBlock[] {
  // 段落で分割（空行 or 句点+改行）
  const paragraphs = text
    .split(/\n{2,}|(?<=[。．\.\!！\?？])\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  if (paragraphs.length === 0) return []

  // 各段落に事業タグを付与
  const tagged = paragraphs.map(p => ({
    text: p,
    biz: detectBusinessTags(p),
    dept: detectDepartmentTags(p),
  }))

  // 同じ事業タグの連続する段落をまとめる
  const blocks: TopicBlock[] = []
  let currentBlock: { texts: string[]; biz: Set<string>; dept: Set<string> } = {
    texts: [],
    biz: new Set(),
    dept: new Set(),
  }

  const bizKey = (tags: string[]) => tags.sort().join(',') || '_none_'

  for (let i = 0; i < tagged.length; i++) {
    const t = tagged[i]
    const prevKey = bizKey(Array.from(currentBlock.biz))
    const thisKey = bizKey(t.biz)

    // 事業タグが変わったら新ブロック（ただし空タグは前のブロックに吸収）
    if (currentBlock.texts.length > 0 && t.biz.length > 0 && prevKey !== '_none_' && thisKey !== prevKey) {
      // 前のブロックを確定
      const content = currentBlock.texts.join('\n')
      const { category, cleaned } = detectCategory(content)
      blocks.push({
        content: cleaned,
        business_tags: Array.from(currentBlock.biz),
        department_tags: Array.from(currentBlock.dept),
        category,
        title: cleaned.slice(0, 50),
      })
      currentBlock = { texts: [], biz: new Set(), dept: new Set() }
    }

    currentBlock.texts.push(t.text)
    t.biz.forEach(b => currentBlock.biz.add(b))
    t.dept.forEach(d => currentBlock.dept.add(d))
  }

  // 最後のブロック
  if (currentBlock.texts.length > 0) {
    const content = currentBlock.texts.join('\n')
    const { category, cleaned } = detectCategory(content)
    blocks.push({
      content: cleaned,
      business_tags: Array.from(currentBlock.biz),
      department_tags: Array.from(currentBlock.dept),
      category,
      title: cleaned.slice(0, 50),
    })
  }

  // ブロックが1つしかなければそのまま返す
  // 全部同じ事業なら分割しない
  if (blocks.length <= 1) return blocks

  return blocks
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

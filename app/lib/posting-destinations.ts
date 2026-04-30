// アウトプット種別ごとの投稿先リンク
// 「コピー＋投稿先タブ起動」のための定義集

export interface Destination {
  key: string
  label: string
  url: string
  emoji: string
}

export const DESTINATIONS: Record<string, Destination> = {
  gbp_seitai: {
    key: 'gbp_seitai',
    label: 'GBP（神経整体）',
    url: 'https://business.google.com/',
    emoji: '📍',
  },
  gbp_houmon: {
    key: 'gbp_houmon',
    label: 'GBP（晴陽鍼灸）',
    url: 'https://business.google.com/',
    emoji: '📍',
  },
  threads_seitai: {
    key: 'threads_seitai',
    label: 'Threads（整体）',
    url: 'https://www.threads.net/',
    emoji: '🧵',
  },
  threads_houmon: {
    key: 'threads_houmon',
    label: 'Threads（訪問鍼灸）',
    url: 'https://www.threads.net/',
    emoji: '🧵',
  },
  threads_btob: {
    key: 'threads_btob',
    label: 'Threads（BtoB）',
    url: 'https://www.threads.net/',
    emoji: '🧵',
  },
  facebook_btob: {
    key: 'facebook_btob',
    label: 'Facebook（アプリ事業）',
    url: 'https://www.facebook.com/',
    emoji: '📘',
  },
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/',
    emoji: '📷',
  },
  line_official: {
    key: 'line_official',
    label: 'LINE公式（一斉配信）',
    url: 'https://manager.line.biz/',
    emoji: '💬',
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube Studio',
    url: 'https://studio.youtube.com/',
    emoji: '📺',
  },
  blog_seitai: {
    key: 'blog_seitai',
    label: '院内ブログ',
    url: 'https://oguchi-shinkei-seitai.com/wp-admin/',
    emoji: '✍️',
  },
}

// コンテンツのタイトル・本文・部署・事業から投稿先を推定する
export function suggestDestinations(input: {
  title: string
  body: string
  department?: string | null
  businessUnit?: string | null
}): Destination[] {
  const text = `${input.title} ${input.body} ${input.department ?? ''}`.toLowerCase()
  const unit = input.businessUnit ?? ''
  const keys = new Set<string>()

  // GBP
  if (text.includes('gbp') || text.includes('gmb') || text.includes('googleビジネス') || text.includes('google投稿') || text.includes('meo')) {
    if (unit.includes('訪問') || text.includes('訪問')) keys.add('gbp_houmon')
    else keys.add('gbp_seitai')
  }

  // Threads
  if (text.includes('threads') || text.includes('スレッズ')) {
    if (unit.includes('訪問') || text.includes('訪問')) keys.add('threads_houmon')
    else if (unit.includes('アプリ') || text.includes('btob') || text.includes('アプリ事業')) keys.add('threads_btob')
    else keys.add('threads_seitai')
  }

  // Facebook（CLAUDE.mdルール: アプリ事業のみ）
  if (text.includes('facebook') || text.includes('fb投稿') || text.includes('fb記事')) {
    keys.add('facebook_btob')
  }

  // Instagram
  if (text.includes('instagram') || text.includes('インスタ')) {
    keys.add('instagram')
  }

  // LINE
  if (text.includes('line配信') || text.includes('line一斉') || text.includes('line公式') || text.includes('lineステップ')) {
    keys.add('line_official')
  }

  // YouTube
  if (text.includes('youtube') || text.includes('動画台本') || text.includes('shorts')) {
    keys.add('youtube')
  }

  // ブログ
  if (text.includes('ブログ') || text.includes('記事') && unit.includes('整体院')) {
    keys.add('blog_seitai')
  }

  return Array.from(keys).map((k) => DESTINATIONS[k]).filter(Boolean)
}

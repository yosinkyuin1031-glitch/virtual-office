'use client'

import { useMemo } from 'react'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

// スマブラキャラ定義
interface SmashDef {
  label: string
  bg: string        // 背景グラデーション色1
  bg2: string       // 背景グラデーション色2
  icon: string      // 大きな絵文字アイコン
  badge?: string    // 小さなバッジ絵文字
}

const smashMap: Record<string, SmashDef> = {
  'レイア':  { label: 'マリオ',         bg: '#E74C3C', bg2: '#C0392B', icon: '🍄', badge: '⭐' },
  'ソラト':  { label: 'C.ファルコン',   bg: '#1565C0', bg2: '#0D47A1', icon: '🦅', badge: '⚡' },
  'ミコ':    { label: 'ピーチ',         bg: '#FF69B4', bg2: '#E91E63', icon: '👑', badge: '🌸' },
  'ミサ':    { label: 'ワリオ',         bg: '#FFD700', bg2: '#FFA000', icon: '💰', badge: '💪' },
  'ハル':    { label: 'リンク',         bg: '#2E7D32', bg2: '#1B5E20', icon: '🗡️', badge: '🛡️' },
  'ナギ':    { label: 'サムス',         bg: '#FF6F00', bg2: '#E65100', icon: '🔫', badge: '🚀' },
  'フミ':    { label: 'ネス',           bg: '#FFD700', bg2: '#E74C3C', icon: '⚾', badge: '✨' },
  'アキ':    { label: 'ドンキーコング', bg: '#8B4513', bg2: '#5D4037', icon: '🦍', badge: '🍌' },
  'ユキ':    { label: 'ルイージ',       bg: '#2E7D32', bg2: '#1B5E20', icon: '💚', badge: '👻' },
  'サク':    { label: 'インクリング',   bg: '#FF6F00', bg2: '#E91E63', icon: '🦑', badge: '🎨' },
  'テツ':    { label: 'メガマン',       bg: '#1565C0', bg2: '#0097A7', icon: '🤖', badge: '💥' },
  'コウ':    { label: 'フォックス',     bg: '#4E342E', bg2: '#3E2723', icon: '🦊', badge: '🔫' },
  'リク':    { label: 'ファルコ',       bg: '#1565C0', bg2: '#455A64', icon: '🐦', badge: '✈️' },
  'タク':    { label: 'メタナイト',     bg: '#311B92', bg2: '#1A237E', icon: '⚔️', badge: '🦇' },
  'ツキ':    { label: 'カービィ',       bg: '#FF69B4', bg2: '#E91E63', icon: '⭐', badge: '🌟' },
  'ルナ':    { label: 'ゼルダ',         bg: '#7B1FA2', bg2: '#4A148C', icon: '🔮', badge: '✨' },
  'マヤ':    { label: 'ジョーカー',     bg: '#212121', bg2: '#E74C3C', icon: '🃏', badge: '🎭' },
  'リン':    { label: 'パルテナ',       bg: '#4CAF50', bg2: '#FFD700', icon: '🏛️', badge: '💫' },
  'ノア':    { label: 'ベヨネッタ',     bg: '#212121', bg2: '#7B1FA2', icon: '🌙', badge: '💎' },
  'ジン':    { label: 'シュルク',       bg: '#E74C3C', bg2: '#D32F2F', icon: '⚔️', badge: '💡' },
  'セナ':    { label: 'ルカリオ',       bg: '#1565C0', bg2: '#0D47A1', icon: '🐺', badge: '💙' },
  'ヒカ':    { label: 'ピカチュウ',     bg: '#FFD700', bg2: '#FFA000', icon: '⚡', badge: '💛' },
  'スイ':    { label: 'ヨッシー',       bg: '#4CAF50', bg2: '#2E7D32', icon: '🥚', badge: '🌿' },
  'ルカ':    { label: 'R.O.B.',         bg: '#9E9E9E', bg2: '#616161', icon: '🤖', badge: '🔧' },
  'カナ':    { label: 'ロイ',           bg: '#E74C3C', bg2: '#1565C0', icon: '🔥', badge: '⚔️' },
  'ミオ':    { label: 'クラウド',       bg: '#311B92', bg2: '#212121', icon: '⚔️', badge: '☁️' },
  'レン':    { label: 'ソニック',       bg: '#1565C0', bg2: '#0D47A1', icon: '💨', badge: '💍' },
}

function createCharacterSVG(def: SmashDef, size: number): string {
  const s = size
  const r = s / 2
  // アイコンのフォントサイズ
  const iconSize = s * 0.5
  const badgeSize = s * 0.22

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${def.bg}"/>
        <stop offset="100%" stop-color="${def.bg2}"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="${r}" cy="${r}" r="${r - 1}" fill="url(#bg)" stroke="${def.bg2}" stroke-width="1.5"/>
    <circle cx="${r}" cy="${r}" r="${r - 4}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="${r}" y="${r + iconSize * 0.17}" text-anchor="middle" font-size="${iconSize}" filter="url(#shadow)">${def.icon}</text>
    ${def.badge ? `<circle cx="${s * 0.78}" cy="${s * 0.22}" r="${badgeSize * 0.7}" fill="${def.bg}" stroke="white" stroke-width="1.5"/>
    <text x="${s * 0.78}" y="${s * 0.22 + badgeSize * 0.15}" text-anchor="middle" font-size="${badgeSize}">${def.badge}</text>` : ''}
  </svg>`
}

function createFallbackSVG(color: string, size: number): string {
  const s = size
  const r = s / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${color}88"/>
      </linearGradient>
    </defs>
    <circle cx="${r}" cy="${r}" r="${r - 1}" fill="url(#bg)" stroke="${color}" stroke-width="1.5"/>
    <text x="${r}" y="${r + 8}" text-anchor="middle" font-size="${s * 0.4}">🎮</text>
  </svg>`
}

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  const def = smashMap[name]

  const imgSrc = useMemo(() => {
    if (def) {
      const svg = createCharacterSVG(def, 128) // 高解像度で生成
      return `data:image/svg+xml,${encodeURIComponent(svg)}`
    }
    const svg = createFallbackSVG(color, 128)
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }, [name, def, color])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img
        src={imgSrc}
        alt={def ? `${name} (${def.label})` : name}
        width={size}
        height={size}
        style={{ borderRadius: '50%' }}
        className={
          status === 'busy' ? 'animate-run' :
          status === 'idle' ? 'animate-sleep' :
          status === 'meeting' ? 'animate-talk' :
          'animate-work'
        }
      />

      {status === 'idle' && (
        <div className="absolute -top-1 -right-1 animate-bounce-slow">
          <span style={{ fontSize: size * 0.3 }}>💤</span>
        </div>
      )}
      {status === 'busy' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse">
          <span style={{ fontSize: size * 0.25 }}>🔥</span>
        </div>
      )}
      {status === 'working' && (
        <div className="absolute -top-1 -right-1">
          <span className="animate-pulse" style={{ fontSize: size * 0.22 }}>⚡</span>
        </div>
      )}
      {status === 'meeting' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <span style={{ fontSize: size * 0.22 }}>💬</span>
        </div>
      )}
    </div>
  )
}

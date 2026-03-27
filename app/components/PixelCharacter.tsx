'use client'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

// キャラクター定義
interface CharDef {
  hairStyle: 'longStraight' | 'bob' | 'ponytail' | 'shortNeat' | 'spiky' | 'messy' | 'twinTail' | 'updo'
  hairColor: string
  hairHL: string
  skin: string
  eyes: string
  outfit: string
  outfitAcc: string
  shoes: string
  glasses?: boolean
  headband?: string
}

// 全29名のキャラクター定義
const chars: Record<string, CharDef> = {
  // ── 経営層 ──
  'レイア': {
    hairStyle: 'longStraight', hairColor: '#E8C547', hairHL: '#FFF3B0',
    skin: '#FFE0BD', eyes: '#3366CC',
    outfit: '#8B1A1A', outfitAcc: '#FFD700', shoes: '#4A0E0E',
  },
  'ソラト': {
    hairStyle: 'shortNeat', hairColor: '#1C2833', hairHL: '#4A6FA5',
    skin: '#F5CBA7', eyes: '#1B4F72',
    outfit: '#1B2631', outfitAcc: '#AEB6BF', shoes: '#17202A',
  },
  'ミコ': {
    hairStyle: 'bob', hairColor: '#C9876D', hairHL: '#E8B89D',
    skin: '#FDEBD0', eyes: '#6C3483',
    outfit: '#F0F3F4', outfitAcc: '#85C1E9', shoes: '#D5D8DC',
  },
  'ルカ': {
    hairStyle: 'longStraight', hairColor: '#7B5B3A', hairHL: '#A87E5A',
    skin: '#FDEBD0', eyes: '#5D4037',
    outfit: '#F5F0E1', outfitAcc: '#C9A96E', shoes: '#8D6E63', glasses: true,
  },
  // ── 財務部 ──
  'ミサ': {
    hairStyle: 'bob', hairColor: '#2C2C2C', hairHL: '#555555',
    skin: '#FFE0BD', eyes: '#1B5E20',
    outfit: '#1B5E20', outfitAcc: '#A5D6A7', shoes: '#1B3A1B',
  },
  // ── 整体院事業部 ──
  'ハル': {
    hairStyle: 'messy', hairColor: '#A0522D', hairHL: '#CD853F',
    skin: '#F5CBA7', eyes: '#E91E63',
    outfit: '#E91E63', outfitAcc: '#F8BBD0', shoes: '#880E4F',
  },
  'ナギ': {
    hairStyle: 'ponytail', hairColor: '#6A1B9A', hairHL: '#AB47BC',
    skin: '#FDEBD0', eyes: '#4A148C',
    outfit: '#263238', outfitAcc: '#80CBC4', shoes: '#1A1A2E',
  },
  'フミ': {
    hairStyle: 'messy', hairColor: '#A67C52', hairHL: '#D4A76A',
    skin: '#FFE0BD', eyes: '#795548',
    outfit: '#BCAAA4', outfitAcc: '#FFAB91', shoes: '#6D4C41',
  },
  // ── 訪問鍼灸事業部 ──
  'アキ': {
    hairStyle: 'shortNeat', hairColor: '#4A2800', hairHL: '#7B4A1A',
    skin: '#F5CBA7', eyes: '#E65100',
    outfit: '#E65100', outfitAcc: '#FFB74D', shoes: '#BF360C',
  },
  'ユキ': {
    hairStyle: 'ponytail', hairColor: '#D4A76A', hairHL: '#F0D9A0',
    skin: '#FDEBD0', eyes: '#5D4037',
    outfit: '#ECEFF1', outfitAcc: '#90A4AE', shoes: '#78909C',
  },
  'サク': {
    hairStyle: 'twinTail', hairColor: '#E040A0', hairHL: '#F48FB1',
    skin: '#FFE0BD', eyes: '#E040A0',
    outfit: '#FF6F00', outfitAcc: '#FFCA28', shoes: '#E65100',
  },
  // ── AI開発部 ──
  'テツ': {
    hairStyle: 'spiky', hairColor: '#1A237E', hairHL: '#3F51B5',
    skin: '#F5CBA7', eyes: '#0D47A1',
    outfit: '#212121', outfitAcc: '#4FC3F7', shoes: '#0D0D0D',
  },
  'コウ': {
    hairStyle: 'spiky', hairColor: '#1B5E20', hairHL: '#4CAF50',
    skin: '#FFE0BD', eyes: '#2E7D32',
    outfit: '#1A1A1A', outfitAcc: '#00E676', shoes: '#111111',
  },
  'リク': {
    hairStyle: 'shortNeat', hairColor: '#5D4037', hairHL: '#8D6E63',
    skin: '#F5CBA7', eyes: '#3E2723',
    outfit: '#37474F', outfitAcc: '#80DEEA', shoes: '#263238',
  },
  'タク': {
    hairStyle: 'spiky', hairColor: '#333333', hairHL: '#666666',
    skin: '#FFE0BD', eyes: '#455A64',
    outfit: '#455A64', outfitAcc: '#FFE082', shoes: '#37474F',
    headband: '#FFE082',
  },
  // ── メディア部 ──
  'ツキ': {
    hairStyle: 'messy', hairColor: '#90A4AE', hairHL: '#CFD8DC',
    skin: '#FDEBD0', eyes: '#311B92',
    outfit: '#311B92', outfitAcc: '#EA80FC', shoes: '#1A0A5E',
  },
  'ルナ': {
    hairStyle: 'longStraight', hairColor: '#1A237E', hairHL: '#5C6BC0',
    skin: '#FFE0BD', eyes: '#283593',
    outfit: '#3F51B5', outfitAcc: '#C5CAE9', shoes: '#1A237E',
  },
  // ── LP・Web制作部 ──
  'マヤ': {
    hairStyle: 'ponytail', hairColor: '#7B1FA2', hairHL: '#CE93D8',
    skin: '#FDEBD0', eyes: '#6A1B9A',
    outfit: '#9C27B0', outfitAcc: '#E1BEE7', shoes: '#6A1B9A',
  },
  'リン': {
    hairStyle: 'bob', hairColor: '#2E7D32', hairHL: '#66BB6A',
    skin: '#FFE0BD', eyes: '#1B5E20',
    outfit: '#E8F5E9', outfitAcc: '#4CAF50', shoes: '#388E3C',
  },
  'ノア': {
    hairStyle: 'longStraight', hairColor: '#E0D4C8', hairHL: '#F5EDE6',
    skin: '#FDEBD0', eyes: '#5D4037',
    outfit: '#212121', outfitAcc: '#CFB997', shoes: '#1A1A1A',
  },
  // ── BtoB営業部 ──
  'ジン': {
    hairStyle: 'shortNeat', hairColor: '#212121', hairHL: '#484848',
    skin: '#F5CBA7', eyes: '#BF360C',
    outfit: '#1B2631', outfitAcc: '#F39C12', shoes: '#0D1117',
  },
  'セナ': {
    hairStyle: 'bob', hairColor: '#3E2723', hairHL: '#6D4C41',
    skin: '#FFE0BD', eyes: '#4E342E',
    outfit: '#5D4037', outfitAcc: '#FFCC80', shoes: '#3E2723', glasses: true,
  },
  // ── 動画・デザイン制作部 ──
  'ヒカ': {
    hairStyle: 'messy', hairColor: '#212121', hairHL: '#555555',
    skin: '#F5CBA7', eyes: '#E65100',
    outfit: '#424242', outfitAcc: '#FF7043', shoes: '#212121',
  },
  'スイ': {
    hairStyle: 'twinTail', hairColor: '#E8A0D0', hairHL: '#F0C8E8',
    skin: '#FDEBD0', eyes: '#8E24AA',
    outfit: '#F3E5F5', outfitAcc: '#CE93D8', shoes: '#AB47BC',
  },
  // ── プロダクト管理部 ──
  'カナ': {
    hairStyle: 'updo', hairColor: '#4A2800', hairHL: '#7B4A1A',
    skin: '#FFE0BD', eyes: '#3E2723',
    outfit: '#1565C0', outfitAcc: '#90CAF9', shoes: '#0D47A1',
  },
  'ミオ': {
    hairStyle: 'bob', hairColor: '#1565C0', hairHL: '#64B5F6',
    skin: '#FDEBD0', eyes: '#0D47A1',
    outfit: '#E3F2FD', outfitAcc: '#42A5F5', shoes: '#1565C0',
  },
  'レン': {
    hairStyle: 'spiky', hairColor: '#37474F', hairHL: '#78909C',
    skin: '#F5CBA7', eyes: '#263238',
    outfit: '#546E7A', outfitAcc: '#A5D6A7', shoes: '#37474F',
  },
  // ── カスタマーサクセス部 ──
  'アオイ': {
    hairStyle: 'longStraight', hairColor: '#00838F', hairHL: '#4DD0E1',
    skin: '#FFE0BD', eyes: '#006064',
    outfit: '#00838F', outfitAcc: '#B2EBF2', shoes: '#00695C',
  },
  'ショウ': {
    hairStyle: 'shortNeat', hairColor: '#BF360C', hairHL: '#E64A19',
    skin: '#F5CBA7', eyes: '#D84315',
    outfit: '#D84315', outfitAcc: '#FFAB91', shoes: '#BF360C',
  },
}

// ─── SVG 描画コンポーネント ───

function HairBack({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'longStraight':
      return (
        <>
          <ellipse cx="32" cy="20" rx="19" ry="17" fill={color} />
          <rect x="13" y="20" width="7" height="28" rx="3.5" fill={color} />
          <rect x="44" y="20" width="7" height="28" rx="3.5" fill={color} />
        </>
      )
    case 'bob':
      return (
        <>
          <ellipse cx="32" cy="19" rx="18" ry="16" fill={color} />
          <rect x="14" y="19" width="6" height="16" rx="3" fill={color} />
          <rect x="44" y="19" width="6" height="16" rx="3" fill={color} />
        </>
      )
    case 'ponytail':
      return (
        <>
          <ellipse cx="32" cy="19" rx="17" ry="15" fill={color} />
          <ellipse cx="49" cy="18" rx="5" ry="4" fill={color} />
          <path d="M49 22 Q54 30 52 40 Q50 42 48 40 Q50 32 47 24 Z" fill={color} />
        </>
      )
    case 'twinTail':
      return (
        <>
          <ellipse cx="32" cy="19" rx="17" ry="15" fill={color} />
          <path d="M15 18 Q10 26 12 38 Q14 40 16 38 Q12 28 15 22Z" fill={color} />
          <path d="M49 18 Q54 26 52 38 Q50 40 48 38 Q52 28 49 22Z" fill={color} />
          <circle cx="16" cy="16" r="2.5" fill={color} />
          <circle cx="48" cy="16" r="2.5" fill={color} />
        </>
      )
    case 'updo':
      return (
        <>
          <ellipse cx="32" cy="19" rx="17" ry="15" fill={color} />
          <ellipse cx="32" cy="6" rx="8" ry="7" fill={color} />
        </>
      )
    case 'shortNeat':
    case 'spiky':
    case 'messy':
    default:
      return <ellipse cx="32" cy="16" rx="16" ry="12" fill={color} />
  }
}

function HairFront({ style, color, hl }: { style: string; color: string; hl: string }) {
  const bangs = (
    <path
      d="M17 22 C17 14 22 8 32 7 C42 8 47 14 47 22 L44 18 C42 12 38 9 32 9 C26 9 22 12 20 18Z"
      fill={color}
    />
  )
  const highlight = (
    <path
      d="M23 14 C27 9 37 9 41 14 C37 11 27 11 23 14Z"
      fill={hl}
      opacity="0.7"
    />
  )

  switch (style) {
    case 'longStraight':
    case 'bob':
    case 'ponytail':
    case 'twinTail':
    case 'updo':
      return <>{bangs}{highlight}</>
    case 'spiky':
      return (
        <>
          <path d="M16 22 C14 10 24 4 32 3 C40 4 50 10 48 22 L46 18 C44 10 38 6 32 6 C26 6 20 10 18 18Z" fill={color} />
          <polygon points="22,10 18,0 26,8" fill={color} />
          <polygon points="30,6 28,-2 34,5" fill={color} />
          <polygon points="40,8 44,0 38,7" fill={color} />
          <path d="M24 8 C28 4 36 4 40 8 C36 6 28 6 24 8Z" fill={hl} opacity="0.7" />
        </>
      )
    case 'messy':
      return (
        <>
          <path d="M16 22 C16 12 22 6 32 5 C42 6 48 12 48 22 L45 17 C43 11 38 8 32 7 C26 8 21 11 19 17Z" fill={color} />
          <polygon points="18,12 14,3 22,10" fill={color} />
          <polygon points="28,7 26,0 32,6" fill={color} />
          <polygon points="40,8 44,2 38,7" fill={color} />
          <polygon points="46,14 50,6 44,12" fill={color} />
          <path d="M22 10 C26 6 38 6 42 10 C38 8 26 8 22 10Z" fill={hl} opacity="0.7" />
        </>
      )
    case 'shortNeat':
      return (
        <>
          <path d="M18 22 C18 14 24 8 32 7 C40 8 46 14 46 22 L44 19 C43 13 39 10 32 9 C25 10 21 13 20 19Z" fill={color} />
          <path d="M24 12 C28 8 36 8 40 12 C36 10 28 10 24 12Z" fill={hl} opacity="0.7" />
        </>
      )
    default:
      return <>{bangs}{highlight}</>
  }
}

function Face({ skin, eyes, blush }: { skin: string; eyes: string; blush?: boolean }) {
  return (
    <>
      {/* 顔 */}
      <ellipse cx="32" cy="28" rx="13" ry="12" fill={skin} />
      {/* 頬の赤み */}
      <ellipse cx="21" cy="32" rx="3" ry="1.8" fill="#FFB6C1" opacity="0.35" />
      <ellipse cx="43" cy="32" rx="3" ry="1.8" fill="#FFB6C1" opacity="0.35" />
      {/* 目（白目） */}
      <ellipse cx="26" cy="27" rx="3.2" ry="3.8" fill="white" />
      <ellipse cx="38" cy="27" rx="3.2" ry="3.8" fill="white" />
      {/* 目（瞳） */}
      <ellipse cx="26.8" cy="27.8" rx="2.2" ry="2.8" fill={eyes} />
      <ellipse cx="38.8" cy="27.8" rx="2.2" ry="2.8" fill={eyes} />
      {/* 目（瞳の中心） */}
      <ellipse cx="27" cy="28.2" rx="1.2" ry="1.6" fill="#111" />
      <ellipse cx="39" cy="28.2" rx="1.2" ry="1.6" fill="#111" />
      {/* ハイライト */}
      <circle cx="27.8" cy="26.2" r="1.2" fill="white" />
      <circle cx="39.8" cy="26.2" r="1.2" fill="white" />
      <circle cx="26" cy="28.5" r="0.6" fill="white" opacity="0.6" />
      <circle cx="38" cy="28.5" r="0.6" fill="white" opacity="0.6" />
      {/* 口 */}
      <path d="M29 33.5 Q32 35.5 35 33.5" stroke="#D4886B" fill="none" strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

function Glasses() {
  return (
    <>
      <circle cx="26" cy="27" r="5.5" fill="none" stroke="#5D4037" strokeWidth="1.2" />
      <circle cx="38" cy="27" r="5.5" fill="none" stroke="#5D4037" strokeWidth="1.2" />
      <line x1="31.5" y1="27" x2="32.5" y2="27" stroke="#5D4037" strokeWidth="1.2" />
      <line x1="14" y1="26" x2="20.5" y2="27" stroke="#5D4037" strokeWidth="0.8" />
      <line x1="50" y1="26" x2="43.5" y2="27" stroke="#5D4037" strokeWidth="0.8" />
    </>
  )
}

function Body({ outfit, accent, shoes, skin }: { outfit: string; accent: string; shoes: string; skin: string }) {
  return (
    <>
      {/* 首 */}
      <rect x="29" y="38" width="6" height="4" fill={skin} />
      {/* 胴体 */}
      <path d="M22 42 Q22 40 26 40 L38 40 Q42 40 42 42 L43 56 Q43 58 41 58 L23 58 Q21 58 21 56Z" fill={outfit} />
      {/* 襟・アクセント */}
      <path d="M28 40 L32 46 L36 40" fill={accent} opacity="0.5" />
      {/* 腕 */}
      <path d="M22 42 Q16 45 14 52 Q14 54 16 54 Q18 50 22 47Z" fill={outfit} />
      <path d="M42 42 Q48 45 50 52 Q50 54 48 54 Q46 50 42 47Z" fill={outfit} />
      {/* 手 */}
      <circle cx="15" cy="53" r="3" fill={skin} />
      <circle cx="49" cy="53" r="3" fill={skin} />
      {/* 脚 */}
      <rect x="24" y="58" width="7" height="4" rx="1" fill={outfit} opacity="0.8" />
      <rect x="33" y="58" width="7" height="4" rx="1" fill={outfit} opacity="0.8" />
      {/* 靴 */}
      <rect x="23" y="62" width="8" height="4" rx="2" fill={shoes} />
      <rect x="33" y="62" width="8" height="4" rx="2" fill={shoes} />
    </>
  )
}

function Headband({ color }: { color: string }) {
  return (
    <path d="M17 20 Q32 16 47 20 Q32 18 17 20Z" fill={color} strokeWidth="2" stroke={color} />
  )
}

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  const c = chars[name]

  // フォールバック
  if (!c) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}60, ${color}30)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, border: `2px solid ${color}40`,
      }}>
        {name[0]}
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 72"
        style={{ borderRadius: '50%', overflow: 'hidden' }}
        className={
          status === 'busy' ? 'animate-pulse' :
          status === 'idle' ? 'opacity-60' :
          ''
        }
      >
        {/* 背景 */}
        <defs>
          <radialGradient id={`bg-${name}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={`${color}30`} />
            <stop offset="100%" stopColor={`${color}10`} />
          </radialGradient>
        </defs>
        <rect width="64" height="72" fill={`url(#bg-${name})`} />

        {/* キャラクター本体 */}
        <g transform="translate(0, 2)">
          {/* 髪（後ろ） */}
          <HairBack style={c.hairStyle} color={c.hairColor} />

          {/* 体 */}
          <Body outfit={c.outfit} accent={c.outfitAcc} shoes={c.shoes} skin={c.skin} />

          {/* 顔 */}
          <Face skin={c.skin} eyes={c.eyes} />

          {/* 髪（前） */}
          <HairFront style={c.hairStyle} color={c.hairColor} hl={c.hairHL} />

          {/* メガネ */}
          {c.glasses && <Glasses />}

          {/* ヘッドバンド */}
          {c.headband && <Headband color={c.headband} />}
        </g>
      </svg>

      {/* ステータスインジケーター */}
      <div
        className="absolute bottom-0 right-0"
        style={{
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor:
            status === 'busy' ? '#EF4444' :
            status === 'working' ? '#22C55E' :
            status === 'meeting' ? '#F59E0B' :
            '#9CA3AF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />

      {/* ステータスエフェクト */}
      {status === 'busy' && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-pulse">
          <span style={{ fontSize: size * 0.22 }}>🔥</span>
        </div>
      )}
      {status === 'meeting' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-bounce">
          <span style={{ fontSize: size * 0.22 }}>💬</span>
        </div>
      )}
    </div>
  )
}

'use client'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

// 各社員のアバターシード（一貫した見た目を維持するため固定）
const avatarSeeds: Record<string, string> = {
  'レイア': 'Reia-CEO-queen',
  'ソラト': 'Sorato-COO-commander',
  'ミコ': 'Miko-secretary-organizer',
  'ルカ': 'Ruka-documents-librarian',
  'ミサ': 'Misa-CFO-finance',
  'ハル': 'Haru-marketing-adventurer',
  'ナギ': 'Nagi-appmanager-techgirl',
  'フミ': 'Fumi-writer-creative',
  'アキ': 'Aki-sales-warrior',
  'ユキ': 'Yuki-receipt-admin',
  'サク': 'Saku-sns-trendy',
  'テツ': 'Tetsu-aidev-engineer',
  'コウ': 'Kou-aidev-hacker',
  'リク': 'Riku-saas-builder',
  'タク': 'Taku-infra-guardian',
  'ツキ': 'Tsuki-youtube-media',
  'ルナ': 'Luna-content-analyst',
  'マヤ': 'Maya-lpdesign-artist',
  'リン': 'Rin-seo-writer',
  'ノア': 'Noa-premium-luxury',
  'ジン': 'Jin-btob-salesman',
  'セナ': 'Sena-research-detective',
  'ヒカ': 'Hika-video-creator',
  'スイ': 'Sui-design-illustrator',
  'カナ': 'Kana-pm-strategist',
  'ミオ': 'Mio-uxui-designer',
  'レン': 'Ren-qa-tester',
}

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  const seed = avatarSeeds[name] || name
  // DiceBear Adventurer スタイル（イラスト風キャラクター）
  const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent&radius=50`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}30, ${color}15)`,
          border: `2px solid ${color}40`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          loading="lazy"
          className={
            status === 'busy' ? 'animate-run' :
            status === 'idle' ? 'opacity-60' :
            status === 'meeting' ? 'animate-talk' :
            'animate-work'
          }
        />
      </div>

      {/* ステータスインジケーター */}
      <div
        className="absolute bottom-0 right-0"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor:
            status === 'busy' ? '#EF4444' :
            status === 'working' ? '#22C55E' :
            status === 'meeting' ? '#F59E0B' :
            '#9CA3AF',
        }}
      />

      {status === 'busy' && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-pulse">
          <span style={{ fontSize: size * 0.22 }}>🔥</span>
        </div>
      )}
      {status === 'meeting' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <span style={{ fontSize: size * 0.22 }}>💬</span>
        </div>
      )}
    </div>
  )
}

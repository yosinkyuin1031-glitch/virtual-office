'use client'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  // キャラごとにユニークな特徴を生成（名前ベースのハッシュ）
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const hairStyle = hash % 4 // 0-3の髪型
  const skinTone = ['#FFDBB4', '#F5C6A5', '#E8B896', '#D4A574'][hash % 4]
  const eyeColor = ['#2C3E50', '#1A1A2E', '#16213E', '#0F3460'][hash % 4]

  const scale = size / 64

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        style={{ imageRendering: 'pixelated' }}
        className={
          status === 'busy' ? 'animate-run' :
          status === 'idle' ? 'animate-sleep' :
          status === 'meeting' ? 'animate-talk' :
          'animate-work'
        }
      >
        {/* 髪の毛 */}
        {hairStyle === 0 && (
          <>
            <rect x="4" y="1" width="8" height="1" fill={color} />
            <rect x="3" y="2" width="10" height="2" fill={color} />
          </>
        )}
        {hairStyle === 1 && (
          <>
            <rect x="5" y="1" width="6" height="1" fill={color} />
            <rect x="4" y="2" width="8" height="1" fill={color} />
            <rect x="3" y="3" width="10" height="1" fill={color} />
          </>
        )}
        {hairStyle === 2 && (
          <>
            <rect x="4" y="1" width="8" height="2" fill={color} />
            <rect x="3" y="2" width="2" height="3" fill={color} />
            <rect x="11" y="2" width="2" height="3" fill={color} />
          </>
        )}
        {hairStyle === 3 && (
          <>
            <rect x="5" y="0" width="6" height="1" fill={color} />
            <rect x="4" y="1" width="8" height="2" fill={color} />
          </>
        )}

        {/* 顔 */}
        <rect x="5" y="3" width="6" height="5" fill={skinTone} />
        <rect x="4" y="4" width="1" height="3" fill={skinTone} />
        <rect x="11" y="4" width="1" height="3" fill={skinTone} />

        {/* 目 */}
        {status === 'idle' ? (
          <>
            {/* 閉じた目（寝てる） */}
            <rect x="6" y="5" width="2" height="1" fill={eyeColor} opacity="0.5" />
            <rect x="9" y="5" width="2" height="1" fill={eyeColor} opacity="0.5" />
          </>
        ) : (
          <>
            {/* 開いた目 */}
            <rect x="6" y="4" width="2" height="2" fill="white" />
            <rect x="9" y="4" width="2" height="2" fill="white" />
            <rect x="7" y="5" width="1" height="1" fill={eyeColor} />
            <rect x="10" y="5" width="1" height="1" fill={eyeColor} />
          </>
        )}

        {/* 口 */}
        {status === 'busy' ? (
          <rect x="7" y="7" width="2" height="1" fill="#E74C3C" /> // 開いた口（叫んでる）
        ) : status === 'meeting' ? (
          <>
            <rect x="7" y="7" width="3" height="1" fill="#E74C3C" />
          </>
        ) : (
          <rect x="8" y="7" width="1" height="1" fill="#C0392B" /> // 普通の口
        )}

        {/* 体（服） */}
        <rect x="4" y="8" width="8" height="4" fill={color} />
        <rect x="3" y="9" width="1" height="3" fill={color} />
        <rect x="12" y="9" width="1" height="3" fill={color} />

        {/* 襟・ネクタイ */}
        <rect x="7" y="8" width="2" height="1" fill="white" />
        <rect x="7" y="9" width="2" height="2" fill={color === '#FFD700' ? '#FF6B6B' : '#3498DB'} />

        {/* 腕 */}
        {status === 'busy' ? (
          <>
            {/* 走ってる腕（前後に振る） */}
            <rect x="2" y="9" width="1" height="2" fill={skinTone} className="animate-arm-left" />
            <rect x="13" y="10" width="1" height="2" fill={skinTone} className="animate-arm-right" />
          </>
        ) : status === 'working' ? (
          <>
            {/* タイピング中の腕 */}
            <rect x="3" y="11" width="1" height="1" fill={skinTone} />
            <rect x="12" y="11" width="1" height="1" fill={skinTone} />
          </>
        ) : (
          <>
            {/* 普通の腕 */}
            <rect x="3" y="11" width="1" height="1" fill={skinTone} />
            <rect x="12" y="11" width="1" height="1" fill={skinTone} />
          </>
        )}

        {/* 足 */}
        <rect x="5" y="12" width="2" height="2" fill="#2C3E50" />
        <rect x="9" y="12" width="2" height="2" fill="#2C3E50" />

        {/* 靴 */}
        <rect x="4" y="14" width="3" height="1" fill="#1A1A2E" />
        <rect x="9" y="14" width="3" height="1" fill="#1A1A2E" />
      </svg>

      {/* ステータスエフェクト */}
      {status === 'idle' && (
        <div className="absolute -top-1 -right-1 animate-bounce-slow">
          <span className="text-lg">💤</span>
        </div>
      )}
      {status === 'busy' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse">
          <span className="text-sm">🔥</span>
        </div>
      )}
      {status === 'busy' && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-1 opacity-50" />
          <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-2 opacity-50" />
          <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-3 opacity-50" />
        </div>
      )}
      {status === 'working' && (
        <div className="absolute -top-1 -right-1">
          <span className="text-xs animate-pulse">⚡</span>
        </div>
      )}
      {status === 'meeting' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <span className="text-xs">💬</span>
        </div>
      )}
    </div>
  )
}

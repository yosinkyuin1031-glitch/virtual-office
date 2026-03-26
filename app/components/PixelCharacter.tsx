'use client'

import { useMemo } from 'react'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

// ピクセルデータからcanvas経由でdata URLを生成する
function createPixelArt(pixels: string[][], scale: number = 1): string {
  const h = pixels.length
  const w = pixels[0].length
  // SVGで描画（canvas不要）
  const rects: string[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = pixels[y][x]
      if (c && c !== '.') {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`)
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects.join('')}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 色を明るく/暗くする
function adjustColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amt))
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amt))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// キャラクター生成：24x32のピクセルアート
function generateCharacter(
  hairColor: string,
  skinTone: string,
  outfitColor: string,
  charType: number,  // 0-7: キャラタイプ
  eyeType: number,   // 0-3: 目のタイプ
  isIdle: boolean,
): string[][] {
  const _ = '.'  // 透明
  const O = '#1a1a2e'  // アウトライン
  const H = hairColor
  const Hd = adjustColor(hairColor, -40) // 髪影
  const Hl = adjustColor(hairColor, 40)  // 髪ハイライト
  const S = skinTone
  const Sd = adjustColor(skinTone, -25) // 肌影
  const W = '#FFFFFF'  // 白
  const E = '#1a1a2e'  // 瞳
  const M = '#E74C3C'  // 口
  const C = outfitColor
  const Cd = adjustColor(outfitColor, -35) // 服影
  const Cl = adjustColor(outfitColor, 30)  // 服ハイライト
  const G = '#FFD700'  // 金（アクセサリ）
  const BT = '#374151' // ブーツ
  const BD = '#1F2937' // ブーツ影

  // 24列 x 32行
  // まず空のグリッド
  const grid: string[][] = Array.from({length: 32}, () => Array(24).fill(_))

  // --- 髪型パターン ---
  const drawHair = () => {
    switch (charType % 8) {
      case 0: // ツンツンスパイク（勇者系）
        // スパイク
        grid[0][8]=H; grid[0][9]=H;
        grid[0][14]=H; grid[0][15]=H;
        grid[1][7]=H; grid[1][8]=H; grid[1][9]=H; grid[1][10]=H;
        grid[1][13]=H; grid[1][14]=H; grid[1][15]=H; grid[1][16]=H;
        // メイン
        for(let x=6;x<=17;x++) { grid[2][x]=H; grid[3][x]=H; }
        for(let x=5;x<=18;x++) { grid[4][x]=H; grid[5][x]=H; }
        // ハイライト
        grid[3][8]=Hl; grid[3][9]=Hl; grid[4][7]=Hl;
        // サイド
        for(let y=6;y<=9;y++) { grid[y][5]=H; grid[y][18]=H; }
        break
      case 1: // とんがり帽子（魔法使い）
        grid[0][11]=C; grid[0][12]=C;
        for(let x=10;x<=13;x++) grid[1][x]=C;
        for(let x=9;x<=14;x++) grid[2][x]=C;
        for(let x=8;x<=15;x++) grid[3][x]=C;
        for(let x=7;x<=16;x++) grid[4][x]=C;
        for(let x=5;x<=18;x++) grid[5][x]=Cl; // つば
        for(let x=4;x<=19;x++) grid[6][x]=Cl;
        // 帽子の星
        grid[2][11]=G; grid[2][12]=G; grid[3][11]=G; grid[3][12]=G;
        // 帽子下の髪
        for(let x=6;x<=17;x++) grid[7][x]=H;
        for(let y=7;y<=10;y++) { grid[y][5]=H; grid[y][6]=H; grid[y][17]=H; grid[y][18]=H; }
        break
      case 2: // 短髪+ハチマキ（戦士）
        for(let x=6;x<=17;x++) { grid[2][x]=H; grid[3][x]=H; grid[4][x]=H; }
        for(let x=5;x<=18;x++) grid[5][x]='#E74C3C'; // 赤ハチマキ
        grid[5][19]='#C0392B'; grid[5][20]='#C0392B'; // ハチマキ結び
        for(let x=5;x<=18;x++) grid[6][x]=H;
        break
      case 3: // ロングヘアー（僧侶/ヒーラー）
        for(let x=7;x<=16;x++) grid[2][x]=H;
        for(let x=6;x<=17;x++) { grid[3][x]=H; grid[4][x]=H; grid[5][x]=H; }
        for(let x=5;x<=18;x++) grid[6][x]=H;
        // 横に長い髪
        for(let y=7;y<=16;y++) { grid[y][4]=Hd; grid[y][5]=H; grid[y][18]=H; grid[y][19]=Hd; }
        grid[3][8]=Hl; grid[4][7]=Hl;
        break
      case 4: // バンダナ＋ワイルド（盗賊）
        for(let x=6;x<=17;x++) grid[3][x]=H;
        for(let x=5;x<=18;x++) grid[4][x]='#8B5CF6'; // バンダナ
        for(let x=5;x<=18;x++) grid[5][x]='#7C3AED';
        grid[4][19]='#8B5CF6'; grid[5][19]='#7C3AED'; grid[5][20]='#8B5CF6'; // 結び
        for(let x=5;x<=18;x++) grid[6][x]=H;
        // サイドの髪
        for(let y=6;y<=12;y++) { grid[y][4]=H; grid[y][5]=H; grid[y][18]=H; grid[y][19]=H; }
        break
      case 5: // ポニーテール（賢者）
        for(let x=7;x<=16;x++) grid[2][x]=H;
        for(let x=6;x<=17;x++) { grid[3][x]=H; grid[4][x]=H; }
        for(let x=5;x<=18;x++) { grid[5][x]=H; grid[6][x]=H; }
        // ティアラ
        grid[4][9]=G; grid[4][10]=G; grid[4][13]=G; grid[4][14]=G;
        grid[3][11]=G; grid[3][12]=G;
        // ポニテ（右後ろに流れる）
        for(let y=5;y<=14;y++) { grid[y][19]=H; grid[y][20]=Hd; }
        grid[4][8]=Hl; grid[5][7]=Hl;
        break
      case 6: // もじゃもじゃ（学者風）
        grid[1][7]=H; grid[1][10]=H; grid[1][13]=H; grid[1][16]=H;
        for(let x=6;x<=17;x++) { grid[2][x]=H; grid[3][x]=H; }
        grid[2][5]=H; grid[2][18]=H;
        for(let x=5;x<=18;x++) { grid[4][x]=H; grid[5][x]=H; grid[6][x]=H; }
        for(let y=7;y<=10;y++) { grid[y][4]=H; grid[y][5]=H; grid[y][18]=H; grid[y][19]=H; }
        grid[3][7]=Hl; grid[4][9]=Hl;
        break
      case 7: // オールバック（幹部風）
        for(let x=7;x<=16;x++) grid[2][x]=H;
        for(let x=6;x<=17;x++) grid[3][x]=H;
        for(let x=5;x<=18;x++) { grid[4][x]=H; grid[5][x]=H; }
        for(let x=5;x<=18;x++) grid[6][x]=H;
        // 後ろに流す
        grid[3][18]=H; grid[4][19]=H; grid[5][19]=H; grid[5][20]=Hd;
        grid[4][6]=Hl; grid[5][7]=Hl; grid[5][8]=Hl;
        break
    }
  }

  // --- 顔 ---
  const drawFace = () => {
    // 顔ベース
    for(let y=7;y<=15;y++) for(let x=6;x<=17;x++) grid[y][x]=S;
    // 耳
    grid[9][5]=S; grid[10][5]=S; grid[10][5]=Sd;
    grid[9][18]=S; grid[10][18]=S; grid[10][18]=Sd;
    // 顎のライン（少し影）
    for(let x=7;x<=16;x++) grid[15][x]=Sd;
    // 頬（ピンク系）
    grid[12][7]='#FFB8B8'; grid[12][8]='#FFB8B8';
    grid[12][15]='#FFB8B8'; grid[12][16]='#FFB8B8';
  }

  // --- 目 ---
  const drawEyes = () => {
    if (isIdle) {
      // 閉じた目
      for(let x=7;x<=9;x++) grid[10][x]=O;
      for(let x=14;x<=16;x++) grid[10][x]=O;
      return
    }
    switch (eyeType % 4) {
      case 0: // まんまる大きな目（少年漫画風）
        // 左目
        grid[9][7]=O; grid[9][8]=W; grid[9][9]=W; grid[9][10]=O;
        grid[10][7]=W; grid[10][8]='#2563EB'; grid[10][9]=E; grid[10][10]=W;
        grid[11][7]=W; grid[11][8]='#2563EB'; grid[11][9]=E; grid[11][10]=W;
        grid[12][7]=O; grid[12][8]=W; grid[12][9]=W; grid[12][10]=O;
        grid[9][8]=W; // ハイライト
        // 右目
        grid[9][13]=O; grid[9][14]=W; grid[9][15]=W; grid[9][16]=O;
        grid[10][13]=W; grid[10][14]='#2563EB'; grid[10][15]=E; grid[10][16]=W;
        grid[11][13]=W; grid[11][14]='#2563EB'; grid[11][15]=E; grid[11][16]=W;
        grid[12][13]=O; grid[12][14]=W; grid[12][15]=W; grid[12][16]=O;
        grid[9][14]=W;
        break
      case 1: // キリッとした目（クール系）
        grid[9][7]=O; grid[9][8]=O; grid[9][9]=O; grid[9][10]=O;
        grid[10][7]=W; grid[10][8]='#16A34A'; grid[10][9]=E; grid[10][10]=W;
        grid[11][7]=O; grid[11][8]=W; grid[11][9]=W; grid[11][10]=O;
        grid[9][13]=O; grid[9][14]=O; grid[9][15]=O; grid[9][16]=O;
        grid[10][13]=W; grid[10][14]='#16A34A'; grid[10][15]=E; grid[10][16]=W;
        grid[11][13]=O; grid[11][14]=W; grid[11][15]=W; grid[11][16]=O;
        break
      case 2: // 優しい目（ヒーラー系）
        grid[9][7]=O; grid[9][8]=O; grid[9][9]=O;
        grid[10][7]=W; grid[10][8]='#D97706'; grid[10][9]=E; grid[10][10]=W;
        grid[11][7]=W; grid[11][8]='#D97706'; grid[11][9]=W; grid[11][10]=W;
        grid[12][8]=O; grid[12][9]=O;
        grid[9][14]=O; grid[9][15]=O; grid[9][16]=O;
        grid[10][13]=W; grid[10][14]='#D97706'; grid[10][15]=E; grid[10][16]=W;
        grid[11][13]=W; grid[11][14]='#D97706'; grid[11][15]=W; grid[11][16]=W;
        grid[12][14]=O; grid[12][15]=O;
        break
      case 3: // ギラッとした目（強キャラ系）
        grid[8][7]=O; grid[8][8]=O; grid[8][9]=O; grid[8][10]=O;
        grid[9][7]=O; grid[9][8]=W; grid[9][9]=W; grid[9][10]=O;
        grid[10][7]=W; grid[10][8]='#DC2626'; grid[10][9]=E; grid[10][10]=W;
        grid[11][7]=O; grid[11][8]='#DC2626'; grid[11][9]=E; grid[11][10]=O;
        grid[8][13]=O; grid[8][14]=O; grid[8][15]=O; grid[8][16]=O;
        grid[9][13]=O; grid[9][14]=W; grid[9][15]=W; grid[9][16]=O;
        grid[10][13]=W; grid[10][14]='#DC2626'; grid[10][15]=E; grid[10][16]=W;
        grid[11][13]=O; grid[11][14]='#DC2626'; grid[11][15]=E; grid[11][16]=O;
        break
    }
    // 眉毛
    grid[8][7]=O; grid[8][8]=O; grid[8][9]=O;
    grid[8][14]=O; grid[8][15]=O; grid[8][16]=O;
  }

  // --- 口 ---
  const drawMouth = () => {
    grid[13][10]=M; grid[13][11]=M; grid[13][12]=M; grid[13][13]=M;
  }

  // --- 鼻 ---
  const drawNose = () => {
    grid[11][11]=Sd; grid[11][12]=Sd;
  }

  // --- 体 ---
  const drawBody = () => {
    // 首
    grid[16][9]=S; grid[16][10]=S; grid[16][11]=S; grid[16][12]=S; grid[16][13]=S; grid[16][14]=S;

    // 体メイン
    for(let y=17;y<=24;y++) for(let x=5;x<=18;x++) grid[y][x]=C;
    // 肩幅
    for(let y=17;y<=19;y++) { grid[y][4]=C; grid[y][19]=C; }

    // 影（右側・下側）
    for(let y=17;y<=24;y++) { grid[y][17]=Cd; grid[y][18]=Cd; }
    for(let x=5;x<=18;x++) grid[24][x]=Cd;

    // ハイライト（左上）
    grid[17][6]=Cl; grid[17][7]=Cl; grid[18][6]=Cl;

    // 襟
    grid[17][9]=W; grid[17][10]=W; grid[17][11]=W; grid[17][12]=W; grid[17][13]=W; grid[17][14]=W;

    // アクセント（職業別）
    switch(charType % 8) {
      case 0: // 勇者：金の紋章
        grid[19][10]=G; grid[19][11]=G; grid[19][12]=G; grid[19][13]=G;
        grid[20][10]=G; grid[20][11]=G; grid[20][12]=G; grid[20][13]=G;
        grid[21][11]=G; grid[21][12]=G;
        break
      case 1: // 魔法使い：星マーク
        grid[20][11]=G; grid[20][12]=G;
        grid[19][10]=G; grid[19][13]=G;
        grid[21][10]=G; grid[21][13]=G;
        break
      case 2: // 戦士：肩当て
        for(let y=17;y<=18;y++) {
          grid[y][4]='#9CA3AF'; grid[y][5]='#9CA3AF'; grid[y][6]='#9CA3AF';
          grid[y][17]='#9CA3AF'; grid[y][18]='#9CA3AF'; grid[y][19]='#9CA3AF';
        }
        grid[21][8]=G; grid[21][9]=G; grid[21][10]=G; grid[21][11]=G;
        grid[21][12]=G; grid[21][13]=G; grid[21][14]=G; grid[21][15]=G; // ベルト
        break
      case 3: // 僧侶：十字
        grid[19][11]=G; grid[19][12]=G;
        grid[20][10]=G; grid[20][11]=G; grid[20][12]=G; grid[20][13]=G;
        grid[21][11]=G; grid[21][12]=G;
        grid[22][11]=G; grid[22][12]=G;
        break
      case 4: // 盗賊：ベルト+バックル
        for(let x=6;x<=17;x++) grid[21][x]='#92400E';
        grid[21][11]=G; grid[21][12]=G;
        break
      case 5: // 賢者：宝玉
        grid[19][10]='#22D3EE'; grid[19][11]='#22D3EE'; grid[19][12]='#22D3EE'; grid[19][13]='#22D3EE';
        grid[20][10]='#22D3EE'; grid[20][11]='#67E8F9'; grid[20][12]='#67E8F9'; grid[20][13]='#22D3EE';
        grid[21][10]='#22D3EE'; grid[21][11]='#22D3EE'; grid[21][12]='#22D3EE'; grid[21][13]='#22D3EE';
        break
      case 6: // 学者：蝶ネクタイ
        grid[17][10]='#E74C3C'; grid[17][11]='#C0392B'; grid[17][12]='#C0392B'; grid[17][13]='#E74C3C';
        grid[18][11]='#E74C3C'; grid[18][12]='#E74C3C';
        break
      case 7: // 幹部：ネクタイ
        grid[18][11]='#E74C3C'; grid[18][12]='#E74C3C';
        grid[19][11]='#E74C3C'; grid[19][12]='#E74C3C';
        grid[20][11]='#C0392B'; grid[20][12]='#C0392B';
        grid[21][11]='#C0392B'; grid[21][12]='#C0392B';
        break
    }
  }

  // --- 腕 ---
  const drawArms = () => {
    // 左腕
    for(let y=18;y<=23;y++) { grid[y][3]=C; grid[y][4]=C; }
    grid[23][3]=S; grid[23][4]=S; grid[24][3]=S; grid[24][4]=S; // 手
    // 右腕
    for(let y=18;y<=23;y++) { grid[y][19]=C; grid[y][20]=C; }
    grid[23][19]=S; grid[23][20]=S; grid[24][19]=S; grid[24][20]=S;
    // 腕の影
    for(let y=18;y<=22;y++) grid[y][4]=Cd;
  }

  // --- 足 ---
  const drawLegs = () => {
    // 左足
    for(let y=25;y<=28;y++) { grid[y][7]=BT; grid[y][8]=BT; grid[y][9]=BT; grid[y][10]=BT; }
    // 右足
    for(let y=25;y<=28;y++) { grid[y][13]=BT; grid[y][14]=BT; grid[y][15]=BT; grid[y][16]=BT; }
    // ブーツ
    grid[29][6]=BD; grid[29][7]=BD; grid[29][8]=BD; grid[29][9]=BD; grid[29][10]=BD;
    grid[29][13]=BD; grid[29][14]=BD; grid[29][15]=BD; grid[29][16]=BD; grid[29][17]=BD;
    grid[30][6]=BD; grid[30][7]=BD; grid[30][8]=BD; grid[30][9]=BD; grid[30][10]=BD; grid[30][11]=BD;
    grid[30][12]=BD; grid[30][13]=BD; grid[30][14]=BD; grid[30][15]=BD; grid[30][16]=BD; grid[30][17]=BD;
    // ブーツハイライト
    grid[29][7]=BT; grid[29][8]=BT;
    grid[29][14]=BT; grid[29][15]=BT;
  }

  drawHair()
  drawFace()
  drawEyes()
  drawNose()
  drawMouth()
  drawBody()
  drawArms()
  drawLegs()

  return grid
}

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const charType = hash % 8
  const eyeType = (hash >> 3) % 4
  const skinTones = ['#FFDBB4', '#F5C6A5', '#FFE0C0', '#F0D0A0']
  const skinTone = skinTones[hash % skinTones.length]

  const imgSrc = useMemo(() => {
    const pixels = generateCharacter(color, skinTone, color, charType, eyeType, status === 'idle')
    return createPixelArt(pixels)
  }, [color, skinTone, charType, eyeType, status])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img
        src={imgSrc}
        alt={name}
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated' }}
        className={
          status === 'busy' ? 'animate-run' :
          status === 'idle' ? 'animate-sleep' :
          status === 'meeting' ? 'animate-talk' :
          'animate-work'
        }
      />

      {/* ステータスエフェクト */}
      {status === 'idle' && (
        <div className="absolute -top-1 -right-1 animate-bounce-slow">
          <span style={{ fontSize: size * 0.3 }}>💤</span>
        </div>
      )}
      {status === 'busy' && (
        <>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse">
            <span style={{ fontSize: size * 0.25 }}>🔥</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-1 opacity-50" />
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-2 opacity-50" />
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-dust-3 opacity-50" />
          </div>
        </>
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

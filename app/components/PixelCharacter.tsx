'use client'

import { useMemo } from 'react'

interface Props {
  name: string
  color: string
  status: 'working' | 'busy' | 'idle' | 'meeting'
  size?: number
}

// スマブラキャラ定義
interface SmashChar {
  label: string
  hair: string
  skin: string
  outfit: string
  outfit2: string
  accent: string
  hatType: 'cap' | 'pointy' | 'helmet' | 'crown' | 'headband' | 'hood' | 'none' | 'ears' | 'round' | 'mask' | 'antenna' | 'spiky'
  hatColor: string
  special: 'mustache' | 'tie' | 'scarf' | 'visor' | 'sword' | 'tail' | 'star' | 'gems' | 'goggles' | 'aura' | 'lightning' | 'cape' | 'none'
}

// 社員名→スマブラキャラマッピング
const smashMap: Record<string, SmashChar> = {
  'レイア': { label: 'マリオ', hair: '#8B4513', skin: '#FFDBB4', outfit: '#E74C3C', outfit2: '#1565C0', accent: '#FFD700', hatType: 'cap', hatColor: '#E74C3C', special: 'mustache' },
  'ソラト': { label: 'C.ファルコン', hair: '#1a1a2e', skin: '#D2A06D', outfit: '#1565C0', outfit2: '#E74C3C', accent: '#FFD700', hatType: 'helmet', hatColor: '#1565C0', special: 'scarf' },
  'ミコ': { label: 'ピーチ', hair: '#FFD700', skin: '#FFE0C0', outfit: '#FF69B4', outfit2: '#FFB6C1', accent: '#FFD700', hatType: 'crown', hatColor: '#FFD700', special: 'gems' },
  'ミサ': { label: 'ワリオ', hair: '#4A3728', skin: '#FFDBB4', outfit: '#FFD700', outfit2: '#7B2D8B', accent: '#FFD700', hatType: 'cap', hatColor: '#FFD700', special: 'mustache' },
  'ハル': { label: 'リンク', hair: '#C9A84C', skin: '#F5C6A5', outfit: '#2E7D32', outfit2: '#1B5E20', accent: '#FFD700', hatType: 'pointy', hatColor: '#2E7D32', special: 'sword' },
  'ナギ': { label: 'サムス', hair: '#FFD700', skin: '#FFE0C0', outfit: '#FF6F00', outfit2: '#E65100', accent: '#4CAF50', hatType: 'helmet', hatColor: '#FF6F00', special: 'visor' },
  'フミ': { label: 'ネス', hair: '#1a1a2e', skin: '#FFDBB4', outfit: '#FFD700', outfit2: '#1565C0', accent: '#E74C3C', hatType: 'cap', hatColor: '#E74C3C', special: 'none' },
  'アキ': { label: 'ドンキー', hair: '#8B4513', skin: '#8B4513', outfit: '#8B4513', outfit2: '#A0522D', accent: '#E74C3C', hatType: 'none', hatColor: '#8B4513', special: 'tie' },
  'ユキ': { label: 'ルイージ', hair: '#8B4513', skin: '#FFDBB4', outfit: '#2E7D32', outfit2: '#1565C0', accent: '#FFD700', hatType: 'cap', hatColor: '#2E7D32', special: 'mustache' },
  'サク': { label: 'インクリング', hair: '#FF6F00', skin: '#FFE0C0', outfit: '#FF6F00', outfit2: '#1a1a2e', accent: '#FF6F00', hatType: 'none', hatColor: '#FF6F00', special: 'goggles' },
  'テツ': { label: 'メガマン', hair: '#1565C0', skin: '#FFE0C0', outfit: '#1565C0', outfit2: '#00BCD4', accent: '#FFD700', hatType: 'helmet', hatColor: '#1565C0', special: 'none' },
  'コウ': { label: 'フォックス', hair: '#D2691E', skin: '#F5DEB3', outfit: '#2E7D32', outfit2: '#455A64', accent: '#E74C3C', hatType: 'ears', hatColor: '#D2691E', special: 'visor' },
  'リク': { label: 'ファルコ', hair: '#1565C0', skin: '#90A4AE', outfit: '#E74C3C', outfit2: '#455A64', accent: '#FFD700', hatType: 'none', hatColor: '#1565C0', special: 'visor' },
  'タク': { label: 'メタナイト', hair: '#311B92', skin: '#FFD700', outfit: '#311B92', outfit2: '#1A237E', accent: '#FFD700', hatType: 'mask', hatColor: '#311B92', special: 'cape' },
  'ツキ': { label: 'カービィ', hair: '#FF69B4', skin: '#FFB6C1', outfit: '#FF69B4', outfit2: '#E91E63', accent: '#E74C3C', hatType: 'round', hatColor: '#FF69B4', special: 'none' },
  'ルナ': { label: 'ゼルダ', hair: '#C9A84C', skin: '#FFE0C0', outfit: '#7B1FA2', outfit2: '#4A148C', accent: '#FFD700', hatType: 'crown', hatColor: '#FFD700', special: 'gems' },
  'マヤ': { label: 'ジョーカー', hair: '#1a1a2e', skin: '#F5C6A5', outfit: '#1a1a2e', outfit2: '#E74C3C', accent: '#E74C3C', hatType: 'mask', hatColor: '#1a1a2e', special: 'none' },
  'リン': { label: 'パルテナ', hair: '#4CAF50', skin: '#FFE0C0', outfit: '#FFFFFF', outfit2: '#FFD700', accent: '#4CAF50', hatType: 'crown', hatColor: '#FFD700', special: 'gems' },
  'ノア': { label: 'ベヨネッタ', hair: '#1a1a2e', skin: '#F0D0A0', outfit: '#1a1a2e', outfit2: '#7B1FA2', accent: '#E74C3C', hatType: 'none', hatColor: '#1a1a2e', special: 'gems' },
  'ジン': { label: 'シュルク', hair: '#C62828', skin: '#FFDBB4', outfit: '#E74C3C', outfit2: '#1a1a2e', accent: '#00BCD4', hatType: 'none', hatColor: '#C62828', special: 'sword' },
  'セナ': { label: 'ルカリオ', hair: '#1565C0', skin: '#1565C0', outfit: '#1565C0', outfit2: '#FFD700', accent: '#E74C3C', hatType: 'ears', hatColor: '#1565C0', special: 'aura' },
  'ヒカ': { label: 'ピカチュウ', hair: '#FFD700', skin: '#FFD700', outfit: '#FFD700', outfit2: '#8B4513', accent: '#E74C3C', hatType: 'ears', hatColor: '#FFD700', special: 'lightning' },
  'スイ': { label: 'ヨッシー', hair: '#4CAF50', skin: '#4CAF50', outfit: '#4CAF50', outfit2: '#FFFFFF', accent: '#E74C3C', hatType: 'round', hatColor: '#4CAF50', special: 'none' },
  'ルカ': { label: 'R.O.B.', hair: '#9E9E9E', skin: '#E0E0E0', outfit: '#9E9E9E', outfit2: '#E74C3C', accent: '#1565C0', hatType: 'antenna', hatColor: '#9E9E9E', special: 'none' },
  'カナ': { label: 'ロイ', hair: '#E74C3C', skin: '#FFDBB4', outfit: '#1565C0', outfit2: '#FFD700', accent: '#E74C3C', hatType: 'spiky', hatColor: '#E74C3C', special: 'sword' },
  'ミオ': { label: 'クラウド', hair: '#FFD700', skin: '#FFDBB4', outfit: '#311B92', outfit2: '#1a1a2e', accent: '#FFD700', hatType: 'spiky', hatColor: '#FFD700', special: 'sword' },
  'レン': { label: 'ソニック', hair: '#1565C0', skin: '#FFDBB4', outfit: '#1565C0', outfit2: '#E74C3C', accent: '#FFD700', hatType: 'spiky', hatColor: '#1565C0', special: 'none' },
}

function adjustColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amt))
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amt))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function generateSmashCharacter(char: SmashChar, isIdle: boolean): string[][] {
  const _ = '.'
  const O = '#1a1a2e' // outline
  const H = char.hair
  const Hd = adjustColor(char.hair, -40)
  const S = char.skin
  const Sd = adjustColor(char.skin, -25)
  const W = '#FFFFFF'
  const E = '#1a1a2e' // eyes
  const M = '#E74C3C' // mouth
  const C = char.outfit
  const Cd = adjustColor(char.outfit, -35)
  const Cl = adjustColor(char.outfit, 30)
  const C2 = char.outfit2
  const A = char.accent
  const HC = char.hatColor
  const HCd = adjustColor(char.hatColor, -35)

  const grid: string[][] = Array.from({length: 32}, () => Array(24).fill(_))

  // ========== 髪 / 帽子 ==========
  const drawHead = () => {
    switch (char.hatType) {
      case 'cap': // マリオ / ルイージ / ワリオ / ネス
        // キャップ
        for(let x=7;x<=16;x++) grid[2][x]=HC;
        for(let x=6;x<=17;x++) { grid[3][x]=HC; grid[4][x]=HC; }
        for(let x=5;x<=18;x++) grid[5][x]=HC;
        // つば
        for(let x=4;x<=12;x++) grid[6][x]=HCd;
        for(let x=4;x<=11;x++) grid[7][x]=HCd;
        // キャップのマーク（中央に白丸）
        grid[3][11]=W; grid[3][12]=W;
        grid[4][11]=W; grid[4][12]=W;
        // 後ろ髪
        for(let x=13;x<=18;x++) grid[6][x]=H;
        for(let x=13;x<=18;x++) grid[7][x]=H;
        break

      case 'pointy': // リンク
        grid[0][11]=HC; grid[0][12]=HC;
        for(let x=10;x<=13;x++) grid[1][x]=HC;
        for(let x=9;x<=14;x++) grid[2][x]=HC;
        for(let x=8;x<=15;x++) grid[3][x]=HC;
        for(let x=7;x<=16;x++) grid[4][x]=HC;
        for(let x=6;x<=17;x++) grid[5][x]=HC;
        for(let x=5;x<=18;x++) grid[6][x]=HC;
        // 髪（帽子の下＋横）
        for(let y=6;y<=10;y++) { grid[y][4]=H; grid[y][5]=H; grid[y][18]=H; grid[y][19]=H; }
        // エルフ耳
        grid[9][3]=S; grid[10][3]=S; grid[9][20]=S; grid[10][20]=S;
        break

      case 'helmet': // サムス / メガマン / C.ファルコン
        for(let x=7;x<=16;x++) grid[2][x]=HC;
        for(let x=6;x<=17;x++) { grid[3][x]=HC; grid[4][x]=HC; grid[5][x]=HC; }
        for(let x=5;x<=18;x++) { grid[6][x]=HC; grid[7][x]=HC; }
        // ハイライト
        grid[3][8]=adjustColor(HC, 50); grid[3][9]=adjustColor(HC, 50);
        grid[4][7]=adjustColor(HC, 40);
        // バイザー
        if (char.special === 'visor' || char.label === 'サムス') {
          grid[8][7]=A; grid[8][8]=A; grid[8][9]=A; grid[8][10]=A;
          grid[9][7]=A; grid[9][8]=adjustColor(A, 40); grid[9][9]=adjustColor(A, 40); grid[9][10]=A;
        }
        break

      case 'crown': // ピーチ / ゼルダ / パルテナ
        // ティアラ
        grid[1][10]=A; grid[1][13]=A;
        grid[2][9]=A; grid[2][10]=A; grid[2][11]=A; grid[2][12]=A; grid[2][13]=A; grid[2][14]=A;
        grid[2][11]='#E74C3C'; grid[2][12]='#E74C3C'; // 赤い宝石
        // 髪
        for(let x=7;x<=16;x++) grid[3][x]=H;
        for(let x=6;x<=17;x++) { grid[4][x]=H; grid[5][x]=H; }
        for(let x=5;x<=18;x++) grid[6][x]=H;
        // ロングヘアー（横に流す）
        for(let y=7;y<=15;y++) { grid[y][4]=Hd; grid[y][5]=H; grid[y][18]=H; grid[y][19]=Hd; }
        break

      case 'headband': // 戦士系
        for(let x=6;x<=17;x++) { grid[3][x]=H; grid[4][x]=H; }
        for(let x=5;x<=18;x++) grid[5][x]=A; // ハチマキ
        grid[5][19]=adjustColor(A, -20); grid[5][20]=adjustColor(A, -20);
        for(let x=5;x<=18;x++) grid[6][x]=H;
        break

      case 'hood': // フード系
        for(let x=7;x<=16;x++) grid[1][x]=HC;
        for(let x=6;x<=17;x++) { grid[2][x]=HC; grid[3][x]=HC; }
        for(let x=5;x<=18;x++) { grid[4][x]=HC; grid[5][x]=HC; grid[6][x]=HC; }
        for(let y=7;y<=10;y++) { grid[y][4]=HCd; grid[y][5]=HC; grid[y][18]=HC; grid[y][19]=HCd; }
        break

      case 'ears': // ピカチュウ / コウ(フォックス) / ルカリオ
        // 耳
        grid[0][7]=HC; grid[0][8]=HC; grid[0][15]=HC; grid[0][16]=HC;
        grid[1][7]=HC; grid[1][8]=HC; grid[1][9]=HC; grid[1][14]=HC; grid[1][15]=HC; grid[1][16]=HC;
        grid[2][8]=HC; grid[2][9]=HC; grid[2][14]=HC; grid[2][15]=HC;
        // 頭
        for(let x=7;x<=16;x++) grid[3][x]=HC;
        for(let x=6;x<=17;x++) { grid[4][x]=HC; grid[5][x]=HC; }
        for(let x=5;x<=18;x++) grid[6][x]=HC;
        if (char.label === 'ピカチュウ') {
          // 耳の先は黒
          grid[0][7]=O; grid[0][8]=O; grid[0][15]=O; grid[0][16]=O;
        }
        break

      case 'round': // カービィ / ヨッシー
        // 丸い頭
        for(let x=8;x<=15;x++) grid[1][x]=HC;
        for(let x=6;x<=17;x++) grid[2][x]=HC;
        for(let x=5;x<=18;x++) { grid[3][x]=HC; grid[4][x]=HC; grid[5][x]=HC; grid[6][x]=HC; }
        for(let x=5;x<=18;x++) grid[7][x]=HC;
        // ハイライト
        grid[2][8]=adjustColor(HC, 50); grid[3][7]=adjustColor(HC, 40);
        break

      case 'mask': // メタナイト / ジョーカー
        for(let x=7;x<=16;x++) grid[2][x]=H;
        for(let x=6;x<=17;x++) { grid[3][x]=H; grid[4][x]=H; }
        for(let x=5;x<=18;x++) { grid[5][x]=H; grid[6][x]=H; }
        // マスク
        for(let x=6;x<=17;x++) grid[7][x]=HC;
        for(let x=6;x<=17;x++) { grid[8][x]=HC; grid[9][x]=HC; }
        // 目のスリット
        grid[8][8]=W; grid[8][9]=W; grid[8][14]=W; grid[8][15]=W;
        break

      case 'antenna': // R.O.B.
        grid[0][11]=HC; grid[0][12]=HC;
        grid[1][11]=HC; grid[1][12]=HC;
        grid[2][10]=HC; grid[2][11]='#E74C3C'; grid[2][12]='#E74C3C'; grid[2][13]=HC;
        for(let x=7;x<=16;x++) grid[3][x]=HC;
        for(let x=6;x<=17;x++) { grid[4][x]=HC; grid[5][x]=HC; grid[6][x]=HC; }
        for(let x=5;x<=18;x++) grid[7][x]=HC;
        // LEDアイ
        grid[5][8]='#00BCD4'; grid[5][9]='#00BCD4'; grid[5][14]='#00BCD4'; grid[5][15]='#00BCD4';
        break

      case 'spiky': // ロイ / クラウド / ソニック
        // ツンツンヘア
        grid[0][8]=H; grid[0][9]=H; grid[0][14]=H; grid[0][15]=H;
        grid[1][7]=H; grid[1][8]=H; grid[1][9]=H; grid[1][10]=H;
        grid[1][13]=H; grid[1][14]=H; grid[1][15]=H; grid[1][16]=H;
        for(let x=6;x<=17;x++) { grid[2][x]=H; grid[3][x]=H; }
        for(let x=5;x<=18;x++) { grid[4][x]=H; grid[5][x]=H; }
        for(let x=5;x<=18;x++) grid[6][x]=H;
        // ハイライト
        grid[2][8]=adjustColor(H, 50); grid[3][9]=adjustColor(H, 40);
        if (char.label === 'ソニック') {
          // 後ろに伸びるトゲ
          for(let y=3;y<=7;y++) { grid[y][19]=H; grid[y][20]=H; grid[y][21]=Hd; }
        }
        break

      case 'none':
      default:
        // 素の髪
        for(let x=7;x<=16;x++) grid[3][x]=H;
        for(let x=6;x<=17;x++) { grid[4][x]=H; grid[5][x]=H; }
        for(let x=5;x<=18;x++) grid[6][x]=H;
        break
    }
  }

  // ========== 顔 ==========
  const drawFace = () => {
    // 非人間キャラは顔を体色で
    const faceColor = (char.label === 'ピカチュウ' || char.label === 'カービィ' || char.label === 'ヨッシー'
      || char.label === 'ドンキー' || char.label === 'ルカリオ') ? char.skin : S
    const faceShadow = adjustColor(faceColor, -25)

    // R.O.B.とメタナイトはマスク/ロボ顔
    if (char.hatType === 'antenna' || char.hatType === 'mask') return

    // 顔ベース
    const startY = (char.hatType === 'round') ? 8 : 7
    for(let y=startY;y<=15;y++) for(let x=6;x<=17;x++) grid[y][x]=faceColor;
    // 耳
    if (char.hatType !== 'ears') {
      grid[9][5]=faceColor; grid[10][5]=faceShadow;
      grid[9][18]=faceColor; grid[10][18]=faceShadow;
    }
    // 顎ライン
    for(let x=7;x<=16;x++) grid[15][x]=faceShadow;

    // 頬（ピカチュウは赤い頬）
    if (char.label === 'ピカチュウ') {
      grid[11][7]='#E74C3C'; grid[11][8]='#E74C3C'; grid[12][7]='#E74C3C'; grid[12][8]='#E74C3C';
      grid[11][15]='#E74C3C'; grid[11][16]='#E74C3C'; grid[12][15]='#E74C3C'; grid[12][16]='#E74C3C';
    } else if (char.label !== 'ドンキー' && char.label !== 'ルカリオ') {
      grid[12][7]='#FFB8B8'; grid[12][8]='#FFB8B8';
      grid[12][15]='#FFB8B8'; grid[12][16]='#FFB8B8';
    }

    // 口
    if (char.label === 'カービィ') {
      // カービィの大きな口
      grid[13][9]=M; grid[13][10]=M; grid[13][11]=M; grid[13][12]=M; grid[13][13]=M; grid[13][14]=M;
    } else if (char.label === 'ヨッシー') {
      // ヨッシーの大きな鼻
      for(let x=13;x<=17;x++) { grid[11][x]=faceColor; grid[12][x]=faceColor; grid[13][x]=faceColor; }
      grid[14][10]=M; grid[14][11]=M;
    } else {
      grid[13][10]=M; grid[13][11]=M; grid[13][12]=M; grid[13][13]=M;
    }

    // ひげ（マリオ / ルイージ / ワリオ）
    if (char.special === 'mustache') {
      const mustacheColor = '#4A3728'
      grid[12][8]=mustacheColor; grid[12][9]=mustacheColor; grid[12][10]=mustacheColor;
      grid[12][11]=mustacheColor; grid[12][12]=mustacheColor; grid[12][13]=mustacheColor;
      grid[12][14]=mustacheColor; grid[12][15]=mustacheColor;
      if (char.label === 'ワリオ') {
        // ワリオのジグザグひげ
        grid[13][7]=mustacheColor; grid[13][16]=mustacheColor;
        grid[14][7]=mustacheColor; grid[14][16]=mustacheColor;
      }
    }

    // 鼻
    grid[11][11]=faceShadow; grid[11][12]=faceShadow;
  }

  // ========== 目 ==========
  const drawEyes = () => {
    if (char.hatType === 'antenna' || char.hatType === 'mask') return

    const eyeY = (char.hatType === 'round') ? 10 : 9
    if (isIdle) {
      for(let x=7;x<=9;x++) grid[eyeY+1][x]=O;
      for(let x=14;x<=16;x++) grid[eyeY+1][x]=O;
      return
    }

    if (char.label === 'カービィ') {
      // カービィの大きな丸い目
      grid[eyeY][8]=O; grid[eyeY][9]=E; grid[eyeY+1][8]=O; grid[eyeY+1][9]=E;
      grid[eyeY][14]=O; grid[eyeY][15]=E; grid[eyeY+1][14]=O; grid[eyeY+1][15]=E;
    } else if (char.label === 'ピカチュウ') {
      // ピカチュウの丸い目
      grid[eyeY][8]=O; grid[eyeY][9]=E; grid[eyeY+1][8]=W; grid[eyeY+1][9]=E;
      grid[eyeY][14]=O; grid[eyeY][15]=E; grid[eyeY+1][14]=W; grid[eyeY+1][15]=E;
    } else {
      // 標準的な目（瞳の色をキャラごとに変える）
      const iris = char.label === 'リンク' ? '#1565C0'
        : char.label === 'ソニック' ? '#2E7D32'
        : char.label === 'ルカリオ' ? '#E74C3C'
        : '#2563EB'
      // 左目
      grid[eyeY][7]=O; grid[eyeY][8]=W; grid[eyeY][9]=W; grid[eyeY][10]=O;
      grid[eyeY+1][7]=W; grid[eyeY+1][8]=iris; grid[eyeY+1][9]=E; grid[eyeY+1][10]=W;
      grid[eyeY+2][7]=O; grid[eyeY+2][8]=W; grid[eyeY+2][9]=W; grid[eyeY+2][10]=O;
      // 右目
      grid[eyeY][13]=O; grid[eyeY][14]=W; grid[eyeY][15]=W; grid[eyeY][16]=O;
      grid[eyeY+1][13]=W; grid[eyeY+1][14]=iris; grid[eyeY+1][15]=E; grid[eyeY+1][16]=W;
      grid[eyeY+2][13]=O; grid[eyeY+2][14]=W; grid[eyeY+2][15]=W; grid[eyeY+2][16]=O;
    }
    // 眉毛（人間キャラのみ）
    if (char.skin !== char.outfit && char.hatType !== 'round' && char.hatType !== 'ears') {
      grid[8][7]=O; grid[8][8]=O; grid[8][9]=O;
      grid[8][14]=O; grid[8][15]=O; grid[8][16]=O;
    }
  }

  // ========== 体 ==========
  const drawBody = () => {
    // 首
    const neckColor = (char.label === 'ピカチュウ' || char.label === 'カービィ' || char.label === 'ヨッシー'
      || char.label === 'ドンキー' || char.label === 'ルカリオ' || char.label === 'ソニック') ? char.skin : S
    grid[16][9]=neckColor; grid[16][10]=neckColor; grid[16][11]=neckColor;
    grid[16][12]=neckColor; grid[16][13]=neckColor; grid[16][14]=neckColor;

    // 体メイン
    for(let y=17;y<=24;y++) for(let x=5;x<=18;x++) grid[y][x]=C;
    for(let y=17;y<=19;y++) { grid[y][4]=C; grid[y][19]=C; }

    // 影
    for(let y=17;y<=24;y++) { grid[y][17]=Cd; grid[y][18]=Cd; }
    for(let x=5;x<=18;x++) grid[24][x]=Cd;

    // ハイライト
    grid[17][6]=Cl; grid[17][7]=Cl; grid[18][6]=Cl;

    // キャラ別の体アクセント
    if (char.label === 'マリオ' || char.label === 'ルイージ') {
      // オーバーオール
      for(let y=20;y<=24;y++) for(let x=5;x<=18;x++) grid[y][x]=C2;
      grid[19][8]=C2; grid[19][9]=C2; grid[19][14]=C2; grid[19][15]=C2;
      // ボタン
      grid[20][9]=A; grid[20][14]=A;
    } else if (char.label === 'ワリオ') {
      // オーバーオール（紫）
      for(let y=21;y<=24;y++) for(let x=5;x<=18;x++) grid[y][x]=C2;
      grid[20][11]=W; grid[20][12]=W; // W マーク
    } else if (char.label === 'リンク') {
      // ベルト
      for(let x=6;x<=17;x++) grid[21][x]='#92400E';
      grid[21][11]=A; grid[21][12]=A; // バックル
    } else if (char.label === 'ピーチ' || char.label === 'ゼルダ') {
      // ドレスの裾（広がる）
      for(let y=22;y<=24;y++) { grid[y][3]=C; grid[y][4]=C; grid[y][19]=C; grid[y][20]=C; }
      // 宝石
      grid[19][11]=A; grid[19][12]=A; grid[20][11]=A; grid[20][12]=A;
    } else if (char.label === 'パルテナ') {
      for(let y=22;y<=24;y++) { grid[y][3]=C; grid[y][4]=C; grid[y][19]=C; grid[y][20]=C; }
      grid[19][11]=A; grid[19][12]=A;
    } else if (char.special === 'tie') {
      // DKのネクタイ
      grid[17][11]='#E74C3C'; grid[17][12]='#E74C3C';
      grid[18][11]='#E74C3C'; grid[18][12]='#E74C3C';
      grid[19][11]='#C62828'; grid[19][12]='#C62828';
      grid[20][11]='#C62828'; grid[20][12]='#C62828';
      grid[18][11]='#FFD700'; grid[18][12]='#FFD700'; // DKロゴ
    } else if (char.special === 'scarf') {
      // キャプテン・ファルコンのスカーフ
      grid[17][9]=A; grid[17][10]=A; grid[17][11]=A; grid[17][12]=A; grid[17][13]=A; grid[17][14]=A;
      grid[18][14]=A; grid[19][14]=A; grid[19][15]=A;
    } else if (char.special === 'sword') {
      // 剣（右側に表示）
      grid[17][20]='#9E9E9E'; grid[18][20]='#BDBDBD'; grid[19][20]='#BDBDBD';
      grid[20][20]='#BDBDBD'; grid[21][20]='#BDBDBD'; grid[22][20]='#8D6E63';
      grid[23][20]='#8D6E63';
    } else if (char.special === 'aura') {
      // ルカリオのオーラ
      grid[17][3]='#2196F3'; grid[18][3]='#42A5F5'; grid[19][2]='#64B5F6';
      grid[17][20]='#2196F3'; grid[18][20]='#42A5F5'; grid[19][21]='#64B5F6';
    } else if (char.special === 'lightning') {
      // ピカチュウの尻尾
      grid[19][19]=A; grid[20][20]=A; grid[21][19]=A; grid[22][20]=A;
      grid[20][19]='#8B4513'; grid[21][20]='#8B4513';
    } else if (char.special === 'cape') {
      // メタナイトのマント
      for(let y=17;y<=24;y++) { grid[y][3]='#311B92'; grid[y][4]='#1A237E'; grid[y][19]='#1A237E'; grid[y][20]='#311B92'; }
    } else if (char.label === 'ネス') {
      // ストライプシャツ
      for(let x=6;x<=17;x++) { grid[19][x]=C2; grid[21][x]=C2; grid[23][x]=C2; }
    } else if (char.label === 'インクリング') {
      // インクリングのベスト
      for(let y=17;y<=20;y++) for(let x=7;x<=16;x++) grid[y][x]=C2;
    } else if (char.label === 'メガマン') {
      // メガマンのアームキャノン
      for(let y=19;y<=22;y++) { grid[y][2]=C; grid[y][3]=C; }
      grid[20][1]=A; grid[21][1]=A;
    } else if (char.label === 'ジョーカー') {
      // コートの赤いアクセント
      grid[17][10]=A; grid[17][11]=A; grid[17][12]=A; grid[17][13]=A;
      for(let y=22;y<=24;y++) { grid[y][4]=A; grid[y][19]=A; }
    } else if (char.label === 'クラウド') {
      // 肩パッド
      for(let y=17;y<=18;y++) { grid[y][4]='#455A64'; grid[y][5]='#455A64'; grid[y][18]='#455A64'; grid[y][19]='#455A64'; }
    } else if (char.label === 'R.O.B.') {
      // ロボットの体
      grid[19][9]='#E74C3C'; grid[19][10]='#E74C3C'; grid[19][13]='#E74C3C'; grid[19][14]='#E74C3C';
      for(let x=8;x<=15;x++) grid[22][x]='#616161';
    } else if (char.label === 'ベヨネッタ') {
      // スーツ＋赤アクセント
      grid[17][10]=A; grid[17][13]=A;
      grid[21][11]=A; grid[21][12]=A; // バックル
    } else if (char.label === 'ロイ') {
      // 鎧のアクセント
      grid[19][11]=A; grid[19][12]=A; grid[20][11]=A; grid[20][12]=A;
      for(let y=17;y<=18;y++) { grid[y][4]='#FFD700'; grid[y][19]='#FFD700'; }
    } else {
      // 襟（汎用）
      grid[17][9]=W; grid[17][10]=W; grid[17][11]=W; grid[17][12]=W; grid[17][13]=W; grid[17][14]=W;
    }
  }

  // ========== 腕 ==========
  const drawArms = () => {
    const armColor = (char.label === 'サムス' || char.label === 'メガマン') ? char.outfit : C
    const handColor = (char.label === 'ピカチュウ' || char.label === 'カービィ' || char.label === 'ヨッシー'
      || char.label === 'ドンキー' || char.label === 'ルカリオ' || char.label === 'ソニック') ? char.skin : S

    for(let y=18;y<=23;y++) { grid[y][3]=armColor; grid[y][4]=armColor; }
    grid[23][3]=handColor; grid[23][4]=handColor; grid[24][3]=handColor; grid[24][4]=handColor;
    for(let y=18;y<=23;y++) { grid[y][19]=armColor; grid[y][20]=armColor; }
    grid[23][19]=handColor; grid[23][20]=handColor; grid[24][19]=handColor; grid[24][20]=handColor;
    for(let y=18;y<=22;y++) grid[y][4]=Cd;

    // サムスのアームキャノン（左腕）
    if (char.label === 'サムス') {
      for(let y=19;y<=22;y++) { grid[y][2]=C; grid[y][3]=C; }
      grid[20][1]=A; grid[21][1]=A;
    }
  }

  // ========== 足 ==========
  const drawLegs = () => {
    const BT = (char.label === 'ピカチュウ' || char.label === 'カービィ') ? char.accent
      : (char.label === 'ヨッシー') ? '#FF6F00'
      : (char.label === 'ソニック') ? '#E74C3C'
      : '#374151'
    const BD = adjustColor(BT, -30)

    // ドレスキャラは足を短くする
    if (char.label === 'ピーチ' || char.label === 'ゼルダ' || char.label === 'パルテナ') {
      grid[29][8]=BT; grid[29][9]=BT; grid[29][10]=BT;
      grid[29][13]=BT; grid[29][14]=BT; grid[29][15]=BT;
      grid[30][7]=BD; grid[30][8]=BD; grid[30][9]=BD; grid[30][10]=BD; grid[30][11]=BD;
      grid[30][12]=BD; grid[30][13]=BD; grid[30][14]=BD; grid[30][15]=BD; grid[30][16]=BD;
      return
    }

    // パンツ（体色2）
    for(let y=25;y<=27;y++) {
      grid[y][7]=C2; grid[y][8]=C2; grid[y][9]=C2; grid[y][10]=C2;
      grid[y][13]=C2; grid[y][14]=C2; grid[y][15]=C2; grid[y][16]=C2;
    }
    // ブーツ
    for(let y=28;y<=29;y++) {
      grid[y][7]=BT; grid[y][8]=BT; grid[y][9]=BT; grid[y][10]=BT;
      grid[y][13]=BT; grid[y][14]=BT; grid[y][15]=BT; grid[y][16]=BT;
    }
    grid[30][6]=BD; grid[30][7]=BD; grid[30][8]=BD; grid[30][9]=BD; grid[30][10]=BD; grid[30][11]=BD;
    grid[30][12]=BD; grid[30][13]=BD; grid[30][14]=BD; grid[30][15]=BD; grid[30][16]=BD; grid[30][17]=BD;
  }

  drawHead()
  drawFace()
  drawEyes()
  drawBody()
  drawArms()
  drawLegs()

  return grid
}

function createPixelArt(pixels: string[][]): string {
  const h = pixels.length
  const w = pixels[0].length
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

export default function PixelCharacter({ name, color, status, size = 64 }: Props) {
  const char = smashMap[name]

  const imgSrc = useMemo(() => {
    if (char) {
      const pixels = generateSmashCharacter(char, status === 'idle')
      return createPixelArt(pixels)
    }
    // フォールバック: マッピングにない場合はデフォルト
    const defaultChar: SmashChar = {
      label: name, hair: color, skin: '#FFDBB4', outfit: color,
      outfit2: adjustColor(color, -40), accent: '#FFD700',
      hatType: 'none', hatColor: color, special: 'none',
    }
    const pixels = generateSmashCharacter(defaultChar, status === 'idle')
    return createPixelArt(pixels)
  }, [name, char, color, status])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img
        src={imgSrc}
        alt={char ? `${name} (${char.label})` : name}
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

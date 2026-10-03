import { worldImageUrl } from './assets';
import type { FlagQuarters, HintType } from './types';

/** Android FlagView の4色クォーター描画と同じ見た目 */
export function flagQuartersBackground(q: FlagQuarters): string {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = q;
  return `linear-gradient(to right, ${tl} 50%, ${tr} 50%) 0 0 / 100% 50% no-repeat, linear-gradient(to right, ${bl} 50%, ${br} 50%) 0 100% / 100% 50% no-repeat`;
}

export function applyFlagQuartersStyle(node: HTMLElement, q: FlagQuarters): void {
  node.style.background = flagQuartersBackground(q);
}

const FLAG_HINT_TYPES: HintType[] = ['flag_tl', 'flag_tr', 'flag_bl', 'flag_br'];

export function isFlagHintType(type: HintType): boolean {
  return FLAG_HINT_TYPES.includes(type);
}

type FlagQuarter = 'tl' | 'tr' | 'bl' | 'br';

interface ContentRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 国旗アセット共通のレターボックス色（JPEGの薄いミント白） */
const PAD_R = 241;
const PAD_G = 253;
const PAD_B = 251;
const PAD_TOL = 12;
const PAD_RATIO = 0.95;

function loadFlagBitmap(countryId: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('flag load failed'));
    img.src = worldImageUrl(`flags/${countryId}`);
  });
}

function isPaddingColor(r: number, g: number, b: number): boolean {
  return (
    Math.abs(r - PAD_R) <= PAD_TOL &&
    Math.abs(g - PAD_G) <= PAD_TOL &&
    Math.abs(b - PAD_B) <= PAD_TOL
  );
}

/**
 * アセットのミント白レターボックスを検出し、国旗本体の矩形を返す。
 * スイスなど正方形国旗の左右余白、横長国旗の上下余白をカットする。
 * 日本国旗の白地は純白に近いので余白色と区別できる。
 */
function detectFlagContentRect(bmp: HTMLImageElement): ContentRect {
  const w = bmp.naturalWidth || bmp.width;
  const h = bmp.naturalHeight || bmp.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  const colIsPad = (x: number): boolean => {
    let n = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      if (isPaddingColor(data[i], data[i + 1], data[i + 2])) n++;
    }
    return n / h >= PAD_RATIO;
  };

  const rowIsPad = (y: number): boolean => {
    let n = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isPaddingColor(data[i], data[i + 1], data[i + 2])) n++;
    }
    return n / w >= PAD_RATIO;
  };

  let minX = 0;
  while (minX < w && colIsPad(minX)) minX++;
  let maxX = w - 1;
  while (maxX >= 0 && colIsPad(maxX)) maxX--;
  let minY = 0;
  while (minY < h && rowIsPad(minY)) minY++;
  let maxY = h - 1;
  while (maxY >= 0 && rowIsPad(maxY)) maxY--;

  if (maxX <= minX || maxY <= minY) {
    return { x: 0, y: 0, w, h };
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  return ctx;
}

/** 余白カット後の国旗をアスペクト比を保って中央描画（余白は透明） */
function drawFlagFit(
  ctx: CanvasRenderingContext2D,
  bmp: HTMLImageElement,
  content: ContentRect,
  w: number,
  h: number,
): void {
  const scale = Math.min(w / content.w, h / content.h);
  const dw = content.w * scale;
  const dh = content.h * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(bmp, content.x, content.y, content.w, content.h, dx, dy, dw, dh);
}

function drawFlagQuarter(
  ctx: CanvasRenderingContext2D,
  bmp: HTMLImageElement,
  content: ContentRect,
  quarter: FlagQuarter,
  w: number,
  h: number,
): void {
  const hw = content.w / 2;
  const hh = content.h / 2;
  const src = {
    tl: { x: content.x, y: content.y, sw: hw, sh: hh },
    tr: { x: content.x + hw, y: content.y, sw: hw, sh: hh },
    bl: { x: content.x, y: content.y + hh, sw: hw, sh: hh },
    br: { x: content.x + hw, y: content.y + hh, sw: hw, sh: hh },
  }[quarter];
  ctx.drawImage(bmp, src.x, src.y, src.sw, src.sh, 0, 0, w, h);
}

const MINI_FLAG_W = 28;
const MINI_FLAG_H = 20;
const HINT_FLAG_H = 32;

/** 回答一覧・図鑑の小さな国旗（画像優先、失敗時は4色） */
export function createMiniFlag(countryId: string, quarters: FlagQuarters): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-picker-flag';
  const canvas = document.createElement('canvas');
  canvas.className = 'world-picker-flag-canvas';
  wrap.appendChild(canvas);

  void loadFlagBitmap(countryId)
    .then((bmp) => {
      const content = detectFlagContentRect(bmp);
      const ctx = setupCanvas(canvas, MINI_FLAG_W, MINI_FLAG_H);
      drawFlagFit(ctx, bmp, content, MINI_FLAG_W, MINI_FLAG_H);
    })
    .catch(() => {
      canvas.remove();
      applyFlagQuartersStyle(wrap, quarters);
    });

  return wrap;
}

/** ゲームの国旗ヒント（余白カット後の四分の一、失敗時は単色） */
export function createFlagHintPreview(
  countryId: string,
  type: HintType,
  fallbackColor: string,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-flag-quarter world-flag-crop';
  const quarter = type.replace('flag_', '') as FlagQuarter;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-flag-crop-canvas';
  wrap.appendChild(canvas);

  void loadFlagBitmap(countryId)
    .then((bmp) => {
      const content = detectFlagContentRect(bmp);
      requestAnimationFrame(() => {
        const w = Math.max(wrap.clientWidth, 48);
        const h = Math.max(wrap.clientHeight, HINT_FLAG_H);
        const ctx = setupCanvas(canvas, w, h);
        drawFlagQuarter(ctx, bmp, content, quarter, w, h);
      });
    })
    .catch(() => {
      canvas.remove();
      wrap.classList.remove('world-flag-crop');
      wrap.style.background = fallbackColor;
    });

  return wrap;
}

/** 国詳細の国旗（余白カット＋透明背景でフィット） */
export function createHeroFlag(countryId: string, quarters: FlagQuarters): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-detail-flag';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  const cssW = 160;
  const cssH = 112;

  void loadFlagBitmap(countryId)
    .then((bmp) => {
      const content = detectFlagContentRect(bmp);
      const ctx = setupCanvas(canvas, cssW, cssH);
      drawFlagFit(ctx, bmp, content, cssW, cssH);
    })
    .catch(() => {
      canvas.remove();
      applyFlagQuartersStyle(wrap, quarters);
    });

  return wrap;
}

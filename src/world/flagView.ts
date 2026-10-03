import { worldImageUrl } from './assets';
import type { FlagQuarters } from './types';

/** Android FlagView の4色クォーター描画と同じ見た目 */
export function flagQuartersBackground(q: FlagQuarters): string {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = q;
  return `linear-gradient(to right, ${tl} 50%, ${tr} 50%) 0 0 / 100% 50% no-repeat, linear-gradient(to right, ${bl} 50%, ${br} 50%) 0 100% / 100% 50% no-repeat`;
}

export function applyFlagQuartersStyle(node: HTMLElement, q: FlagQuarters): void {
  node.style.background = flagQuartersBackground(q);
}

function loadFlagBitmap(countryId: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('flag load failed'));
    img.src = worldImageUrl(`flags/${countryId}`);
  });
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

/** Android FlagView: 全体をアスペクト比を保って中央に描画（余白は透明） */
function drawFlagFit(ctx: CanvasRenderingContext2D, bmp: HTMLImageElement, w: number, h: number): void {
  const scale = Math.min(w / bmp.width, h / bmp.height);
  const dw = bmp.width * scale;
  const dh = bmp.height * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}

const MINI_FLAG_W = 28;
const MINI_FLAG_H = 20;

/** 回答一覧・図鑑の小さな国旗（画像優先、失敗時は4色） */
export function createMiniFlag(countryId: string, quarters: FlagQuarters): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-picker-flag';
  const canvas = document.createElement('canvas');
  canvas.className = 'world-picker-flag-canvas';
  wrap.appendChild(canvas);

  void loadFlagBitmap(countryId)
    .then((bmp) => {
      const ctx = setupCanvas(canvas, MINI_FLAG_W, MINI_FLAG_H);
      drawFlagFit(ctx, bmp, MINI_FLAG_W, MINI_FLAG_H);
    })
    .catch(() => {
      canvas.remove();
      applyFlagQuartersStyle(wrap, quarters);
    });

  return wrap;
}

/** 国詳細の国旗（透明背景でフィット） */
export function createHeroFlag(countryId: string, quarters: FlagQuarters): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-detail-flag';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  const cssW = 160;
  const cssH = 112;

  void loadFlagBitmap(countryId)
    .then((bmp) => {
      const ctx = setupCanvas(canvas, cssW, cssH);
      drawFlagFit(ctx, bmp, cssW, cssH);
    })
    .catch(() => {
      canvas.remove();
      applyFlagQuartersStyle(wrap, quarters);
    });

  return wrap;
}

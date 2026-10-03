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

/** 回答一覧・図鑑の小さな国旗（画像優先、失敗時は4色） */
export function createMiniFlag(countryId: string, quarters: FlagQuarters): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-picker-flag';
  const img = document.createElement('img');
  img.className = 'world-picker-flag-img';
  img.src = worldImageUrl(`flags/${countryId}`);
  img.alt = '';
  img.addEventListener(
    'error',
    () => {
      img.remove();
      applyFlagQuartersStyle(wrap, quarters);
    },
    { once: true },
  );
  wrap.appendChild(img);
  return wrap;
}

/** ゲームの国旗ヒント（画像の四分の一、失敗時は単色） */
export function createFlagHintPreview(
  countryId: string,
  type: HintType,
  fallbackColor: string,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'world-flag-quarter world-flag-crop';
  const quarter = type.replace('flag_', '');
  if (quarter) wrap.classList.add(`world-flag-crop--${quarter}`);

  const img = document.createElement('img');
  img.src = worldImageUrl(`flags/${countryId}`);
  img.alt = '';
  img.addEventListener(
    'error',
    () => {
      img.remove();
      wrap.classList.remove('world-flag-crop', `world-flag-crop--${quarter}`);
      wrap.style.background = fallbackColor;
    },
    { once: true },
  );
  wrap.appendChild(img);
  return wrap;
}

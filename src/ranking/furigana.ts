const KEY = 'geo-ranking-furigana';

export function isRankingFuriganaEnabled(): boolean {
  const v = localStorage.getItem(KEY);
  if (v === null) return true;
  return v === '1';
}

export function setRankingFuriganaEnabled(enabled: boolean): void {
  localStorage.setItem(KEY, enabled ? '1' : '0');
}

/** 漢字{よみ} → 漢字（よみ）。スペースがある画面向け */
const RUBY = /([一-龯々〆ヵヶぁ-んァ-ンー]+)\{([^}]+)\}/g;

export function stripRuby(marked: string): string {
  return marked.replace(/\{[^}]+\}/g, '');
}

export function formatWithParenFurigana(marked: string, enabled: boolean): string {
  if (!marked) return '';
  if (!enabled || !marked.includes('{')) return stripRuby(marked);
  return marked.replace(RUBY, '$1（$2）');
}

export function setRubyText(target: HTMLElement, marked: string, enabled: boolean): void {
  target.textContent = formatWithParenFurigana(marked, enabled);
}

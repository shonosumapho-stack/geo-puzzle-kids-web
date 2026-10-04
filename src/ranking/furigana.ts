const KEY = 'geo-ranking-furigana';

export function isRankingFuriganaEnabled(): boolean {
  const v = localStorage.getItem(KEY);
  if (v === null) return true;
  return v === '1';
}

export function setRankingFuriganaEnabled(enabled: boolean): void {
  localStorage.setItem(KEY, enabled ? '1' : '0');
}

const RUBY = /([一-龯々〆ヵヶぁ-んァ-ンー]+)\{([^}]+)\}/g;

export function stripRuby(marked: string): string {
  return marked.replace(/\{[^}]+\}/g, '');
}

export function setRubyText(target: HTMLElement, marked: string, enabled: boolean): void {
  target.replaceChildren();
  if (!marked) return;
  if (!enabled || !marked.includes('{')) {
    target.textContent = stripRuby(marked);
    return;
  }
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RUBY.source, 'g');
  while ((m = re.exec(marked)) !== null) {
    if (m.index > last) target.append(marked.slice(last, m.index));
    const ruby = document.createElement('ruby');
    ruby.append(m[1]!);
    const rt = document.createElement('rt');
    rt.textContent = m[2]!;
    ruby.append(rt);
    target.append(ruby);
    last = m.index + m[0].length;
  }
  if (last < marked.length) target.append(marked.slice(last));
}

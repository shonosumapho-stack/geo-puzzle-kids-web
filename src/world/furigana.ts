const RUBY = /([一-龯々〆ヵヶ]+)\{([^}]+)\}/g;

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

const FURIGANA_KEY = 'geo-world-furigana';

export function isWorldFuriganaEnabled(): boolean {
  const v = localStorage.getItem(FURIGANA_KEY);
  if (v === null) return true;
  return v === '1';
}

export function setWorldFuriganaEnabled(on: boolean): void {
  localStorage.setItem(FURIGANA_KEY, on ? '1' : '0');
}

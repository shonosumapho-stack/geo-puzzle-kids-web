import { el } from '../shared/dom';
import { isWorldFuriganaEnabled, setRubyText, setWorldFuriganaEnabled } from './furigana';
import { clearActiveGame } from './gameState';
import type { GameDifficulty } from './types';
import { DIFFICULTY_LABELS } from './types';

export function renderWorldMenu(root: HTMLElement): void {
  const screen = el('div', 'screen world-menu-screen');
  const back = el('a', 'btn-ghost world-back', '← ホーム');
  back.href = '#/';
  const title = el('h1', 'world-menu-title');
  setRubyText(title, '世界{せかい}の国{くに}当{あ}て', isWorldFuriganaEnabled());
  const sub = el('p', 'world-menu-sub', 'ヒントを開いて国の名前を当てよう');

  const furiganaRow = el('label', 'furigana-toggle');
  const furiganaInput = document.createElement('input');
  furiganaInput.type = 'checkbox';
  furiganaInput.checked = isWorldFuriganaEnabled();
  furiganaRow.append(furiganaInput, el('span', '', 'ふりがな'));
  furiganaInput.addEventListener('change', () => {
    setWorldFuriganaEnabled(furiganaInput.checked);
    renderWorldMenu(root);
  });

  const actions = el('div', 'world-menu-actions');
  for (const d of ['easy', 'medium', 'hard'] as GameDifficulty[]) {
    const btn = el('button', `world-diff-btn world-diff-btn--${d}`, DIFFICULTY_LABELS[d]);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      clearActiveGame();
      window.location.hash = `#/world/play?difficulty=${d}`;
    });
    actions.appendChild(btn);
  }
  const ency = el('a', 'world-diff-btn world-diff-btn--ency', 'クリアした国の図鑑');
  ency.href = '#/world/encyclopedia';

  screen.append(back, title, sub, furiganaRow, actions, ency);
  root.replaceChildren(screen);
}

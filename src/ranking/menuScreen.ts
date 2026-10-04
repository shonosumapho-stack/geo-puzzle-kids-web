import { el } from '../shared/dom';
import { loadRankData } from './data';
import {
  isRankingFuriganaEnabled,
  setRankingFuriganaEnabled,
  setRubyText,
} from './furigana';

export async function renderRankingMenu(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadRankData();
  const furigana = isRankingFuriganaEnabled();

  const screen = el('div', 'screen ranking-screen');
  const back = el('a', 'btn-ghost', '← ホーム');
  back.href = '#/';
  const title = el('h1', 'world-menu-title');
  setRubyText(title, '都道府県{とどうふけん}ランキング', furigana);
  const sub = el('p', 'world-menu-sub', '50の項目でくらべて、クイズにも挑戦しよう');

  const furiganaRow = el('label', 'furigana-toggle');
  const furiganaInput = document.createElement('input');
  furiganaInput.type = 'checkbox';
  furiganaInput.checked = furigana;
  furiganaRow.append(furiganaInput, el('span', '', 'ふりがな'));
  furiganaInput.addEventListener('change', () => {
    setRankingFuriganaEnabled(furiganaInput.checked);
    void renderRankingMenu(root);
  });

  const quiz = el('a', 'world-diff-btn world-diff-btn--easy', 'ランキングクイズ（10もん）');
  quiz.href = '#/ranking/quiz';

  const listTitle = el('h2', 'ranking-list-title', 'ランキングをみる');
  const list = el('div', 'ranking-cat-list');
  for (const cat of data.categories) {
    const row = el('a', 'ranking-cat-row');
    row.href = `#/ranking/category/${cat.id}`;
    const name = el('span', 'ranking-cat-name');
    setRubyText(name, cat.nameRuby, furigana);
    const top = cat.ranking[0];
    const topEl = el('span', 'ranking-cat-top');
    setRubyText(topEl, `1位 ${top.nameRuby}`, furigana);
    row.append(name, topEl);
    list.appendChild(row);
  }

  const note = el('p', 'ranking-note', data.sourceNote);
  screen.append(back, title, sub, furiganaRow, quiz, listTitle, list, note);
  root.replaceChildren(screen);
}

import { el } from '../shared/dom';
import { getCategory, loadRankData } from './data';
import { isRankingFuriganaEnabled, setRubyText } from './furigana';

export async function renderRankingCategory(root: HTMLElement, categoryId: string): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadRankData();
  const cat = getCategory(data, categoryId);
  if (!cat) {
    root.innerHTML = '<p class="error">みつかりません</p><a href="#/ranking">もどる</a>';
    return;
  }
  const furigana = isRankingFuriganaEnabled();

  const screen = el('div', 'screen ranking-screen');
  const back = el('a', 'btn-ghost', '← ランキング');
  back.href = '#/ranking';
  const title = el('h1', 'world-menu-title');
  setRubyText(title, cat.nameRuby, furigana);
  const note = el('p', 'world-menu-sub');
  setRubyText(note, cat.noteRuby, furigana);

  screen.append(back, title, note);

  if (cat.unitLabel) {
    screen.appendChild(el('p', 'ranking-unit', `単位: ${cat.unitLabel}`));
  }

  if (cat.source || cat.sourceYear) {
    const src = el('p', 'ranking-source');
    const parts = [cat.source, cat.sourceYear].filter(Boolean).join(' / ');
    src.textContent = `出典: ${parts}`;
    screen.appendChild(src);
  }

  const list = el('ol', cat.hasValues ? 'ranking-board' : 'ranking-board ranking-board--name-only');
  cat.ranking.forEach((entry, i) => {
    const li = el('li', 'ranking-board-row');
    const rank = el('span', 'ranking-board-rank', `${i + 1}`);
    const name = el('span', 'ranking-board-name');
    setRubyText(name, entry.nameRuby, furigana);
    li.append(rank, name);
    if (cat.hasValues && entry.valueLabel) {
      li.appendChild(el('span', 'ranking-board-value', entry.valueLabel));
    }
    list.appendChild(li);
  });

  screen.appendChild(list);
  root.replaceChildren(screen);
}

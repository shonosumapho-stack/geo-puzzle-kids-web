import { el } from '../shared/dom';
import { worldImageUrl } from './assets';
import { findCountry, loadWorldData } from './countryData';
import { isWorldFuriganaEnabled, setRubyText } from './furigana';
import { clearActiveGame, loadActiveGame, saveActiveGame } from './gameState';

export async function renderWorldCountryDetail(
  root: HTMLElement,
  countryId: string,
  opts: { fromGame?: boolean; difficulty?: string },
): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadWorldData();
  const country = findCountry(data, countryId);
  const entry = data.encyclopedia[countryId];
  if (!country || !entry) {
    root.innerHTML = '<p class="error">国が見つかりません</p>';
    return;
  }

  const furigana = isWorldFuriganaEnabled();
  const screen = el('div', 'screen world-detail-screen');
  const back = el('a', 'btn-ghost', opts.fromGame ? '← ゲーム' : '← 図鑑');
  back.href = opts.fromGame ? `#/world/play?difficulty=${opts.difficulty ?? 'easy'}` : '#/world/encyclopedia';

  const name = el('h1', 'world-detail-name');
  setRubyText(name, country.nameRuby, furigana);
  const intro = el('p', 'world-detail-intro');
  setRubyText(intro, entry.introDetailRuby, furigana);

  const heroRow = el('div', 'world-detail-heroes');
  for (const path of [entry.flagPhoto, entry.countryMapPhoto, entry.worldMapPhoto]) {
    if (!path) continue;
    const img = document.createElement('img');
    img.className = 'world-detail-map';
    img.src = worldImageUrl(path);
    img.alt = '';
    img.loading = 'lazy';
    heroRow.appendChild(img);
  }

  screen.append(back, name, intro, heroRow);

  for (const topic of entry.topics) {
    const block = el('section', 'world-topic');
    const h2 = el('h2', 'world-topic-title');
    setRubyText(h2, topic.nameRuby, furigana);
    const sum = el('p', 'world-topic-summary');
    setRubyText(sum, topic.summaryRuby, furigana);
    const det = el('div', 'world-topic-detail');
    setRubyText(det, topic.detailRuby, furigana);
    block.append(h2, sum);
    if (topic.hasPhoto && topic.photoAsset) {
      const img = document.createElement('img');
      img.className = 'world-topic-photo';
      img.src = worldImageUrl(topic.photoAsset);
      img.alt = topic.name;
      img.loading = 'lazy';
      const credit = data.photoCredits[topic.photoAsset];
      if (credit) {
        const cap = el('p', 'world-photo-credit', credit);
        block.append(img, cap);
      } else {
        block.append(img);
      }
    }
    block.append(det);
    screen.append(block);
  }

  if (opts.fromGame) {
    const active = loadActiveGame();
    const nextBtn = el('button', 'btn-primary', 'つぎのもんだい');
    nextBtn.type = 'button';
    nextBtn.addEventListener('click', () => {
      if (!active) {
        window.location.hash = '#/world';
        return;
      }
      const nextIndex = active.questionIndex + 1;
      if (nextIndex >= active.countryIds.length) {
        clearActiveGame();
        sessionStorage.setItem(
          'geo-world-result',
          JSON.stringify({
            difficulty: active.difficulty,
            wrongAttempts: active.wrongAttempts,
            results: active.results,
          }),
        );
        window.location.hash = '#/world/result';
      } else {
        saveActiveGame({ ...active, questionIndex: nextIndex });
        window.location.hash = `#/world/play?difficulty=${active.difficulty}`;
      }
    });
    screen.appendChild(nextBtn);
  }

  root.replaceChildren(screen);
}

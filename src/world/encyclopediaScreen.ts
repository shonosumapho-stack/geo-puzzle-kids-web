import { el } from '../shared/dom';
import { loadWorldData, findCountry } from './countryData';
import { isWorldFuriganaEnabled, setRubyText } from './furigana';
import { createMiniFlag } from './flagView';
import { getUnlockedCountryIds } from './unlockStore';

export async function renderWorldEncyclopedia(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadWorldData();
  const unlocked = getUnlockedCountryIds();
  const countries = [...unlocked]
    .map((id) => findCountry(data, id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  const screen = el('div', 'screen');
  const back = el('a', 'btn-ghost', '← 世界の国当て');
  back.href = '#/world';
  screen.appendChild(back);
  screen.appendChild(el('h1', 'world-menu-title', 'クリアした国の図鑑'));

  if (!countries.length) {
    screen.appendChild(el('p', 'world-empty', 'まだ国が登録されていません。ゲームで正解すると増えます。'));
  } else {
    const list = el('div', 'list');
    const furigana = isWorldFuriganaEnabled();
    for (const c of countries) {
      const row = el('button', 'list-row world-ency-row');
      row.type = 'button';
      const name = el('span', '');
      setRubyText(name, c.nameRuby, furigana);
      row.append(createMiniFlag(c.id, c.flagQuarters), name);
      row.addEventListener('click', () => {
        window.location.hash = `#/world/country/${c.id}`;
      });
      list.appendChild(row);
    }
    screen.append(list);
  }

  root.replaceChildren(screen);
}

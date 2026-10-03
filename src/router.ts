import { renderHub } from './hub/hubScreen';
import { PLAY_MODES as JAPAN_MODES } from './japan/catalog';
import { renderJapanMenu } from './japan/menuScreen';
import { PLAY_MODES as KANA_MODES } from './kanagawa/catalog';
import { renderKanagawaMenu } from './kanagawa/menuScreen';
import { loadMunicipalities, loadPrefectures, loadWards, piecesForCodes } from './shared/mapData';
import { renderJapanEncyclopedia, renderKanagawaEncyclopedia } from './shared/encyclopediaUi';
import { renderMapPuzzle } from './shared/mapPuzzle';
import { renderWorldCountryDetail } from './world/countryDetailScreen';
import { renderWorldEncyclopedia } from './world/encyclopediaScreen';
import { renderWorldGame } from './world/gameScreen';
import { renderWorldMenu } from './world/menuScreen';
import { renderWorldResult } from './world/resultScreen';
import type { GameDifficulty } from './world/types';

function parseQuery(hash: string): URLSearchParams {
  const q = hash.indexOf('?');
  if (q < 0) return new URLSearchParams();
  return new URLSearchParams(hash.slice(q + 1));
}

function routePath(hash: string): string {
  const base = hash.replace(/^#/, '').split('?')[0];
  return base || '/';
}

function encyclopediaPlayRegion(query: URLSearchParams): string | null {
  if (query.get('from') !== 'play') return null;
  return query.get('region');
}

async function renderJapanPlay(root: HTMLElement, regionId: string): Promise<void> {
  const mode = JAPAN_MODES.find((m) => m.id === regionId) ?? JAPAN_MODES[2];
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const all = await loadPrefectures();
  const pieces = piecesForCodes(all, mode.codes);
  renderMapPuzzle(root, {
    title: `日本 — ${mode.label}`,
    backHash: '#/japan',
    storageKey: `geo-japan-best-${mode.id}`,
    pieces,
    encyclopediaHref: (code) =>
      `#/japan/encyclopedia?code=${encodeURIComponent(code)}&from=play&region=${encodeURIComponent(mode.id)}`,
  });
}

async function renderKanagawaPlay(root: HTMLElement, regionId: string): Promise<void> {
  const mode = KANA_MODES.find((m) => m.id === regionId) ?? KANA_MODES[0];
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const all =
    mode.dataset === 'wards' ? await loadWards() : await loadMunicipalities();
  const pieces = piecesForCodes(all, mode.codes);
  renderMapPuzzle(root, {
    title: `神奈川 — ${mode.label}`,
    backHash: '#/kanagawa',
    storageKey: `geo-kana-best-${mode.id}`,
    pieces,
    encyclopediaHref: (code) =>
      `#/kanagawa/encyclopedia?code=${encodeURIComponent(code)}&from=play&region=${encodeURIComponent(mode.id)}`,
  });
}

export function navigate(root: HTMLElement): void {
  const hash = window.location.hash || '#/';
  const path = routePath(hash);
  const query = parseQuery(hash);

  if (path === '/' || path === '') {
    renderHub(root);
    document.title = '地理ゲーム';
    return;
  }
  if (path === '/world') {
    renderWorldMenu(root);
    document.title = '世界の国当て';
    return;
  }
  if (path === '/world/play') {
    const d = (query.get('difficulty') ?? 'easy') as GameDifficulty;
    const difficulty = d === 'medium' || d === 'hard' ? d : 'easy';
    void renderWorldGame(root, difficulty);
    document.title = '世界の国当て';
    return;
  }
  if (path === '/world/encyclopedia') {
    void renderWorldEncyclopedia(root);
    document.title = '世界の国図鑑';
    return;
  }
  if (path === '/world/result') {
    void renderWorldResult(root);
    document.title = 'けっか';
    return;
  }
  if (path.startsWith('/world/country/')) {
    const countryId = path.replace('/world/country/', '');
    void renderWorldCountryDetail(root, countryId, {
      fromGame: query.get('from') === 'game',
      difficulty: query.get('difficulty') ?? undefined,
    });
    document.title = '国のくわし';
    return;
  }
  if (path === '/japan') {
    renderJapanMenu(root);
    document.title = '日本地図パズル';
    return;
  }
  if (path === '/japan/play') {
    void renderJapanPlay(root, query.get('region') ?? 'nationwide');
    document.title = '日本地図パズル';
    return;
  }
  if (path === '/japan/encyclopedia') {
    void renderJapanEncyclopedia(root, {
      code: query.get('code'),
      playRegion: encyclopediaPlayRegion(query),
    });
    return;
  }
  if (path === '/kanagawa') {
    renderKanagawaMenu(root);
    document.title = '神奈川地図パズル';
    return;
  }
  if (path === '/kanagawa/play') {
    void renderKanagawaPlay(root, query.get('region') ?? 'kanagawa');
    document.title = '神奈川地図パズル';
    return;
  }
  if (path === '/kanagawa/encyclopedia') {
    void renderKanagawaEncyclopedia(root, {
      code: query.get('code'),
      playRegion: encyclopediaPlayRegion(query),
    });
    return;
  }

  window.location.hash = '#/';
}

export function startRouter(root: HTMLElement): void {
  window.addEventListener('hashchange', () => navigate(root));
  navigate(root);
}

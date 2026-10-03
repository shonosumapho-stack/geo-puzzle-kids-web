import { renderHub } from './hub/hubScreen';
import { PLAY_MODES as JAPAN_MODES } from './japan/catalog';
import { renderJapanMenu } from './japan/menuScreen';
import { PLAY_MODES as KANA_MODES } from './kanagawa/catalog';
import { renderKanagawaMenu } from './kanagawa/menuScreen';
import { loadMunicipalities, loadPrefectures, loadWards, piecesForCodes } from './shared/mapData';
import { renderJapanEncyclopedia, renderKanagawaEncyclopedia } from './shared/encyclopediaUi';
import { renderMapPuzzle } from './shared/mapPuzzle';

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
    hint: '下のピースをドラッグして枠に合わせます。はめる前は名前は出ません。はめたあとは地図をタップすると名前が見えます。',
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
    hint: '下のピースをドラッグして枠に合わせます。はめる前は名前は出ません。はめたあとは地図をタップすると名前が見えます。',
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
    document.title = '地図パズル';
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

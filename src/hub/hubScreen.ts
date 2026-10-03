import { el } from '../shared/dom';

export function renderHub(root: HTMLElement): void {
  const screen = el('div', 'screen hub-screen');
  const title = el('h1', 'hub-title', '地図パズル');
  const sub = el('p', 'hub-subtitle', 'ピースをドラッグして地図にハメよう');
  const nav = el('nav', 'hub-nav');

  const japan = el('a', 'hub-btn hub-btn-japan', '日本地図パズル');
  japan.href = '#/japan';
  const kana = el('a', 'hub-btn hub-btn-kanagawa', '神奈川地図パズル');
  kana.href = '#/kanagawa';

  nav.append(japan, kana);
  screen.append(title, sub, nav);
  root.replaceChildren(screen);
}

import { el } from '../shared/dom';
import { PLAY_MODES } from './catalog';

function formatBest(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenth = Math.floor((ms % 1000) / 100);
  return `${min}:${sec.toString().padStart(2, '0')}.${tenth}`;
}

export function renderKanagawaMenu(root: HTMLElement): void {
  const screen = el('div', 'screen hub-screen');
  const back = el('a', 'btn-ghost btn-back', '← ホーム');
  back.href = '#/';
  const title = el('h1', 'game-title', '神奈川地図パズル');
  const hint = el(
    'p',
    'game-hint',
    '市町村や区のピースを神奈川の地図にハメます。はめたあとは地図をタップすると名前が見えます。',
  );
  const ency = el('a', 'btn-secondary ency-menu-btn', '図鑑を見る');
  ency.href = '#/kanagawa/encyclopedia';
  const list = el('div', 'mode-list');

  for (const mode of PLAY_MODES) {
    const card = el('div', 'mode-card');
    const name = el('h2', 'mode-card-title', mode.label);
    const key = `geo-kana-best-${mode.id}`;
    const stored = localStorage.getItem(key);
    const best = el(
      'p',
      'mode-card-best',
      stored ? `ベスト: ${formatBest(parseInt(stored, 10))}` : 'ベスト: —',
    );
    const play = el('a', 'btn-primary mode-play', 'プレイ');
    play.href = `#/kanagawa/play?region=${mode.id}`;
    card.append(name, best, play);
    list.appendChild(card);
  }

  screen.append(back, title, hint, ency, list);
  root.replaceChildren(screen);
}

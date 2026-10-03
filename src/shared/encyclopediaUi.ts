import { KANAGAWA_CODES, YOKOHAMA_WARD_CODES } from '../kanagawa/catalog';
import { entryByCode, loadJapanEncyclopedia, loadKanagawaEncyclopedia } from './encyclopediaData';
import { attachEncyPhoto, type PhotoPack } from './encyclopediaPhotos';
import type { EncyclopediaEntry, EncyclopediaTopic } from './encyclopediaTypes';
import { el } from './dom';

function formatPopulation(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万人`;
  return `${n}人`;
}

function topicBlock(pack: PhotoPack, topic: EncyclopediaTopic, heading: string): HTMLElement {
  const section = el('section', 'ency-section');
  attachEncyPhoto(section, pack, { photo: topic.photo, photoQuery: topic.photoQuery });
  section.appendChild(el('h3', 'ency-topic-title', `${heading}: ${topic.name}`));
  const summary = el('p', 'ency-summary', topic.summary);
  section.appendChild(summary);
  if (topic.detail && topic.detail !== topic.summary) {
    section.appendChild(el('p', 'ency-detail', topic.detail));
  }
  return section;
}

function renderDetail(
  root: HTMLElement,
  pack: PhotoPack,
  entry: EncyclopediaEntry,
  backHref: string,
  backLabel: string,
): void {
  const screen = el('div', 'screen ency-screen');
  const back = el('a', 'btn-ghost btn-back', backLabel);
  back.href = backHref;
  const title = el('h1', 'game-title', entry.name);
  const hero = el('div', 'ency-hero');
  attachEncyPhoto(hero, pack, {
    photo: entry.mapPhoto,
    photoQuery: entry.trivia?.photoQuery ?? entry.name,
  });

  const meta = el('div', 'ency-meta');
  if (entry.capital) {
    meta.appendChild(el('p', '', `所在地: ${entry.capital}`));
  }
  if (entry.areaKm2 != null) {
    meta.appendChild(el('p', '', `面積: 約 ${entry.areaKm2.toLocaleString('ja-JP')} km²`));
  }
  if (entry.population != null) {
    meta.appendChild(el('p', '', `人口: 約 ${formatPopulation(entry.population)}`));
  }

  const body = el('div', 'ency-body');
  if (entry.foods?.length) {
    body.appendChild(el('h2', 'ency-heading', '食べ物・名物'));
    for (const f of entry.foods) body.appendChild(topicBlock(pack, f, '食べ物'));
  }
  if (entry.places?.length) {
    body.appendChild(el('h2', 'ency-heading', '場所・見どころ'));
    for (const p of entry.places) body.appendChild(topicBlock(pack, p, '場所'));
  }
  if (entry.trivia) {
    body.appendChild(el('h2', 'ency-heading', '豆知識'));
    body.appendChild(topicBlock(pack, entry.trivia, '豆知識'));
  }

  screen.append(back, title, hero, meta, body);
  root.replaceChildren(screen);
}

function renderList(
  root: HTMLElement,
  options: {
    pageTitle: string;
    backHash: string;
    detailHashPrefix: string;
    pack: PhotoPack;
    sections: { title: string; entries: EncyclopediaEntry[] }[];
    code?: string | null;
    playRegion?: string | null;
    playPath?: string;
  },
): void {
  const { pageTitle, backHash, detailHashPrefix, pack, sections, code, playRegion, playPath } =
    options;

  if (code) {
    const detailBackHref = playRegion && playPath
      ? `#${playPath}?region=${encodeURIComponent(playRegion)}`
      : `#${detailHashPrefix}`;
    const detailBackLabel = playRegion ? '← パズルに戻る' : '← 一覧';
    for (const sec of sections) {
      const hit = entryByCode(sec.entries, code);
      if (hit) {
        renderDetail(root, pack, hit, detailBackHref, detailBackLabel);
        document.title = `${pageTitle} — ${hit.name}`;
        return;
      }
    }
    root.innerHTML = '<p class="loading">見つかりませんでした。</p>';
    return;
  }

  const screen = el('div', 'screen ency-screen');
  const back = el('a', 'btn-ghost btn-back', '← 戻る');
  back.href = backHash;
  const title = el('h1', 'game-title', pageTitle);
  const hint = el('p', 'game-hint', '名前をタップするとくわしく読めます。');

  const list = el('div', 'ency-list');
  for (const sec of sections) {
    if (sec.title) {
      list.appendChild(el('h2', 'ency-section-heading', sec.title));
    }
    for (const entry of sec.entries) {
      const link = el('a', 'ency-row', '');
      link.href = `#${detailHashPrefix}?code=${entry.code}`;
      link.appendChild(el('span', 'ency-row-name', entry.name));
      if (entry.capital) {
        link.appendChild(el('span', 'ency-row-capital', `（${entry.capital}）`));
      }
      list.appendChild(link);
    }
  }

  screen.append(back, title, hint, list);
  root.replaceChildren(screen);
  document.title = pageTitle;
}

export interface EncyclopediaRouteParams {
  code: string | null;
  playRegion: string | null;
}

export async function renderJapanEncyclopedia(
  root: HTMLElement,
  params: EncyclopediaRouteParams,
): Promise<void> {
  const { code, playRegion } = params;
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const all = await loadJapanEncyclopedia();
  const sorted = [...all].sort((a, b) => a.code.localeCompare(b.code));
  renderList(root, {
    pageTitle: '日本 — 図鑑',
    backHash: '#/japan',
    detailHashPrefix: '/japan/encyclopedia',
    playPath: '/japan/play',
    pack: 'japan',
    sections: [{ title: '', entries: sorted }],
    code,
    playRegion,
  });
}

export async function renderKanagawaEncyclopedia(
  root: HTMLElement,
  params: EncyclopediaRouteParams,
): Promise<void> {
  const { code, playRegion } = params;
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const all = await loadKanagawaEncyclopedia();
  const byCode = new Map(all.map((e) => [e.code, e]));

  const kanaEntries = KANAGAWA_CODES.map((c) => byCode.get(c)).filter(Boolean) as EncyclopediaEntry[];
  const wardEntries = YOKOHAMA_WARD_CODES.map((c) => byCode.get(c)).filter(Boolean) as EncyclopediaEntry[];

  renderList(root, {
    pageTitle: '神奈川 — 図鑑',
    backHash: '#/kanagawa',
    detailHashPrefix: '/kanagawa/encyclopedia',
    playPath: '/kanagawa/play',
    pack: 'kana',
    sections: [
      { title: '神奈川県（市町村）', entries: kanaEntries },
      { title: '横浜市（区）', entries: wardEntries },
    ],
    code,
    playRegion,
  });
}

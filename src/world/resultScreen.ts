import { el } from '../shared/dom';
import { findCountry, loadWorldData } from './countryData';
import { averagePanels, gameRank, totalScore } from './score';
import type { GameDifficulty, QuestionResult } from './types';
import { DIFFICULTY_LABELS } from './types';
import { clearActiveGame } from './gameState';

export async function renderWorldResult(root: HTMLElement): Promise<void> {
  clearActiveGame();
  const raw = sessionStorage.getItem('geo-world-result');
  if (!raw) {
    root.innerHTML = '<p class="error">結果がありません</p><a href="#/world">戻る</a>';
    return;
  }
  const parsed = JSON.parse(raw) as {
    difficulty: GameDifficulty;
    wrongAttempts: number;
    results: QuestionResult[];
  };
  sessionStorage.removeItem('geo-world-result');

  const data = await loadWorldData();
  const score = totalScore(parsed.results, parsed.wrongAttempts);
  const avg = averagePanels(parsed.results);
  const rank = gameRank(score, avg);

  const screen = el('div', 'screen world-result-screen');
  screen.appendChild(el('h1', '', 'けっか'));
  const card = el('div', 'result-card');
  card.append(
    el('p', 'result-emoji', rank.emoji),
    el('h2', 'result-rank', rank.title),
    el('p', '', rank.message),
    el('p', 'result-score', `スコア ${score}`),
    el('p', 'world-result-meta', `むずかしさ: ${DIFFICULTY_LABELS[parsed.difficulty]}`),
  );
  screen.append(card);

  const list = el('ul', 'world-result-list');
  for (const r of parsed.results) {
    const c = findCountry(data, r.countryId);
    const li = el('li', '', `${c?.name ?? r.countryId} … +${r.questionScore}（ヒント ${r.panelsOpened + r.penaltyPanels}枚）`);
    list.appendChild(li);
  }
  screen.append(list);

  const again = el('a', 'btn-primary', 'もういちど');
  again.href = `#/world/play?difficulty=${parsed.difficulty}`;
  const home = el('a', 'btn-secondary', 'ホームへ');
  home.href = '#/';
  screen.append(again, home);
  root.replaceChildren(screen);
}

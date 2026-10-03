import { el } from '../shared/dom';
import {
  countriesForDifficulty,
  findCountry,
  loadWorldData,
  randomQuizCountries,
} from './countryData';
import { isWorldFuriganaEnabled, setRubyText } from './furigana';
import { buildPanels } from './hintGenerator';
import { clearActiveGame, loadActiveGame, saveActiveGame } from './gameState';
import { questionScore, totalScore, WRONG_PENALTY_PANELS } from './score';
import type { Country, GameDifficulty, HintPanel, QuestionResult } from './types';
import { createFlagHintPreview, createMiniFlag, isFlagHintType } from './flagView';
import { unlockCountry } from './unlockStore';

export async function renderWorldGame(root: HTMLElement, difficulty: GameDifficulty): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadWorldData();

  let saved = loadActiveGame();
  if (saved && saved.difficulty !== difficulty) {
    clearActiveGame();
    saved = null;
  }

  let quiz: Country[];
  let qIndex: number;
  let combo: number;
  let wrongAttempts: number;
  let results: QuestionResult[];

  if (saved && saved.countryIds.length > 0) {
    quiz = saved.countryIds.map((id) => findCountry(data, id)).filter((c): c is Country => !!c);
    qIndex = saved.questionIndex;
    combo = saved.combo;
    wrongAttempts = saved.wrongAttempts;
    results = saved.results;
  } else {
    quiz = randomQuizCountries(data, difficulty, 5);
    qIndex = 0;
    combo = 0;
    wrongAttempts = 0;
    results = [];
    saveActiveGame({
      difficulty,
      countryIds: quiz.map((c) => c.id),
      questionIndex: 0,
      combo: 0,
      wrongAttempts: 0,
      results: [],
    });
  }

  if (!quiz.length) {
    root.innerHTML = '<p class="error">このむずかしさのデータがありません</p>';
    return;
  }

  const furigana = isWorldFuriganaEnabled();
  let panels: HintPanel[] = [];
  let openedCount = 0;
  let penaltyPanels = 0;
  let answerLocked = false;
  let current: Country = quiz[qIndex];

  const screen = el('div', 'screen world-game-screen');
  const header = el('div', 'world-game-header');
  const back = el('a', 'btn-ghost', '← やめる');
  back.href = '#/world';
  back.addEventListener('click', () => clearActiveGame());
  const progress = el('span', 'world-game-progress', '');
  header.append(back, progress);

  const stats = el('div', 'world-game-stats');
  const openedEl = el('span', '', '');
  const scoreEl = el('span', 'world-game-score', '');
  const penaltyEl = el('span', 'world-game-penalty');
  const comboEl = el('span', 'world-game-combo');
  stats.append(openedEl, scoreEl, penaltyEl, comboEl);

  const grid = el('div', 'world-panel-grid');
  const answerBtn = el('button', 'btn-primary world-answer-btn');
  answerBtn.type = 'button';
  setRubyText(answerBtn, '答{こた}えを選{えら}ぶ', furigana);
  const feedback = el('div', 'world-feedback');
  feedback.hidden = true;

  screen.append(header, stats, grid, answerBtn, feedback);
  root.replaceChildren(screen);

  const persist = () => {
    saveActiveGame({
      difficulty,
      countryIds: quiz.map((c) => c.id),
      questionIndex: qIndex,
      combo,
      wrongAttempts,
      results,
    });
  };

  const updateStats = () => {
    progress.textContent = `もんだい ${qIndex + 1} / ${quiz.length}`;
    openedEl.textContent = `開いたヒント ${openedCount}`;
    scoreEl.textContent = `スコア ${totalScore(results, wrongAttempts)}`;
    penaltyEl.hidden = penaltyPanels <= 0;
    if (!penaltyEl.hidden) penaltyEl.textContent = `ペナルティ +${penaltyPanels}枚`;
    comboEl.hidden = combo < 2;
    if (!comboEl.hidden) comboEl.textContent = `コンボ ×${combo}`;
    answerBtn.disabled = answerLocked;
  };

  const renderPanelContent = (cell: HTMLElement, p: HintPanel) => {
    cell.replaceChildren();
    if (!p.isRevealed) {
      cell.appendChild(el('span', 'world-panel-hidden', '?'));
      return;
    }
    const title = el('div', 'world-panel-title');
    setRubyText(title, p.titleRuby, furigana);
    cell.appendChild(title);
    if (p.flagQuarter && p.flagCountryId && isFlagHintType(p.type)) {
      cell.appendChild(createFlagHintPreview(p.flagCountryId, p.type, p.flagQuarter));
    } else if (p.flagQuarter) {
      const flag = el('div', 'world-flag-quarter');
      flag.style.background = p.flagQuarter;
      cell.appendChild(flag);
      const cap = el('div', 'world-panel-body');
      setRubyText(cap, p.bodyRuby, furigana);
      cell.appendChild(cap);
    } else if (p.silhouettePath) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('class', 'world-silhouette');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', p.silhouettePath);
      path.setAttribute('fill', '#0ea5e9');
      svg.appendChild(path);
      cell.appendChild(svg);
      const cap = el('div', 'world-panel-body');
      setRubyText(cap, p.bodyRuby, furigana);
      cell.appendChild(cap);
    } else {
      const body = el('div', 'world-panel-body');
      setRubyText(body, p.bodyRuby, furigana);
      cell.appendChild(body);
    }
  };

  const renderGrid = () => {
    grid.replaceChildren();
    panels.forEach((p, i) => {
      const btn = el('button', 'world-panel');
      btn.type = 'button';
      btn.disabled = answerLocked || p.isRevealed;
      renderPanelContent(btn, p);
      btn.addEventListener('click', () => {
        if (answerLocked || panels[i].isRevealed) return;
        panels[i] = { ...panels[i], isRevealed: true };
        openedCount++;
        renderPanelContent(btn, panels[i]);
        btn.disabled = true;
        updateStats();
      });
      grid.appendChild(btn);
    });
    updateStats();
  };

  const loadQuestion = (index: number) => {
    qIndex = index;
    current = quiz[index];
    panels = buildPanels(current, data);
    openedCount = 0;
    penaltyPanels = 0;
    answerLocked = false;
    feedback.hidden = true;
    persist();
    renderGrid();
  };

  const showAnswerPicker = () => {
    const dialog = el('div', 'puzzle-dialog');
    const card = el('div', 'puzzle-dialog-card world-picker-card');
    card.appendChild(el('h2', '', 'どの国？'));
    const list = el('div', 'world-picker-list');
    for (const c of countriesForDifficulty(data, difficulty).sort((a, b) =>
      a.name.localeCompare(b.name, 'ja'),
    )) {
      const row = el('button', 'world-picker-item');
      row.type = 'button';
      const name = el('span', '');
      setRubyText(name, c.nameRuby, furigana);
      if (difficulty === 'easy') {
        row.append(createMiniFlag(c.id, c.flagQuarters), name);
      } else {
        row.append(name);
      }
      row.addEventListener('click', () => {
        dialog.remove();
        submitAnswer(c.id);
      });
      list.appendChild(row);
    }
    card.appendChild(list);
    const close = el('button', 'btn-secondary', '閉じる');
    close.type = 'button';
    close.addEventListener('click', () => dialog.remove());
    card.appendChild(close);
    dialog.appendChild(card);
    dialog.addEventListener('click', (ev) => {
      if (ev.target === dialog) dialog.remove();
    });
    screen.append(dialog);
  };

  const submitAnswer = (countryId: string) => {
    if (answerLocked) return;
    if (countryId === current.id) {
      combo++;
      const effective = openedCount + penaltyPanels;
      const qScore = questionScore(effective, combo);
      results = [
        ...results,
        {
          countryId: current.id,
          panelsOpened: openedCount,
          penaltyPanels,
          questionScore: qScore,
        },
      ];
      unlockCountry(current.id);
      answerLocked = true;
      persist();
      feedback.textContent = `せいかい！ +${qScore}`;
      feedback.className = 'world-feedback world-feedback--ok';
      feedback.hidden = false;
      updateStats();
      window.setTimeout(() => {
        window.location.hash = `#/world/country/${current.id}?from=game&difficulty=${difficulty}`;
      }, 700);
    } else {
      wrongAttempts++;
      combo = 0;
      penaltyPanels += WRONG_PENALTY_PANELS;
      answerLocked = true;
      persist();
      feedback.textContent = 'ざんねん… もう一度考えてみよう';
      feedback.className = 'world-feedback world-feedback--bad';
      feedback.hidden = false;
      updateStats();
      window.setTimeout(() => {
        answerLocked = false;
        feedback.hidden = true;
        updateStats();
      }, 1800);
    }
  };

  answerBtn.addEventListener('click', showAnswerPicker);
  loadQuestion(qIndex);
}

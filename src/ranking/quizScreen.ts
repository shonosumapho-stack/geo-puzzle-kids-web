import { el } from '../shared/dom';
import { loadRankData, makeRankingQuiz } from './data';
import { isRankingFuriganaEnabled, setRubyText } from './furigana';
import type { RankingQuizQuestion } from './types';

const BEST_KEY = 'geo-ranking-quiz-best';

function getBest(): number {
  const v = localStorage.getItem(BEST_KEY);
  if (!v) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function setBest(score: number): void {
  if (score > getBest()) localStorage.setItem(BEST_KEY, String(score));
}

export async function renderRankingQuiz(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="loading">読み込み中…</p>';
  const data = await loadRankData();
  const questions = makeRankingQuiz(data, 10);
  if (!questions.length) {
    root.innerHTML = '<p class="error">クイズを作れませんでした</p>';
    return;
  }

  const furigana = () => isRankingFuriganaEnabled();
  const screen = el('div', 'screen ranking-screen');
  const back = el('a', 'btn-ghost', '← ランキング');
  back.href = '#/ranking';
  const title = el('h1', 'world-menu-title', 'ランキングクイズ');
  screen.append(back, title);

  let index = 0;
  let correctCount = 0;
  let answered = false;

  const progress = el('p', 'quiz-progress', '');
  const prompt = el('p', 'quiz-question');
  const catLine = el('p', 'ranking-quiz-cat');
  const feedback = el('p', 'quiz-feedback');
  feedback.hidden = true;
  const choices = el('div', 'quiz-choices');
  const nextBtn = el('button', 'btn-primary', 'つぎへ');
  nextBtn.type = 'button';
  nextBtn.hidden = true;

  screen.append(progress, catLine, prompt, choices, feedback, nextBtn);
  root.replaceChildren(screen);

  const showQuestion = (q: RankingQuizQuestion) => {
    answered = false;
    progress.textContent = `もんだい ${index + 1} / ${questions.length}`;
    catLine.replaceChildren();
    prompt.replaceChildren();
    setRubyText(catLine, q.categoryNameRuby, furigana());
    setRubyText(prompt, q.promptRuby, furigana());
    feedback.hidden = true;
    nextBtn.hidden = true;
    choices.replaceChildren();

    for (const choice of q.choices) {
      const btn = el('button', 'quiz-choice');
      btn.type = 'button';
      btn.dataset.code = choice.code;
      setRubyText(btn, choice.nameRuby, furigana());
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const ok = choice.code === q.correctCode;
        if (ok) correctCount++;
        for (const child of choices.querySelectorAll('.quiz-choice')) {
          const b = child as HTMLButtonElement;
          b.disabled = true;
          if (b.dataset.code === q.correctCode) b.classList.add('quiz-choice--correct');
          else if (b.dataset.code === choice.code && !ok) b.classList.add('quiz-choice--wrong');
        }
        feedback.textContent = ok ? 'せいかい！' : 'ざんねん…';
        feedback.hidden = false;
        nextBtn.hidden = false;
        nextBtn.textContent = index >= questions.length - 1 ? 'けっかをみる' : 'つぎへ';
      });
      choices.appendChild(btn);
    }
  };

  nextBtn.addEventListener('click', () => {
    if (index >= questions.length - 1) {
      setBest(correctCount);
      window.location.hash = `#/ranking/result?score=${correctCount}&total=${questions.length}`;
    } else {
      index++;
      showQuestion(questions[index]);
    }
  });

  showQuestion(questions[0]);
}

export function renderRankingResult(root: HTMLElement, score: number, total: number): void {
  const screen = el('div', 'screen ranking-screen');
  const back = el('a', 'btn-ghost', '← ランキング');
  back.href = '#/ranking';
  const title = el('h1', 'world-menu-title', 'けっか');
  const scoreEl = el('p', 'result-score', `せいかい ${score} / ${total}`);
  const best = el('p', 'result-best', `さいこう記録 ${getBest()} もん`);
  const again = el('a', 'btn-primary', 'もういちど');
  again.href = '#/ranking/quiz';
  const home = el('a', 'btn-secondary', 'ホームへ');
  home.href = '#/';
  screen.append(back, title, scoreEl, best, again, home);
  root.replaceChildren(screen);
}

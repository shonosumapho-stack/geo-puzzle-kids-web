import type { QuestionResult } from './types';

export const WRONG_PENALTY_PANELS = 3;
export const WRONG_SCORE_PENALTY = 150;

export function comboMultiplier(combo: number): number {
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  if (combo >= 2) return 1.25;
  return 1;
}

export function questionScore(effectivePanels: number, combo: number): number {
  const base = Math.max(120, 1200 - effectivePanels * 65);
  return Math.round(base * comboMultiplier(combo));
}

export function totalScore(results: QuestionResult[], wrongAttempts: number): number {
  const sum = results.reduce((a, r) => a + r.questionScore, 0);
  return Math.max(0, sum - wrongAttempts * WRONG_SCORE_PENALTY);
}

export function averagePanels(results: QuestionResult[]): number {
  if (!results.length) return 0;
  const sum = results.reduce((a, r) => a + r.panelsOpened + r.penaltyPanels, 0);
  return sum / results.length;
}

export function gameRank(total: number, avgPanels: number): { title: string; emoji: string; message: string } {
  if (total >= 8000 && avgPanels <= 3.5) {
    return { title: '世界の国マスター', emoji: '🌍', message: 'すごい！地球の博士だね！' };
  }
  if (total >= 6500 && avgPanels <= 5) {
    return { title: '地球博士', emoji: '🛰️', message: 'とても上手！あと少しでマスター！' };
  }
  if (total >= 4500) {
    return { title: '大陸クルーズ', emoji: '✈️', message: 'いろいろな国を旅できたね！' };
  }
  if (total >= 2500) {
    return { title: '旅のスカウト', emoji: '🧭', message: 'もう一回チャレンジしてみよう！' };
  }
  return { title: '見習い探検家', emoji: '🎒', message: 'ヒントを少しずつ開いてみよう！' };
}

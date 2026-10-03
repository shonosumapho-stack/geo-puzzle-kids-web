import type { GameDifficulty, QuestionResult } from './types';

const KEY = 'geo-world-active-game';

export interface ActiveWorldGame {
  difficulty: GameDifficulty;
  countryIds: string[];
  questionIndex: number;
  combo: number;
  wrongAttempts: number;
  results: QuestionResult[];
}

export function saveActiveGame(state: ActiveWorldGame): void {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function loadActiveGame(): ActiveWorldGame | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveWorldGame;
  } catch {
    return null;
  }
}

export function clearActiveGame(): void {
  sessionStorage.removeItem(KEY);
}

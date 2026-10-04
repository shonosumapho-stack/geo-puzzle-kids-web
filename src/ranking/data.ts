import type { RankCategory, RankData, RankingQuizQuestion } from './types';

let cache: RankData | null = null;

export async function loadRankData(): Promise<RankData> {
  if (cache) return cache;
  const res = await fetch('/assets/japan/prefecture_ranks.json');
  if (!res.ok) throw new Error('Failed to load prefecture_ranks.json');
  cache = (await res.json()) as RankData;
  return cache;
}

export function getCategory(data: RankData, id: string): RankCategory | undefined {
  return data.categories.find((c) => c.id === id);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 4択・10問。「○位はどれ？」形式 */
export function makeRankingQuiz(data: RankData, count = 10): RankingQuizQuestion[] {
  const cats = shuffle(data.categories).slice(0, Math.min(count, data.categories.length));
  return cats.map((cat) => {
    const ranking = cat.ranking;
    const targetRank = ranking.length >= 4 ? (Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3)) : 0;
    const correct = ranking[targetRank];
    const others = ranking.filter((_, i) => i !== targetRank);
    const wrong = shuffle(others).slice(0, 3);
    const choices = shuffle([correct, ...wrong]);
    const rankLabel = targetRank + 1;
    return {
      categoryId: cat.id,
      categoryNameRuby: cat.nameRuby,
      promptRuby: `${cat.nameRuby}で ${rankLabel}位の都道府県{とどうふけん}は？`,
      correctCode: correct.code,
      choices,
    };
  });
}

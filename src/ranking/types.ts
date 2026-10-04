export interface RankEntry {
  code: string;
  name: string;
  nameRuby: string;
  value?: number;
  valueLabel?: string;
}

export interface RankCategory {
  id: string;
  nameRuby: string;
  unitLabel: string;
  noteRuby: string;
  hasValues: boolean;
  source?: string;
  sourceYear?: string;
  sourceUrl?: string;
  ranking: RankEntry[];
}

export interface RankData {
  version: number;
  sourceNote: string;
  categories: RankCategory[];
}

export interface RankingQuizQuestion {
  categoryId: string;
  categoryNameRuby: string;
  promptRuby: string;
  correctCode: string;
  choices: RankEntry[];
}

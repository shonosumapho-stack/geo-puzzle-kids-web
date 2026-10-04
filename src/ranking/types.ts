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
  /** 学習用の単位表示（例: t（トン）, mm（ミリ）） */
  unitLabel: string;
  noteRuby: string;
  /** true のときだけ信頼できる数値を表示 */
  hasValues: boolean;
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

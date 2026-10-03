export type GameDifficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: 'かんたん',
  medium: 'ふつう',
  hard: 'むずかしい',
};

export interface FlagQuarters {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

export interface Country {
  id: string;
  difficulties: GameDifficulty[];
  name: string;
  nameRuby: string;
  region: string;
  regionRuby: string;
  capital: string;
  capitalRuby: string;
  population: number;
  areaKm2: number;
  foods: string[];
  foodsRuby: string[];
  landmarks: string[];
  landmarksRuby: string[];
  worldHeritage: string[];
  worldHeritageRuby: string[];
  animals: string[];
  animalsRuby: string[];
  climate: string;
  climateRuby: string;
  resources: string;
  resourcesRuby: string;
  trivia: string;
  triviaRuby: string;
  neighbors: string[];
  flagQuarters: FlagQuarters;
  mapLat: number;
  mapLon: number;
  silhouette: string;
  silhouetteRuby: string;
}

export type HintType =
  | 'region'
  | 'population'
  | 'area'
  | 'capital'
  | 'food'
  | 'world_heritage'
  | 'landmark'
  | 'animal'
  | 'flag_tl'
  | 'flag_tr'
  | 'flag_bl'
  | 'flag_br'
  | 'silhouette'
  | 'climate'
  | 'neighbor'
  | 'specialty';

export interface HintPanel {
  index: number;
  type: HintType;
  titleRuby: string;
  bodyRuby: string;
  flagQuarter?: string;
  flagCountryId?: string;
  silhouettePath?: string;
  isRevealed: boolean;
}

export interface QuestionResult {
  countryId: string;
  panelsOpened: number;
  penaltyPanels: number;
  questionScore: number;
}

export interface EncyclopediaTopic {
  id: string;
  category: string;
  name: string;
  nameRuby: string;
  summaryRuby: string;
  detailRuby: string;
  photoAsset: string;
  hasPhoto: boolean;
}

export interface EncyclopediaEntry {
  countryId: string;
  countryMapPhoto: string;
  worldMapPhoto: string;
  flagPhoto: string;
  introDetailRuby: string;
  topics: EncyclopediaTopic[];
}

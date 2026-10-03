export interface EncyclopediaTopic {
  name: string;
  summary: string;
  detail: string;
  photo?: string;
  photoQuery?: string;
}

export interface EncyclopediaEntry {
  code: string;
  name: string;
  capital?: string;
  areaKm2?: number;
  population?: number;
  mapPhoto?: string;
  foods?: EncyclopediaTopic[];
  places?: EncyclopediaTopic[];
  trivia?: EncyclopediaTopic;
}

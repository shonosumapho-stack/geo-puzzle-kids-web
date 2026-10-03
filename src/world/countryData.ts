import type { Country, EncyclopediaEntry, GameDifficulty } from './types';

export interface WorldData {
  countries: Country[];
  japanPopulation: number;
  japanAreaKm2: number;
  silhouettes: Record<string, string>;
  encyclopedia: Record<string, EncyclopediaEntry>;
  photoCredits: Record<string, string>;
}

let cache: WorldData | null = null;

function parseCountry(o: Record<string, unknown>): Country {
  const fq = o.flagQuarters as Record<string, string>;
  const diffs = (o.difficulties as string[]).filter((d): d is GameDifficulty =>
    d === 'easy' || d === 'medium' || d === 'hard',
  );
  const strList = (key: string, rubyKey: string) => {
    const base = o[key] as string[];
    const ruby = (o[rubyKey] as string[] | undefined) ?? base;
    return { base, ruby };
  };
  const foods = strList('foods', 'foodsRuby');
  const landmarks = strList('landmarks', 'landmarksRuby');
  const wh = strList('worldHeritage', 'worldHeritageRuby');
  const animals = strList('animals', 'animalsRuby');
  const id = o.id as string;
  return {
    id,
    difficulties: diffs,
    name: o.name as string,
    nameRuby: (o.nameRuby as string) ?? (o.name as string),
    region: o.region as string,
    regionRuby: (o.regionRuby as string) ?? (o.region as string),
    capital: o.capital as string,
    capitalRuby: (o.capitalRuby as string) ?? (o.capital as string),
    population: o.population as number,
    areaKm2: o.areaKm2 as number,
    foods: foods.base,
    foodsRuby: foods.ruby,
    landmarks: landmarks.base,
    landmarksRuby: landmarks.ruby,
    worldHeritage: wh.base,
    worldHeritageRuby: wh.ruby,
    animals: animals.base,
    animalsRuby: animals.ruby,
    climate: o.climate as string,
    climateRuby: (o.climateRuby as string) ?? (o.climate as string),
    resources: (o.resources as string) ?? (o.specialty as string) ?? '',
    resourcesRuby: (o.resourcesRuby as string) ?? (o.specialtyRuby as string) ?? '',
    trivia: o.trivia as string,
    triviaRuby: (o.triviaRuby as string) ?? (o.trivia as string),
    neighbors: o.neighbors as string[],
    flagQuarters: {
      topLeft: fq.topLeft,
      topRight: fq.topRight,
      bottomLeft: fq.bottomLeft,
      bottomRight: fq.bottomRight,
    },
    mapLat: o.mapLat as number,
    mapLon: o.mapLon as number,
    silhouette: o.silhouette as string,
    silhouetteRuby: (o.silhouetteRuby as string) ?? (o.silhouette as string),
  };
}

export async function loadWorldData(): Promise<WorldData> {
  if (cache) return cache;

  const [countriesRes, silRes, encRes, creditsRes] = await Promise.all([
    fetch('/assets/world/countries.json'),
    fetch('/assets/world/silhouettes.json'),
    fetch('/assets/world/encyclopedia.json'),
    fetch('/assets/world/photo_credits.json'),
  ]);

  const countriesRoot = await countriesRes.json();
  const silhouettes = (await silRes.json()) as Record<string, string>;
  const encRoot = await encRes.json();
  const creditsArr = await creditsRes.json();

  const countries = (countriesRoot.countries as Record<string, unknown>[]).map((c) =>
    parseCountry(c),
  );

  const encyclopedia: Record<string, EncyclopediaEntry> = {};
  const entries = encRoot.entries as Record<string, Record<string, unknown>>;
  for (const [countryId, o] of Object.entries(entries)) {
    const topics = (o.topics as Record<string, unknown>[]).map((t) => ({
      id: t.id as string,
      category: t.category as string,
      name: t.name as string,
      nameRuby: (t.nameRuby as string) ?? (t.name as string),
      summaryRuby: (t.summaryRuby as string) ?? (t.summary as string),
      detailRuby: (t.detailRuby as string) ?? (t.detail as string),
      photoAsset: (t.photo as string) ?? '',
      hasPhoto: (t.hasPhoto as boolean) ?? !!(t.photo as string),
    }));
    encyclopedia[countryId] = {
      countryId,
      countryMapPhoto: o.countryMapPhoto as string,
      worldMapPhoto: o.worldMapPhoto as string,
      flagPhoto: o.flagPhoto as string,
      introDetailRuby: (o.introDetailRuby as string) ?? (o.introDetail as string),
      topics,
    };
  }

  const photoCredits: Record<string, string> = {};
  for (const row of creditsArr as { asset: string; summary: string }[]) {
    photoCredits[row.asset] = row.summary;
  }

  cache = {
    countries,
    japanPopulation: countriesRoot.japan.population as number,
    japanAreaKm2: countriesRoot.japan.areaKm2 as number,
    silhouettes,
    encyclopedia,
    photoCredits,
  };
  return cache;
}

export function countriesForDifficulty(data: WorldData, difficulty: GameDifficulty): Country[] {
  return data.countries.filter((c) => c.difficulties.includes(difficulty));
}

export function randomQuizCountries(data: WorldData, difficulty: GameDifficulty, count = 5): Country[] {
  const pool = [...countriesForDifficulty(data, difficulty)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function findCountry(data: WorldData, id: string): Country | undefined {
  return data.countries.find((c) => c.id === id);
}

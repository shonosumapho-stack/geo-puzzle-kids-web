import type { EncyclopediaEntry } from './encyclopediaTypes';

let japanInfoCache: EncyclopediaEntry[] | null = null;
let kanaInfoCache: EncyclopediaEntry[] | null = null;

async function load(url: string): Promise<EncyclopediaEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return (await res.json()) as EncyclopediaEntry[];
}

export async function loadJapanEncyclopedia(): Promise<EncyclopediaEntry[]> {
  if (!japanInfoCache) {
    japanInfoCache = await load('/assets/japan/prefecture_info.json');
  }
  return japanInfoCache;
}

export async function loadKanagawaEncyclopedia(): Promise<EncyclopediaEntry[]> {
  if (!kanaInfoCache) {
    kanaInfoCache = await load('/assets/kana/municipality_info.json');
  }
  return kanaInfoCache;
}

export function entryByCode(entries: EncyclopediaEntry[], code: string): EncyclopediaEntry | undefined {
  return entries.find((e) => e.code === code);
}

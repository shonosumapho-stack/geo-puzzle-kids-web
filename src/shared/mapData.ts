import type { MapPiece } from './types';

let prefecturesCache: MapPiece[] | null = null;
let municipalitiesCache: MapPiece[] | null = null;
let wardsCache: MapPiece[] | null = null;

async function loadJson(url: string): Promise<MapPiece[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return (await res.json()) as MapPiece[];
}

export async function loadPrefectures(): Promise<MapPiece[]> {
  if (!prefecturesCache) {
    prefecturesCache = await loadJson('/assets/japan/prefectures.json');
  }
  return prefecturesCache;
}

export async function loadMunicipalities(): Promise<MapPiece[]> {
  if (!municipalitiesCache) {
    municipalitiesCache = await loadJson('/assets/kana/municipalities.json');
  }
  return municipalitiesCache;
}

export async function loadWards(): Promise<MapPiece[]> {
  if (!wardsCache) {
    wardsCache = await loadJson('/assets/kana/wards.json');
  }
  return wardsCache;
}

export function piecesForCodes(all: MapPiece[], codes: string[]): MapPiece[] {
  const byCode = new Map(all.map((p) => [p.code, p]));
  return codes.map((c) => byCode.get(c)).filter((p): p is MapPiece => p != null);
}

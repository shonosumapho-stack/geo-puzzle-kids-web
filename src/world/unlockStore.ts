const KEY = 'geo-world-unlocked';

export function getUnlockedCountryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function unlockCountry(id: string): void {
  const set = getUnlockedCountryIds();
  set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

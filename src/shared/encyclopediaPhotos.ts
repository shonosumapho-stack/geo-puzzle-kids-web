import { el } from './dom';

export type PhotoPack = 'japan' | 'kana';

interface PhotoCreditRow {
  asset: string;
  summary?: string;
}

const creditCache: Partial<Record<PhotoPack, Map<string, string>>> = {};
const wikiCache = new Map<string, { url: string; credit: string } | null>();

export function localPhotoUrl(pack: PhotoPack, assetPath: string): string {
  return `/assets/${pack}/${assetPath}.jpg`;
}

async function loadCredits(pack: PhotoPack): Promise<Map<string, string>> {
  if (creditCache[pack]) return creditCache[pack]!;
  const map = new Map<string, string>();
  try {
    const res = await fetch(`/assets/${pack}/photo_credits.json`);
    if (res.ok) {
      const rows = (await res.json()) as PhotoCreditRow[];
      for (const row of rows) {
        if (row.asset && row.summary) map.set(row.asset, row.summary);
      }
    }
  } catch {
    /* optional */
  }
  creditCache[pack] = map;
  return map;
}

export async function fetchWikimediaPhoto(
  query: string,
): Promise<{ url: string; credit: string } | null> {
  const key = query.trim();
  if (!key) return null;
  if (wikiCache.has(key)) return wikiCache.get(key)!;

  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: key,
      gsrnamespace: '6',
      gsrlimit: '1',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '640',
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; url?: string; extmetadata?: Record<string, { value?: string }> }[] }> };
    };
    const pages = data.query?.pages;
    if (!pages) {
      wikiCache.set(key, null);
      return null;
    }
    const page = Object.values(pages)[0];
    const info = page?.imageinfo?.[0];
    const url = info?.thumburl ?? info?.url;
    if (!url || !info) {
      wikiCache.set(key, null);
      return null;
    }
    const meta = info.extmetadata;
    const artist = meta?.Artist?.value?.replace(/<[^>]+>/g, '').trim() ?? '';
    const license = meta?.LicenseShortName?.value ?? 'CC';
    const credit = artist
      ? `${artist} / ${license}（Wikimedia Commons）`
      : `Wikimedia Commons（${license}）`;
    const out = { url, credit };
    wikiCache.set(key, out);
    return out;
  } catch {
    wikiCache.set(key, null);
    return null;
  }
}

export function attachEncyPhoto(
  parent: HTMLElement,
  pack: PhotoPack,
  opts: { photo?: string; photoQuery?: string },
): void {
  if (!opts.photo && !opts.photoQuery) return;

  const wrap = el('figure', 'ency-photo');
  const img = document.createElement('img');
  img.className = 'ency-photo-img';
  img.alt = '';
  img.loading = 'lazy';
  const cap = el('figcaption', 'ency-photo-credit', '');
  wrap.append(img, cap);
  parent.appendChild(wrap);

  const useWiki = async () => {
    if (!opts.photoQuery) {
      wrap.remove();
      return;
    }
    cap.textContent = '写真を読み込み中…';
    const w = await fetchWikimediaPhoto(opts.photoQuery);
    if (!w) {
      wrap.remove();
      return;
    }
    img.src = w.url;
    cap.textContent = w.credit;
  };

  if (opts.photo) {
    void loadCredits(pack).then((credits) => {
      const localCredit = credits.get(opts.photo!);
      if (localCredit) cap.textContent = localCredit;
    });
    img.src = localPhotoUrl(pack, opts.photo);
    img.addEventListener(
      'error',
      () => {
        void useWiki();
      },
      { once: true },
    );
  } else {
    void useWiki();
  }
}

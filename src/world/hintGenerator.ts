import { formatMan, formatRatio } from './format';
import type { WorldData } from './countryData';
import { findCountry } from './countryData';
import type { Country, HintPanel, HintType } from './types';

const PANEL_TYPES: HintType[] = [
  'region',
  'population',
  'area',
  'capital',
  'food',
  'world_heritage',
  'landmark',
  'animal',
  'flag_tl',
  'flag_tr',
  'flag_bl',
  'flag_br',
  'silhouette',
  'climate',
  'neighbor',
  'specialty',
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function includesType(type: HintType, country: Country, data: WorldData): boolean {
  switch (type) {
    case 'food':
      return country.foods.length > 0;
    case 'landmark':
      return country.landmarks.length > 0;
    case 'animal':
      return country.animals.length > 0;
    case 'world_heritage':
      return country.worldHeritage.length > 0;
    case 'specialty':
      return country.resources.trim().length > 0;
    case 'silhouette':
      return !!data.silhouettes[country.id];
    default:
      return true;
  }
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function panel(
  index: number,
  type: HintType,
  titleRuby: string,
  bodyRuby: string,
  extra: Partial<HintPanel> = {},
): HintPanel {
  return { index, type, titleRuby, bodyRuby, isRevealed: false, ...extra };
}

export function buildPanels(country: Country, data: WorldData): HintPanel[] {
  const types = shuffle(PANEL_TYPES.filter((t) => includesType(t, country, data)));
  const jpPop = data.japanPopulation;
  const jpArea = data.japanAreaKm2;

  return types.map((type, index) => {
    switch (type) {
      case 'region':
        return panel(index, type, '地域{ちいき}', country.regionRuby);
      case 'population':
        return panel(
          index,
          type,
          '人口{じんこう}',
          `約{やく}${formatMan(country.population)}万人{にん}（日本{にほん}の約{やく}${formatRatio(country.population, jpPop)}倍{ばい}）`,
        );
      case 'area':
        return panel(
          index,
          type,
          '面積{めんせき}',
          `約{やく}${formatMan(country.areaKm2)}万km²（日本{にほん}の約{やく}${formatRatio(country.areaKm2, jpArea)}倍{ばい}）`,
        );
      case 'capital':
        return panel(index, type, '首都{しゅと}', country.capitalRuby);
      case 'food':
        return panel(index, type, '食{た}べ物{もの}', pickRandom(country.foodsRuby) ?? '—');
      case 'world_heritage':
        return panel(index, type, '世界遺産{せかいいさん}', pickRandom(country.worldHeritageRuby) ?? '—');
      case 'landmark':
        return panel(index, type, '有名{ゆうめい}な場所{ばしょ}', pickRandom(country.landmarksRuby) ?? '—');
      case 'animal':
        return panel(
          index,
          type,
          '動物{どうぶつ}',
          pickRandom(country.animalsRuby) ??
            '特{とく}に有名{ゆうめい}な動物{どうぶつ}はあまり知{し}られていません',
        );
      case 'flag_tl':
        return panel(index, type, '国旗{こっき}の一部{いちぶ}', 'この色{いろ}が入{はい}っています', {
          flagQuarter: country.flagQuarters.topLeft,
          flagCountryId: country.id,
        });
      case 'flag_tr':
        return panel(index, type, '国旗{こっき}の一部{いちぶ}', 'この色{いろ}が入{はい}っています', {
          flagQuarter: country.flagQuarters.topRight,
          flagCountryId: country.id,
        });
      case 'flag_bl':
        return panel(index, type, '国旗{こっき}の一部{いちぶ}', 'この色{いろ}が入{はい}っています', {
          flagQuarter: country.flagQuarters.bottomLeft,
          flagCountryId: country.id,
        });
      case 'flag_br':
        return panel(index, type, '国旗{こっき}の一部{いちぶ}', 'この色{いろ}が入{はい}っています', {
          flagQuarter: country.flagQuarters.bottomRight,
          flagCountryId: country.id,
        });
      case 'silhouette':
        return panel(index, type, '国{くに}の形{かたち}', country.silhouetteRuby, {
          silhouettePath: data.silhouettes[country.id],
        });
      case 'climate':
        return panel(index, type, '気候{きこう}', country.climateRuby);
      case 'neighbor': {
        const nid = pickRandom(country.neighbors);
        const neighbor = nid ? findCountry(data, nid) : undefined;
        return panel(index, type, 'となりの国{くに}', neighbor?.nameRuby ?? '島国{とうこく}です');
      }
      case 'specialty':
        return panel(
          index,
          type,
          '特産{とくさん}・資源{しげん}',
          country.resourcesRuby || '—',
        );
      default:
        return panel(index, type, '', '');
    }
  });
}

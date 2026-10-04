/**
 * Builds public/assets/japan/prefecture_ranks.json from:
 * - prefecture_info.json (人口・面積) + 公式出典メタ
 * - scripts/rank-sources/official-stats.json (作物＋気象・観光・経済など)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const info = JSON.parse(
  fs.readFileSync(path.join(root, 'public/assets/japan/prefecture_info.json'), 'utf8'),
);
const official = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'rank-sources/official-stats.json'), 'utf8'),
);

const byCode = Object.fromEntries(info.map((p) => [p.code, p]));

function entry(code, value, valueLabel) {
  const p = byCode[code];
  if (!p) throw new Error(`Unknown prefecture ${code}`);
  return {
    code,
    name: p.name,
    nameRuby: p.nameRuby,
    value,
    valueLabel,
  };
}

function rankFromMap(valueByCode, labelFn) {
  const rows = Object.entries(valueByCode)
    .map(([code, value]) => ({ code, value: Number(value) }))
    .filter((r) => Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.value - a.value);
  return rows.map((r) => entry(r.code, r.value, labelFn(r.value)));
}

function jaNum(v, digits) {
  if (digits != null) {
    return Number(v).toLocaleString('ja-JP', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  if (Number.isInteger(v)) return Math.round(v).toLocaleString('ja-JP');
  return Number(v).toLocaleString('ja-JP');
}

function formatByKind(kind, v) {
  switch (kind) {
    case 'tons':
      return `${jaNum(Math.round(v))} t`;
    case 'mm':
      return `${jaNum(v, v % 1 === 0 ? 0 : 1)} mm`;
    case 'hours':
      return `${jaNum(Math.round(v))}時間`;
    case 'celsius':
      return `${jaNum(v, 1)}℃`;
    case 'percent':
      return `${jaNum(v, v % 1 === 0 ? 0 : 1)}％`;
    case 'ha':
      return `${jaNum(Math.round(v))} ha`;
    case 'mannin':
      return `${jaNum(v, v % 1 === 0 ? 0 : 1)}万人`;
    case 'okuen':
      return `${jaNum(v, v % 1 === 0 ? 0 : 1)}億円`;
    case 'choen':
      return `${jaNum(v, 2)}兆円`;
    case 'dai':
      return `${jaNum(Math.round(v))}台`;
    case 'rate':
      return jaNum(v, 2);
    case 'yen':
      return `${jaNum(Math.round(v))}円`;
    case 'manen':
      return `${jaNum(Math.round(v))}万円`;
    case 'hon':
      return `${jaNum(Math.round(v))}本`;
    case 'hyakumannin':
      return `${jaNum(v, v % 1 === 0 ? 0 : 1)}百万人`;
    case 'age':
      return `${jaNum(v, 2)}歳`;
    case 'ken':
      return `${jaNum(Math.round(v))}件`;
    default:
      return jaNum(v);
  }
}

const popByCode = Object.fromEntries(info.map((p) => [p.code, p.population]));
const areaByCode = Object.fromEntries(info.map((p) => [p.code, p.areaKm2]));
const densityByCode = Object.fromEntries(
  info.map((p) => [p.code, p.population / p.areaKm2]),
);

const baseCategories = [
  {
    id: 'population',
    nameRuby: '人口{じんこう}',
    unitLabel: '人',
    noteRuby: '住{す}んでいる人{ひと}の多{おお}さ',
    hasValues: true,
    source: '総務省統計局「人口推計」',
    sourceYear: '令和5年（2023年）10月1日現在',
    sourceUrl: 'https://www.stat.go.jp/data/jinsui/2023np/',
    ranking: rankFromMap(popByCode, (v) => `約${Math.round(v / 10000).toLocaleString('ja-JP')}万人`),
  },
  {
    id: 'area',
    nameRuby: '面積{めんせき}',
    unitLabel: 'km²',
    noteRuby: '都道府県{とどうふけん}の広{ひろ}さ',
    hasValues: true,
    source: '国土地理院「全国都道府県市区町村別面積調」',
    sourceYear: '令和5年（2023年）10月1日時点',
    sourceUrl: 'https://www.gsi.go.jp/KOKUJYOHO/MENCHO/backnumber/GSI-menseki20231001_gaiyo.pdf',
    ranking: rankFromMap(areaByCode, (v) => `約${v.toLocaleString('ja-JP')} km²`),
  },
  {
    id: 'density',
    nameRuby: '人口密度{じんこうみつど}',
    unitLabel: '人/km²',
    noteRuby: '1km²あたりの人{ひと}の多{おお}さ（人口{じんこう}÷面積{めんせき}）',
    hasValues: true,
    source: '総務省「人口推計」÷国土地理院「面積調」から算出',
    sourceYear: '令和5年（2023年）',
    sourceUrl: 'https://www.stat.go.jp/data/jinsui/2023np/',
    ranking: rankFromMap(densityByCode, (v) => `約${Math.round(v).toLocaleString('ja-JP')}人/km²`),
  },
];

const officialCategories = official.categories.map((c) => ({
  id: c.id,
  nameRuby: c.nameRuby,
  unitLabel: c.unitLabel,
  noteRuby: c.noteRuby,
  hasValues: true,
  source: c.source,
  sourceYear: c.sourceYear,
  sourceUrl: c.sourceUrl,
  ranking: rankFromMap(c.values, (v) => formatByKind(c.valueKind || 'tons', v)),
}));

const categories = [...baseCategories, ...officialCategories];

if (categories.length < 45) {
  console.error(`Too few categories: ${categories.length}`);
  process.exit(1);
}

const out = {
  version: 4,
  sourceNote:
    '数値は公式統計に基づきます。人口は総務省、面積は国土地理院、作物は農林水産省「作物統計」、気象・観光・経済などは各省庁の公表統計を参照しています。',
  categories,
};

const outPath = path.join(root, 'public/assets/japan/prefecture_ranks.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${categories.length} categories → ${outPath}`);

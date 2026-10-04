/**
 * region-case.com の都道府県ランキングを取得し、
 * scripts/rank-sources/official-stats.json に保存する。
 * 作物（農林水産省「作物統計」）＋気象・観光・経済などの非生産量項目。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'rank-sources');

const PREF_NAMES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

const CODE_BY_NAME = Object.fromEntries(
  PREF_NAMES.map((name, i) => [name, String(i + 1).padStart(2, '0')]),
);

/** 残す作物 32件 */
const CROP_DEFS = [
  { id: 'rice', slug: 'rice', nameRuby: '米{こめ}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '水稲{すいとう}の収穫量{しゅうかくりょう}' },
  { id: 'wheat', slug: 'wheat', nameRuby: '小麦{こむぎ}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '小麦{こむぎ}の収穫量{しゅうかくりょう}' },
  { id: 'soy', slug: 'soy', nameRuby: '大豆{だいず}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '大豆{だいず}の収穫量{しゅうかくりょう}' },
  { id: 'soba', slug: 'soba', nameRuby: 'そばの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'そばの収穫量{しゅうかくりょう}' },
  { id: 'mikan', slug: 'orange', nameRuby: 'みかんの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '温州{うんしゅう}みかんなどの収穫量{しゅうかくりょう}' },
  { id: 'apple', slug: 'apple', nameRuby: 'りんごの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'りんごの収穫量{しゅうかくりょう}' },
  { id: 'grape', slug: 'grape', nameRuby: 'ぶどうの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ぶどうの収穫量{しゅうかくりょう}' },
  { id: 'peach', slug: 'peach', nameRuby: 'ももの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ももの収穫量{しゅうかくりょう}' },
  { id: 'cherry', slug: 'cherry', nameRuby: 'さくらんぼの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'おうとうの収穫量{しゅうかくりょう}' },
  { id: 'pear', slug: 'japanese-pear', nameRuby: 'なしの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '日本{にほん}なしの収穫量{しゅうかくりょう}' },
  { id: 'strawberry', slug: 'strawberry', nameRuby: 'いちごの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'いちごの収穫量{しゅうかくりょう}' },
  { id: 'melon', slug: 'melon', nameRuby: 'メロンの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'メロンの収穫量{しゅうかくりょう}' },
  { id: 'watermelon', slug: 'water-melon', nameRuby: 'すいかの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'すいかの収穫量{しゅうかくりょう}' },
  { id: 'ume', slug: 'ume', nameRuby: '梅{うめ}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '梅{うめ}の収穫量{しゅうかくりょう}' },
  { id: 'persimmon', slug: 'persimmon', nameRuby: '柿{かき}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '柿{かき}の収穫量{しゅうかくりょう}' },
  { id: 'potato', slug: 'potato', nameRuby: 'じゃがいも生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'じゃがいもの収穫量{しゅうかくりょう}' },
  { id: 'sweet_potato', slug: 'sweet-potato', nameRuby: 'さつまいも生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'さつまいもの収穫量{しゅうかくりょう}' },
  { id: 'onion', slug: 'onion', nameRuby: 'たまねぎ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'たまねぎの収穫量{しゅうかくりょう}' },
  { id: 'carrot', slug: 'carrot', nameRuby: 'にんじん生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'にんじんの収穫量{しゅうかくりょう}' },
  { id: 'daikon', slug: 'japanese-radish', nameRuby: '大根{だいこん}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '大根{だいこん}の収穫量{しゅうかくりょう}' },
  { id: 'cabbage', slug: 'cabbage', nameRuby: 'キャベツ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'キャベツの収穫量{しゅうかくりょう}' },
  { id: 'chinese_cabbage', slug: 'chinese-cabbage', nameRuby: 'はくさい生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'はくさいの収穫量{しゅうかくりょう}' },
  { id: 'lettuce', slug: 'lettuce', nameRuby: 'レタス生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'レタスの収穫量{しゅうかくりょう}' },
  { id: 'spinach', slug: 'spinach', nameRuby: 'ほうれんそう生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ほうれんそうの収穫量{しゅうかくりょう}' },
  { id: 'tomato', slug: 'tomato', nameRuby: 'トマト生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'トマトの収穫量{しゅうかくりょう}' },
  { id: 'cucumber', slug: 'cucumber', nameRuby: 'きゅうり生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'きゅうりの収穫量{しゅうかくりょう}' },
  { id: 'eggplant', slug: 'eggplant', nameRuby: 'なす生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'なすの収穫量{しゅうかくりょう}' },
  { id: 'pumpkin', slug: 'pumpkin', nameRuby: 'かぼちゃ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'かぼちゃの収穫量{しゅうかくりょう}' },
  { id: 'corn', slug: 'corn', nameRuby: 'とうもろこし生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'とうもろこしの収穫量{しゅうかくりょう}' },
  { id: 'welsh_onion', slug: 'welsh-onion', nameRuby: 'ねぎ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ねぎの収穫量{しゅうかくりょう}' },
  { id: 'tea', slug: 'tea-leaves', nameRuby: '茶葉{ちゃば}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '茶{ちゃ}の生葉{なまば}収穫量{しゅうかくりょう}' },
  { id: 'sugarcane', slug: 'sugarcane', nameRuby: 'さとうきび生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'さとうきびの収穫量{しゅうかくりょう}' },
];

/**
 * 非生産量 15件（ページが無い計画項目は同カテゴリの代替）
 * path: region-case.com のパス（末尾スラッシュなし）
 */
const OTHER_DEFS = [
  {
    id: 'precipitation',
    path: 'rank-r5-weather-precipitation',
    nameRuby: '降水量{こうすいりょう}（年間{ねんかん}）',
    unitLabel: 'mm（ミリ）',
    noteRuby: '県庁所在地{けんちょうしょざいち}などの気象官署{きしょうかんしょ}の年間降水量{ねんかんこうすいりょう}',
    source: '総務省「社会生活統計指標」（気象庁）',
    requireAny: ['総務省', '気象庁'],
    valueKind: 'mm',
  },
  {
    id: 'sunshine',
    path: 'rank-r5-weather-sunshine',
    nameRuby: '日照時間{にっしょうじかん}（年間{ねんかん}）',
    unitLabel: '時間',
    noteRuby: '県庁所在地{けんちょうしょざいち}などの気象官署{きしょうかんしょ}の年間日照時間{ねんかんにっしょうじかん}',
    source: '総務省「社会生活統計指標」（気象庁）',
    requireAny: ['総務省', '気象庁'],
    valueKind: 'hours',
  },
  {
    id: 'temperature',
    path: 'rank-2023-weather-temperature',
    nameRuby: '年平均気温{ねんへいきんきおん}',
    unitLabel: '℃',
    noteRuby: '県庁所在地{けんちょうしょざいち}などの気象官署{きしょうかんしょ}の年平均気温{ねんへいきんきおん}',
    source: '総務省「社会生活統計指標」（気象庁）',
    requireAny: ['総務省', '気象庁'],
    valueKind: 'celsius',
  },
  {
    id: 'humidity',
    path: 'rank-r5-weather-humidity',
    nameRuby: '平均湿度{へいきんしつど}',
    unitLabel: '％',
    noteRuby: '県庁所在地{けんちょうしょざいち}などの気象官署{きしょうかんしょ}の平均湿度{へいきんしつど}',
    source: '総務省「社会生活統計指標」（気象庁）',
    requireAny: ['総務省', '気象庁'],
    valueKind: 'percent',
  },
  {
    id: 'forest_area',
    path: 'rank-r4-forest-rate',
    nameRuby: '森林面積{しんりんめんせき}',
    unitLabel: 'ha（ヘクタール）',
    noteRuby: '都道府県{とどうふけん}の森林{しんりん}の広{ひろ}さ',
    source: '林野庁「森林資源の現況」',
    requireAny: ['林野庁'],
    valueKind: 'ha',
  },
  {
    id: 'tourists',
    path: 'rank-r4-travel-guests',
    nameRuby: '宿泊者数{しゅくはくしゃすう}',
    unitLabel: '万人',
    noteRuby: 'ホテルや旅館{りょかん}などに泊{と}まった人{ひと}の数{かず}',
    source: '観光庁「宿泊旅行統計調査」',
    requireAny: ['観光庁'],
    valueKind: 'mannin',
  },
  {
    id: 'foreign_tourists',
    path: 'rank-2022-travel-foreign-guests',
    nameRuby: '外国人{がいこくじん}宿泊者数{しゅくはくしゃすう}',
    unitLabel: '万人',
    noteRuby: '外国{がいこく}から来{き}て泊{と}まった人{ひと}の数{かず}',
    source: '観光庁「宿泊旅行統計調査」',
    requireAny: ['観光庁'],
    valueKind: 'mannin',
  },
  {
    id: 'ag_output',
    path: 'rank-2023-agriculture-production',
    nameRuby: '農業産出額{のうぎょうさんしゅつがく}',
    unitLabel: '億円',
    noteRuby: '農業{のうぎょう}でうみだしたお金{おかね}の合計{ごうけい}',
    source: '農林水産省「生産農業所得統計」',
    requireAny: ['農林水産省', '生産農業所得統計'],
    valueKind: 'okuen',
  },
  {
    id: 'forestry_output',
    path: 'rank-2023-forestry-production',
    nameRuby: '林業産出額{りんぎょうさんしゅつがく}',
    unitLabel: '億円',
    noteRuby: '林業{りんぎょう}でうみだしたお金{おかね}の合計{ごうけい}',
    source: '農林水産省「生産林業所得統計」',
    requireAny: ['農林水産省'],
    valueKind: 'okuen',
  },
  {
    id: 'gdp',
    path: 'rank-2021-gdp-nominal-gdp',
    nameRuby: '県内総生産{けんないそうせいさん}（名目{めいもく}）',
    unitLabel: '兆円',
    noteRuby: 'その都道府県{とどうふけん}でうみだしたお金{おかね}の合計{ごうけい}',
    source: '内閣府「県民経済計算」',
    requireAny: ['内閣府', '県民経済計算'],
    valueKind: 'choen',
  },
  {
    id: 'cars',
    path: 'rank-2023-own-car',
    nameRuby: '自動車保有台数{じどうしゃほゆうだいすう}',
    unitLabel: '台',
    noteRuby: '乗用車{じょうようしゃ}などの自動車{じどうしゃ}の台数{だいすう}',
    source: '自動車検査登録情報協会／総務省',
    requireAny: ['自動車検査登録情報協会', '総務省'],
    valueKind: 'dai',
  },
  {
    id: 'birthrate',
    path: 'rank-2023-pop-birthrate',
    nameRuby: '合計特殊出生率{ごうけいとくしゅしゅっしょうりつ}',
    unitLabel: '',
    noteRuby: '一人{ひとり}の女性{じょせい}が生{う}む子{こ}どもの数{かず}の目安{めやす}',
    source: '厚生労働省「人口動態統計」',
    requireAny: ['厚生労働省'],
    valueKind: 'rate',
  },
  {
    id: 'minimum_wage',
    path: 'rank-2024-minimum-wage',
    nameRuby: '最低賃金{さいていちんぎん}',
    unitLabel: '円',
    noteRuby: '都道府県{とどうふけん}ごとの時給{じきゅう}の最低額{さいていがく}',
    source: '厚生労働省「地域別最低賃金」',
    requireAny: ['厚生労働省'],
    valueKind: 'yen',
  },
  {
    id: 'savings',
    path: 'rank-2023-savings',
    nameRuby: '貯蓄現在高{ちょちくげんざいだか}（二人以上世帯{ふたりいじょうせたい}）',
    unitLabel: '万円',
    noteRuby: '世帯{せたい}あたりの貯金{ちょきん}などの平均{へいきん}',
    source: '総務省「家計調査」',
    requireAny: ['総務省'],
    valueKind: 'manen',
  },
  {
    id: 'bridges',
    path: 'rank-2021-infra-bridge',
    nameRuby: '道路橋{どうろきょう}の数{かず}',
    unitLabel: '本',
    noteRuby: '道路{どうろ}にある橋{はし}の本数{ほんすう}',
    source: '国土交通省「道路統計年報」',
    requireAny: ['国土交通省', '道路統計'],
    valueKind: 'hon',
  },
];

const VALUE_CELL_RE =
  /^([0-9,]+(?:\.[0-9]+)?)\s*(㎜|mm|ミリ|時間|℃|%|％|ha|万人|億円|兆円|台|円|万円|本|t|頭|千羽|羽)?$/i;

function parseAmount(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function cellText(tdHtml) {
  return tdHtml
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTable(html) {
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((m) =>
      cellText(m[1]),
    );
    if (!cells.length) continue;
    const prefIdx = cells.findIndex((c) => CODE_BY_NAME[c]);
    if (prefIdx < 0) continue;
    const name = cells[prefIdx];
    let value = null;
    let unitHint = '';
    for (let i = prefIdx + 1; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell || cell === '-' || cell === '―') continue;
      const m = cell.match(VALUE_CELL_RE);
      if (!m) continue;
      value = parseAmount(m[1]);
      unitHint = m[2] || '';
      if (value != null) break;
    }
    if (value == null) continue;
    const code = CODE_BY_NAME[name];
    rows.push({ code, name, value, unitHint });
  }
  const seen = new Set();
  return rows.filter((r) => {
    if (seen.has(r.code)) return false;
    seen.add(r.code);
    return true;
  });
}

function normalizeReiwa(reiwaNum) {
  const map = {
    2: '令和2年（2020年）',
    3: '令和3年（2021年）',
    4: '令和4年（2022年）',
    5: '令和5年（2023年）',
    6: '令和6年（2024年）',
    7: '令和7年（2025年）',
  };
  return map[reiwaNum] || `令和${reiwaNum}年`;
}

function detectYear(html) {
  // ページタイトル／見出しの年を優先（ナビや関連リンクの別年を拾わない）
  const title = (html.match(/<title>([^<]+)/i) || [])[1] || '';
  const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(
    /<[^>]+>/g,
    '',
  );
  const headed = `${title} ${h1}`;
  const headedReiwa = headed.match(/令和\s*([0-9０-９]+)年/);
  if (headedReiwa) {
    const n = Number(headedReiwa[1].replace(/[０-９]/g, (d) => '０１２３４５６７８９'.indexOf(d)));
    if (Number.isFinite(n)) return normalizeReiwa(n);
  }
  const headedWestern = headed.match(/（?(20[0-9]{2})年/);
  if (headedWestern) return `${headedWestern[1]}年`;

  for (const [re, label] of [
    [/令和\s*6年|令和６年/, normalizeReiwa(6)],
    [/令和\s*5年|令和５年/, normalizeReiwa(5)],
    [/令和\s*4年|令和４年/, normalizeReiwa(4)],
    [/令和\s*3年|令和３年/, normalizeReiwa(3)],
    [/令和\s*2年|令和２年/, normalizeReiwa(2)],
  ]) {
    if (re.test(html)) return label;
  }
  const western = html.match(/（?(20[0-9]{2})年/);
  if (western) return `${western[1]}年`;
  return '年次不明';
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'geo-puzzle-kids-web-rank-builder/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchCrop(def) {
  const url = `https://region-case.com/rank-r5-product-${def.slug}/`;
  const html = await fetchHtml(url);
  if (!html.includes('農林水産省')) {
    throw new Error('missing MAFF attribution');
  }
  const rows = parseTable(html);
  // さとうきび等、産地がごく少ない品目もある
  if (rows.length < 2) throw new Error(`too few rows (${rows.length})`);
  rows.sort((a, b) => b.value - a.value);
  return {
    id: def.id,
    nameRuby: def.nameRuby,
    unitLabel: def.unitLabel,
    noteRuby: def.noteRuby,
    valueKind: 'tons',
    source: '農林水産省「作物統計」',
    sourceYear: detectYear(html),
    sourceUrl: url,
    values: Object.fromEntries(rows.map((r) => [r.code, r.value])),
  };
}

async function fetchOther(def) {
  const url = `https://region-case.com/${def.path}/`;
  const html = await fetchHtml(url);
  const ok = def.requireAny.some((k) => html.includes(k));
  if (!ok) throw new Error(`missing attribution (${def.requireAny.join('|')})`);
  const rows = parseTable(html);
  if (rows.length < 3) throw new Error(`too few rows (${rows.length})`);
  rows.sort((a, b) => b.value - a.value);
  return {
    id: def.id,
    nameRuby: def.nameRuby,
    unitLabel: def.unitLabel,
    noteRuby: def.noteRuby,
    valueKind: def.valueKind,
    source: def.source,
    sourceYear: detectYear(html),
    sourceUrl: url,
    values: Object.fromEntries(rows.map((r) => [r.code, r.value])),
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const categories = [];

  for (const def of CROP_DEFS) {
    process.stdout.write(`fetch crop ${def.id}... `);
    try {
      const cat = await fetchCrop(def);
      categories.push(cat);
      console.log(`OK (${Object.keys(cat.values).length})`);
    } catch (e) {
      console.log(`FAIL ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  for (const def of OTHER_DEFS) {
    process.stdout.write(`fetch other ${def.id}... `);
    try {
      const cat = await fetchOther(def);
      categories.push(cat);
      console.log(`OK (${Object.keys(cat.values).length})`);
    } catch (e) {
      console.log(`FAIL ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    note: 'Values scraped from region-case.com pages that attribute official Japanese statistics.',
    categories,
  };
  const outPath = path.join(outDir, 'official-stats.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${categories.length} categories → ${outPath}`);
  if (categories.length < 45) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

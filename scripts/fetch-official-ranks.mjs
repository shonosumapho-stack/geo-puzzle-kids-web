/**
 * region-case.com の令和5年ランキング（農林水産省「作物統計」等から作成）を取得し、
 * scripts/rank-sources/official-stats.json に保存する。
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

/** 50項目（うち人口・面積・密度は build 側で図鑑+公式出典） */
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
  { id: 'chestnut', slug: 'chestnut', nameRuby: '栗{くり}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '栗{くり}の収穫量{しゅうかくりょう}' },
  { id: 'kiwi', slug: 'kiwi-fruit', nameRuby: 'キウイフルーツの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'キウイの収穫量{しゅうかくりょう}' },
  { id: 'pineapple', slug: 'pineapple', nameRuby: 'パイナップルの生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'パイナップルの収穫量{しゅうかくりょう}' },
  { id: 'potato', slug: 'potato', nameRuby: 'じゃがいも生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'じゃがいもの収穫量{しゅうかくりょう}' },
  { id: 'sweet_potato', slug: 'sweet-potato', nameRuby: 'さつまいも生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'さつまいもの収穫量{しゅうかくりょう}' },
  { id: 'onion', slug: 'onion', nameRuby: 'たまねぎ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'たまねぎの収穫量{しゅうかくりょう}' },
  { id: 'carrot', slug: 'carrot', nameRuby: 'にんじん生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'にんじんの収穫量{しゅうかくりょう}' },
  { id: 'daikon', slug: 'japanese-radish', nameRuby: '大根{だいこん}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '大根{だいこん}の収穫量{しゅうかくりょう}' },
  { id: 'cabbage', slug: 'cabbage', nameRuby: 'キャベツ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'キャベツの収穫量{しゅうかくりょう}' },
  { id: 'chinese_cabbage', slug: 'chinese-cabbage', nameRuby: 'はくさい生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'はくさいの収穫量{しゅうかくりょう}' },
  { id: 'lettuce', slug: 'lettuce', nameRuby: 'レタス生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'レタスの収穫量{しゅうかくりょう}' },
  { id: 'spinach', slug: 'spinach', nameRuby: 'ほうれんそう生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ほうれんそうの収穫量{しゅうかくりょう}' },
  { id: 'komatsuna', slug: 'komatsuna', nameRuby: '小松菜{こまつな}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '小松菜{こまつな}の収穫量{しゅうかくりょう}' },
  { id: 'tomato', slug: 'tomato', nameRuby: 'トマト生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'トマトの収穫量{しゅうかくりょう}' },
  { id: 'cucumber', slug: 'cucumber', nameRuby: 'きゅうり生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'きゅうりの収穫量{しゅうかくりょう}' },
  { id: 'eggplant', slug: 'eggplant', nameRuby: 'なす生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'なすの収穫量{しゅうかくりょう}' },
  { id: 'pumpkin', slug: 'pumpkin', nameRuby: 'かぼちゃ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'かぼちゃの収穫量{しゅうかくりょう}' },
  { id: 'green_pepper', slug: 'green-pepper', nameRuby: 'ピーマン生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ピーマンの収穫量{しゅうかくりょう}' },
  { id: 'broccoli', slug: 'broccoli', nameRuby: 'ブロッコリー生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ブロッコリーの収穫量{しゅうかくりょう}' },
  { id: 'asparagus', slug: 'asparagus', nameRuby: 'アスパラガス生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'アスパラガスの収穫量{しゅうかくりょう}' },
  { id: 'celery', slug: 'celery', nameRuby: 'セロリ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'セロリの収穫量{しゅうかくりょう}' },
  { id: 'corn', slug: 'corn', nameRuby: 'とうもろこし生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'とうもろこしの収穫量{しゅうかくりょう}' },
  { id: 'welsh_onion', slug: 'welsh-onion', nameRuby: 'ねぎ生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'ねぎの収穫量{しゅうかくりょう}' },
  { id: 'garlic', slug: 'garlic', nameRuby: 'にんにく生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'にんにくの収穫量{しゅうかくりょう}' },
  { id: 'ginger', slug: 'ginger', nameRuby: 'しょうが生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'しょうがの収穫量{しゅうかくりょう}' },
  { id: 'taro', slug: 'taro', nameRuby: '里芋{さといも}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '里芋{さといも}の収穫量{しゅうかくりょう}' },
  { id: 'yam', slug: 'yam', nameRuby: '山芋{やまいも}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '山芋{やまいも}の収穫量{しゅうかくりょう}' },
  { id: 'lotus', slug: 'lotus-root', nameRuby: 'れんこん生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'れんこんの収穫量{しゅうかくりょう}' },
  { id: 'edamame', slug: 'edamame', nameRuby: '枝豆{えだまめ}生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '枝豆{えだまめ}の収穫量{しゅうかくりょう}' },
  { id: 'tea', slug: 'tea-leaves', nameRuby: '茶葉{ちゃば}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '茶{ちゃ}の生葉{なまば}収穫量{しゅうかくりょう}' },
  { id: 'sugarcane', slug: 'sugarcane', nameRuby: 'さとうきび生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: 'さとうきびの収穫量{しゅうかくりょう}' },
  { id: 'rape', slug: 'rape-seed', nameRuby: '菜種{なたね}の生産量{せいさんりょう}', unitLabel: 't（トン）', noteRuby: '菜種{なたね}の収穫量{しゅうかくりょう}' },
];

function parseAmount(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseTable(html) {
  const rows = [];
  // Match table rows: 都道府県名 ... 数値+単位 ... 順位
  const re =
    /<(?:td|th)[^>]*>\s*(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)\s*<\/(?:td|th)>[\s\S]*?<(?:td|th)[^>]*>\s*([0-9,]+(?:\.[0-9]+)?)\s*(t|頭|千羽|羽)?\s*<\/(?:td|th)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = m[1];
    const value = parseAmount(m[2]);
    if (value == null) continue;
    const code = CODE_BY_NAME[name];
    if (!code) continue;
    rows.push({ code, name, value, unitHint: m[3] || 't' });
  }
  // de-dupe by code keep first
  const seen = new Set();
  return rows.filter((r) => {
    if (seen.has(r.code)) return false;
    seen.add(r.code);
    return true;
  });
}

function detectYear(html) {
  if (html.includes('令和5年') || html.includes('令和５年')) return '令和5年（2023年）';
  if (html.includes('令和6年') || html.includes('令和６年')) return '令和6年（2024年）';
  return '令和5年（2023年）';
}

async function fetchCategory(def) {
  const url = `https://region-case.com/rank-r5-product-${def.slug}/`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'geo-puzzle-kids-web-rank-builder/1.0' },
  });
  if (!res.ok) throw new Error(`${def.slug} HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes('農林水産省')) {
    throw new Error(`${def.slug}: missing MAFF attribution`);
  }
  const rows = parseTable(html);
  if (rows.length < 3) throw new Error(`${def.slug}: too few rows (${rows.length})`);
  rows.sort((a, b) => b.value - a.value);
  return {
    id: def.id,
    nameRuby: def.nameRuby,
    unitLabel: def.unitLabel,
    noteRuby: def.noteRuby,
    source: '農林水産省「作物統計」',
    sourceYear: detectYear(html),
    sourceUrl: url,
    values: Object.fromEntries(rows.map((r) => [r.code, r.value])),
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const categories = [];
  for (const def of CROP_DEFS) {
    process.stdout.write(`fetch ${def.id}... `);
    try {
      const cat = await fetchCategory(def);
      categories.push(cat);
      console.log(`OK (${Object.keys(cat.values).length})`);
    } catch (e) {
      console.log(`FAIL ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  const out = {
    fetchedAt: new Date().toISOString(),
    note: 'Values scraped from region-case.com pages that attribute 農林水産省「作物統計」.',
    categories,
  };
  const outPath = path.join(outDir, 'official-stats.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${categories.length} categories → ${outPath}`);
  if (categories.length < 40) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

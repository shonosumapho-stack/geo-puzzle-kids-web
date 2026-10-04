/**
 * Builds public/assets/japan/prefecture_ranks.json
 * Population/area/density from prefecture_info.json; other categories are
 * kid-friendly approximate rankings based on well-known public stats.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const info = JSON.parse(
  fs.readFileSync(path.join(root, 'public/assets/japan/prefecture_info.json'), 'utf8'),
);

const byCode = Object.fromEntries(info.map((p) => [p.code, p]));

function entry(code, value, valueLabel) {
  const p = byCode[code];
  if (!p) throw new Error(`Unknown prefecture ${code}`);
  const row = {
    code,
    name: p.name,
    nameRuby: p.nameRuby,
  };
  if (value != null && valueLabel) {
    row.value = value;
    row.valueLabel = valueLabel;
  }
  return row;
}

/** 順位のみ（数値は載せない・信頼できる出典がないため） */
function fromCodes(codes) {
  return codes.map((code) => entry(code, null, ''));
}

function rankByNumber(items, getValue, labelFn) {
  const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));
  return sorted.map((p, i) => {
    const v = getValue(p);
    return entry(p.code, v, labelFn(p, i, v));
  });
}

const popRank = rankByNumber(info, (p) => p.population, (p, _i, v) => `約${Math.round(v / 10000)}万人`);
const areaRank = rankByNumber(info, (p) => p.areaKm2, (p, _i, v) => `約${v.toLocaleString('ja-JP')} km²`);
const densityRank = rankByNumber(
  info,
  (p) => p.population / p.areaKm2,
  (p, _i, v) => `約${Math.round(v)}人/km²`,
);

/** Ordered prefecture codes (1st → last). Top accuracy prioritized. */
const ORDERED = {
  mikan: ['30', '38', '22', '46', '18', '39', '37', '24', '23', '28'],
  apple: ['02', '20', '06', '01', '03', '05', '07', '09', '15', '19'],
  rice: ['15', '01', '04', '07', '03', '06', '02', '08', '20', '05'],
  tea: ['22', '46', '24', '21', '40', '23', '28', '39', '45', '33'],
  grape: ['19', '20', '33', '01', '06', '07', '28', '15', '09', '22'],
  peach: ['19', '07', '20', '06', '28', '15', '33', '10', '09', '11'],
  cherry: ['06', '01', '19', '20', '07', '05', '03', '02', '15', '09'],
  pear: ['08', '09', '07', '12', '11', '06', '15', '28', '33', '34'],
  strawberry: ['09', '40', '22', '23', '08', '12', '14', '11', '28', '27'],
  melon: ['08', '01', '43', '46', '19', '22', '09', '40', '23', '15'],
  potato: ['01', '46', '20', '08', '20', '15', '07', '03', '02', '45'],
  onion: ['01', '41', '28', '47', '46', '40', '22', '23', '27', '14'],
  cabbage: ['10', '23', '08', '14', '11', '12', '22', '28', '09', '27'],
  tomato: ['43', '22', '01', '23', '08', '28', '20', '40', '14', '11'],
  milk: ['01', '09', '08', '20', '22', '23', '07', '03', '15', '40'],
  beef: ['01', '46', '43', '28', '23', '45', '22', '15', '40', '33'],
  pork: ['46', '08', '40', '12', '11', '23', '14', '28', '22', '27'],
  chicken: ['45', '08', '40', '23', '12', '46', '28', '22', '11', '14'],
  egg: ['08', '12', '23', '40', '11', '14', '28', '22', '27', '46'],
  fish: ['01', '22', '14', '12', '40', '46', '23', '28', '42', '34'],
  coastline: ['01', '42', '46', '47', '22', '12', '24', '14', '28', '40'],
  snowfall: ['15', '01', '05', '03', '06', '20', '16', '17', '18', '07'],
  sunshine: ['19', '10', '08', '11', '12', '14', '22', '23', '47', '28'],
  rainfall: ['39', '46', '45', '42', '40', '43', '47', '24', '22', '21'],
  temperature: ['47', '46', '45', '43', '40', '42', '41', '24', '39', '38'],
  mountain: ['19', '20', '21', '22', '16', '15', '01', '10', '09', '07'],
  islands: ['42', '46', '47', '01', '34', '38', '28', '24', '22', '14'],
  tourists: ['13', '27', '14', '23', '40', '01', '12', '26', '28', '22'],
  hot_spring: ['01', '22', '07', '20', '45', '46', '43', '28', '34', '09'],
  hotels: ['13', '27', '01', '14', '23', '40', '12', '28', '22', '26'],
  universities: ['13', '27', '14', '23', '40', '26', '28', '12', '11', '22'],
  airports: ['01', '13', '47', '40', '27', '23', '14', '22', '34', '28'],
  shinkansen: ['13', '14', '11', '12', '23', '22', '27', '28', '40', '34'],
  convenience: ['13', '14', '27', '23', '11', '12', '40', '28', '22', '01'],
  cars: ['23', '22', '14', '11', '12', '28', '27', '40', '34', '13'],
  factories: ['23', '14', '22', '11', '12', '27', '28', '40', '13', '34'],
  ports: ['14', '23', '12', '27', '34', '40', '28', '22', '13', '01'],
  railway: ['13', '14', '27', '23', '11', '12', '28', '40', '22', '01'],
  bridges: ['13', '14', '27', '23', '28', '34', '40', '12', '11', '22'],
  shrines: ['13', '23', '14', '27', '28', '12', '11', '40', '22', '26'],
  temples: ['13', '26', '27', '14', '23', '28', '12', '11', '40', '22'],
  museums: ['13', '14', '27', '23', '26', '28', '40', '12', '11', '01'],
  parks: ['13', '01', '14', '27', '23', '12', '11', '40', '28', '22'],
  forests: ['01', '03', '20', '07', '15', '21', '05', '46', '02', '45'],
  lakes: ['01', '25', '20', '15', '03', '07', '05', '22', '19', '16'],
  rivers: ['01', '15', '03', '07', '20', '21', '28', '33', '23', '08'],
  volcanoes: ['01', '46', '20', '19', '22', '43', '45', '47', '42', '07'],
  ski: ['01', '20', '15', '05', '03', '06', '16', '17', '07', '19'],
  fireworks: ['15', '13', '01', '23', '04', '27', '14', '28', '40', '22'],
  festivals: ['13', '26', '27', '01', '23', '14', '40', '28', '22', '12'],
};

// fix potato duplicate 20
ORDERED.potato = ['01', '46', '20', '08', '15', '07', '03', '02', '45', '43'];

const categories = [
  {
    id: 'population',
    nameRuby: '人口{じんこう}',
    unitLabel: '人',
    noteRuby: '住{す}んでいる人{ひと}の多{おお}さ。図鑑{ずかん}データの推計{すいけい}',
    hasValues: true,
    ranking: popRank,
  },
  {
    id: 'area',
    nameRuby: '面積{めんせき}',
    unitLabel: 'km²',
    noteRuby: '都道府県{とどうふけん}の広{ひろ}さ。図鑑{ずかん}データ',
    hasValues: true,
    ranking: areaRank,
  },
  {
    id: 'density',
    nameRuby: '人口密度{じんこうみつど}',
    unitLabel: '人/km²',
    noteRuby: '1km²あたりの人{ひと}の多{おお}さ。人口{じんこう}÷面積{めんせき}',
    hasValues: true,
    ranking: densityRank,
  },
  // 単位は学習用の目安。数値は信頼できる出典を入れていないため順位のみ
  cat('mikan', 'みかんの生産量{せいさんりょう}', 't（トン）', '甘{あま}いみかんがたくさんとれるところ'),
  cat('apple', 'りんごの生産量{せいさんりょう}', 't（トン）', '赤{あか}いりんごの名産地{めいさんち}'),
  cat('rice', '米{こめ}の生産量{せいさんりょう}', 't（トン）', 'ごはんになるお米{こめ}'),
  cat('tea', 'お茶{ちゃ}の生産量{せいさんりょう}', 't（トン）', '緑茶{りょくちゃ}など'),
  cat('grape', 'ぶどうの生産量{せいさんりょう}', 't（トン）', 'ぶどうの産地{さんち}'),
  cat('peach', 'ももの生産量{せいさんりょう}', 't（トン）', 'やわらかいもも'),
  cat('cherry', 'さくらんぼの生産量{せいさんりょう}', 't（トン）', 'あかいさくらんぼ'),
  cat('pear', 'なしの生産量{せいさんりょう}', 't（トン）', '日本{にほん}なし'),
  cat('strawberry', 'いちごの生産量{せいさんりょう}', 't（トン）', 'あまいいちご'),
  cat('melon', 'メロンの生産量{せいさんりょう}', 't（トン）', 'ネットメロンなど'),
  cat('potato', 'じゃがいも生産量{せいさんりょう}', 't（トン）', 'カレーにも入{はい}るじゃがいも'),
  cat('onion', 'たまねぎ生産量{せいさんりょう}', 't（トン）', 'たまねぎ'),
  cat('cabbage', 'キャベツ生産量{せいさんりょう}', 't（トン）', 'やわらかいキャベツ'),
  cat('tomato', 'トマト生産量{せいさんりょう}', 't（トン）', '赤{あか}いトマト'),
  cat('milk', '生乳{せいにゅう}生産量{せいさんりょう}', 't（トン）', '牛乳{ぎゅうにゅう}のもと'),
  cat('beef', '牛肉{ぎゅうにく}生産{せいさん}', '頭（とう）', '牛{うし}の飼育{しいく}'),
  cat('pork', '豚肉{ぶたにく}生産{せいさん}', '頭（とう）', '豚{ぶた}の飼育{しいく}'),
  cat('chicken', '鶏肉{とりにく}生産{せいさん}', '羽（わ）', 'とりの飼育{しいく}'),
  cat('egg', '鶏卵{けいらん}生産量{せいさんりょう}', 't（トン）', 'たまご'),
  cat('fish', '漁獲量{ぎょかくりょう}', 't（トン）', '海{うみ}や川{かわ}での魚{さかな}など'),
  cat('coastline', '海岸線{かいがんせん}の長{なが}さ', 'km', '海{うみ}に面{めん}した線{せん}の長{なが}さ'),
  cat('snowfall', '降雪量{こうせつりょう}', 'cm', '雪{ゆき}の多{おお}さ'),
  cat('sunshine', '日照時間{にっしょうじかん}', '時間', '太陽{たいよう}が照{て}る時間{じかん}'),
  cat('rainfall', '降水量{こうすいりょう}', 'mm（ミリ）', '雨{あめ}の多{おお}さ'),
  cat('temperature', '年平均気温{ねんへいきんきおん}', '℃', 'あたたかさ'),
  cat('mountain', 'いちばん高{たか}い山{やま}', 'm', '県内{けんない}の最高峰{さいこうほう}'),
  cat('islands', '島{しま}の数{かず}', '島', '離島{りとう}も含{ふく}む'),
  cat('tourists', '観光客{かんこうきゃく}数{すう}', '人', '訪{おとず}れる人{ひと}の多{おお}さ'),
  cat('hot_spring', '温泉{おんせん}の数{かず}', '源泉', 'おんせん地'),
  cat('hotels', 'ホテル・旅館{りょかん}', '軒', '泊{と}まれる宿{やど}'),
  cat('universities', '大学{だいがく}の数{かず}', '校', '大学{だいがく}'),
  cat('airports', '空港{くうこう}の数{かず}', '空港', '飛行機{ひこうき}が発着{はっちゃく}'),
  cat('shinkansen', '新幹線駅{しんかんせんえき}', '駅', '新幹線{しんかんせん}が停{と}まる駅{えき}'),
  cat('convenience', 'コンビニの数{かず}', '店', '便利{べんり}なお店{みせ}'),
  cat('cars', '自動車{じどうしゃ}生産{せいさん}', '台', '車{くるま}づくり'),
  cat('factories', '工業{こうぎょう}出荷額{しゅっかがく}', '円', '工場{こうじょう}でつくったものの金額{きんがく}'),
  cat('ports', '港{みなと}の貨物量{かもつりょう}', 't（トン）', '船{ふね}で運{はこ}ぶ荷物{にもつ}'),
  cat('railway', '鉄道路線{てつどうろせん}の長{なが}さ', 'km', '電車{でんしゃ}の線路{せんろ}'),
  cat('bridges', '橋{はし}の数{かず}', '橋', '川{かわ}や海{うみ}に架{か}かる橋{はし}'),
  cat('shrines', '神社{じんじゃ}の数{かず}', '社', '神社{じんじゃ}'),
  cat('temples', 'お寺{てら}の数{かず}', '寺', 'お寺{てら}'),
  cat('museums', '博物館{はくぶつかん}・美術館{びじゅつかん}', '館', '学べる施設{しせつ}'),
  cat('parks', '都市公園{としこうえん}面積{めんせき}', 'ha', 'まちの公園{こうえん}'),
  cat('forests', '森林面積{しんりんめんせき}', 'ha', '森{もり}の広{ひろ}さ'),
  cat('lakes', '湖{みずうみ}の面積{めんせき}', 'km²', '大きな湖{みずうみ}'),
  cat('rivers', '川{かわ}の長{なが}さ', 'km', '長い川{かわ}'),
  cat('volcanoes', '活火山{かつかざん}の数{かず}', '山', '活{かつ}動する火山{かざん}'),
];

function cat(id, nameRuby, unitLabel, noteRuby) {
  const codes = ORDERED[id];
  if (!codes) throw new Error(`Missing order for ${id}`);
  return {
    id,
    nameRuby,
    unitLabel,
    noteRuby,
    hasValues: false,
    ranking: fromCodes(codes),
  };
}

if (categories.length !== 50) {
  console.error(`Expected 50 categories, got ${categories.length}`);
  process.exit(1);
}

const out = {
  version: 2,
  sourceNote:
    '人口・面積・人口密度だけ数値あり（図鑑データ）。ほかはおおよその順位で、単位は学習用の目安です。',
  categories,
};

const outPath = path.join(root, 'public/assets/japan/prefecture_ranks.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${categories.length} categories → ${outPath}`);

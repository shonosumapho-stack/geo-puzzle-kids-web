# 地図パズル（Web）

Android 統合版 [geo_kids_hub](../geo_kids_hub) と同じ **日本地図パズル**・**神奈川地図パズル**をブラウザで遊べる版です。

- ピースをドラッグして地図にハメる（はめる前は名前非表示）
- はめた地域をタップ → 図鑑へ（パズルから開いた場合は「パズルに戻る」）
- 図鑑（食べ物・場所・豆知識・写真）

ベストタイムは `localStorage` に保存されます（Android APK とは別データです）。

## ローカル開発

他の Web ゲームとポートが重ならないよう **5176** を使います。

```powershell
cd "C:\Users\nobua\OneDrive\デスクトップ\DIY Games\geo_puzzle_kids_web"
npm install
npm run dev
```

ブラウザ: **http://localhost:5176/#/**

## ビルド

```powershell
npm run build
npm run preview
```

## 写真データ

図鑑の JPG は `geo_kids_hub/app/src/main/assets/japan/photos` と `kana/photos` を  
`public/assets/japan/photos`・`public/assets/kana/photos` にコピーして使います。

## Vercel で公開

1. リポジトリ [shonosumapho-stack/geo-puzzle-kids-web](https://github.com/shonosumapho-stack/geo-puzzle-kids-web) に push（`gh` は **shonosumapho-stack** でログイン）
2. [Vercel](https://vercel.com) で Import → リポジトリを選択
3. **Root Directory**: 空（リポジトリ直下）
4. Framework Preset: **Vite**（`vercel.json` あり）

デプロイ後は `https://<project>.vercel.app/#/` でホームが開きます。

## Android との同期

地図データ・図鑑 JSON・写真を更新した場合は、`geo_kids_hub` の assets と本フォルダの `public/assets` を揃えてください。

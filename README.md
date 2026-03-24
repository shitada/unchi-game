# 💩 うんちゲーム — Kids Poop Game

5〜10歳向けの3Dうんちゲーム。ボタンを連打して巨大なうんちを出そう！押し方で種類が変わり、大きさやレア度でスコアが決まる。図鑑とランキングでコレクション＆ハイスコアを目指せ！

🎮 プレイはこちら → [https://shitada.github.io/unchi-game/](https://shitada.github.io/unchi-game/)

iPad Safari での横向きプレイに最適化されています。

## ゲーム概要

- 💩 **10秒間ボタンを連打** してうんちを出す！連打するほど大きくなる
- 🎯 **タップパターンで種類が変化** — 安定リズム、加速、バースト、高速連打で10種類のうんちが出現
- 📏 **うんちの大きさ（cm）** で記録。タップ数が主要因＋パターンボーナスで加算
- ⚡ **リアルタイムボーナス演出** — ゲーム中にボーナス条件を満たすとフラッシュ＋テキスト＋効果音
- 🎵 **BGMが加速** — 残り時間が減るとBGMがどんどん速くなる
- 📖 **図鑑** で10種類のうんちをコレクション。タップでぷるぷる震えてブリブリ効果音！
- 🏆 **ランキング** でTOP5の大きさを記録。プレイ時刻とうんちの種類も表示
- 🎆 全種類コンプリートで花火演出！

## うんちの種類（10種）

| 名前 | レア度 | 出し方 |
|------|--------|--------|
| ノーマルうんち | ★☆☆☆☆ | 普通に連打 |
| ちびうんち | ★☆☆☆☆ | あまり押さない |
| ながーいうんち | ★★☆☆☆ | 安定リズムで連打 |
| ぶっというんち | ★★☆☆☆ | ゆっくり力強く |
| ソフトクリームうんち | ★★★☆☆ | とても安定したリズム |
| つぶつぶうんち | ★★★☆☆ | バラバラなリズム |
| もこもこうんち | ★★★☆☆ | 2連打→休みパターン |
| カラフルうんち | ★★★★☆ | 超高速連打（60回以上） |
| ゴールデンうんち | ★★★★☆ | だんだん速く連打 |
| ほしのうんち | ★★★★★ | 安定リズム＋最後に長押し |

## 技術スタック

| 項目 | 技術 |
|------|------|
| 3D レンダリング | Three.js v0.170 |
| 言語 | TypeScript 5.7 |
| ビルド | Vite 6 |
| テスト | Vitest 3 |
| サウンド | Web Audio API（OscillatorNode / GainNode） |
| フォント | Zen Maru Gothic（Google Fonts） |
| デプロイ | GitHub Pages + GitHub Actions |

## 開発

```bash
# 依存インストール
npm install

# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# ビルド
npm run build
```

## プロジェクト構成

```
src/
├── main.ts                          # エントリポイント
├── types/index.ts                   # 型定義
├── game/
│   ├── GameLoop.ts                  # RAF ベースのゲームループ
│   ├── SceneManager.ts              # シーン管理・遷移
│   ├── audio/
│   │   ├── AudioManager.ts          # Web Audio API 管理
│   │   ├── BGMGenerator.ts          # 和音 BGM 生成（title/play/result）
│   │   └── SFXGenerator.ts          # 効果音（ボタン/ブリブリ/ボーナス/レア）
│   ├── config/
│   │   ├── GameSettings.ts          # ゲーム設定定数
│   │   └── PoopEncyclopedia.ts      # うんち図鑑データ定義
│   ├── entities/
│   │   └── poops/
│   │       ├── PoopFactory.ts       # 入力パターン → うんち種類判定
│   │       └── PoopModelBuilder.ts  # 10種のプロシージャル 3D モデル
│   ├── effects/
│   │   ├── PoopGrowEffect.ts        # うんち成長パーティクル
│   │   └── FireworkEffect.ts        # コンプリート花火
│   ├── scenes/
│   │   ├── TitleScene.ts            # タイトル画面
│   │   ├── PlayScene.ts             # メインゲーム画面
│   │   ├── ResultScene.ts           # 結果画面
│   │   ├── EncyclopediaScene.ts     # 図鑑画面
│   │   └── RankingScene.ts          # ランキング画面
│   ├── storage/
│   │   └── SaveManager.ts           # localStorage セーブ管理
│   └── systems/
│       ├── InputAnalyzer.ts         # 入力パターン分析
│       └── ScoreCalculator.ts       # スコア＆サイズ(cm)計算
tests/                               # ユニットテスト（26テスト）
```

## ライセンス

MIT

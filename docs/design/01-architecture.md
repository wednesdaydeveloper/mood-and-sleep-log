# アーキテクチャ設計書

> 要件定義書: `C:\Users\岡本隆志\.claude\plans\parallel-brewing-hanrahan.md`

## 1. 技術スタック

| 領域 | 採用 | 補足 |
|------|------|------|
| フレームワーク | **Expo (managed)** | OTA更新可、ビルドは EAS Build |
| 言語 | **TypeScript** (strict) | |
| ナビゲーション | **expo-router** | ファイルベースルーティング |
| 状態管理 | **Jotai** | アトミックステート |
| DB | **expo-sqlite + Drizzle ORM** | 型安全、マイグレーション標準対応 |
| グラフ | **Victory Native XL** | Skia ベース、折れ線・カスタム描画両対応 |
| 日時 | **date-fns** | 関数ベース、ツリーシェイキング |
| フォーム | **react-hook-form + zod** | バリデーション統合 |
| テスト（単体/結合） | **Jest + React Native Testing Library** | |
| テスト（E2E） | **Maestro** | YAML フロー、Expo 相性◎ |
| Lint/Format | ESLint + Prettier | Expo 標準テンプレに従う |

## 2. レイヤー構成

```
┌─────────────────────────────────────┐
│ UI 層 (screens / components)        │ ← React, Jotai, react-hook-form
├─────────────────────────────────────┤
│ ドメイン層 (domain / hooks)          │ ← ビジネスロジック、純粋関数中心
├─────────────────────────────────────┤
│ データ層 (db / repositories)         │ ← Drizzle, expo-sqlite
└─────────────────────────────────────┘
```

### 責務

- **UI 層**: 画面描画、ユーザー入力、ナビゲーション。Jotai アトムを購読し、ドメイン層のフック/関数を呼ぶ
- **ドメイン層**: 集計ロジック（週/月/年集約）、バリデーション、睡眠区間の重複検出など。**DBに依存しない純粋関数を優先**（テスト容易性）
- **データ層**: Drizzle で SQLite を抽象化。Repository パターンでクエリを集約

### 依存方向
UI → ドメイン → データ（逆方向の依存は禁止）

## 3. ディレクトリ構成

```
mood-and-sleep-log/
├── app/                          # expo-router (画面ルート)
│   ├── _layout.tsx
│   ├── index.tsx                 # ホーム（一覧）
│   ├── record/
│   │   ├── [date].tsx            # 記録入力/編集（記録日をパラメタ）
│   │   └── detail/[date].tsx     # 詳細
│   ├── chart.tsx                 # グラフ
│   └── settings.tsx
├── src/
│   ├── components/               # 再利用UI部品
│   │   ├── mood/                 # 気分5段階セレクタ、絵文字
│   │   ├── tags/                 # 感情タグ選択（カテゴリ別）
│   │   ├── sleep-timeline/       # 睡眠タイムライン入力UI（要設計）
│   │   ├── chart/                # 3段グラフ（要設計）
│   │   └── ui/                   # 汎用ボタン・モーダル等
│   ├── domain/
│   │   ├── mood.ts               # MoodScore型、絵文字マップ
│   │   ├── tags.ts               # 感情タグプリセット定義
│   │   ├── sleep.ts              # 睡眠区間バリデーション、合計算出
│   │   ├── chart-aggregation.ts  # 週/月/年集約ロジック
│   │   └── csv.ts                # CSVシリアライズ
│   ├── db/
│   │   ├── client.ts             # Drizzle クライアント初期化
│   │   ├── schema.ts             # テーブル定義（要件§6）
│   │   ├── migrations/           # 自動生成マイグレーション
│   │   └── repositories/
│   │       ├── daily-record.ts
│   │       ├── sleep-interval.ts
│   │       └── draft.ts
│   ├── store/                    # Jotai アトム
│   │   ├── current-record.ts     # 入力中の記録
│   │   └── ui.ts                 # UI状態（タブ選択等）
│   ├── lib/
│   │   ├── date.ts               # date-fns ラッパ
│   │   └── share.ts              # CSV シェアシート連携
│   └── hooks/
│       ├── use-records.ts
│       ├── use-draft.ts          # 自動下書き保存（debounce）
│       └── use-chart-data.ts
├── tests/
│   ├── unit/                     # ドメイン純粋関数
│   └── integration/              # Repository + DB（in-memory SQLite）
├── e2e/
│   └── flows/                    # Maestro YAML
├── assets/
├── docs/design/                  # 本設計書群
├── app.json                      # Expo設定
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## 4. 状態管理（Jotai）方針

- **永続データ**: DB が真実のソース。Jotai は派生キャッシュとして扱う
- **入力中データ**: `currentRecordAtom` に保持、自動下書きフックが debounce で DraftRecord に永続化
- **UI状態**: グラフのタブ選択（week/month/year）、一覧のカレンダー/リスト切替など短命な値
- **派生アトム**: `selectAtom` で集計結果（週平均など）をメモ化

## 5. 主要な技術的判断と根拠

| 判断 | 根拠 |
|------|------|
| Expo managed | OS別ネイティブ実装不要、CI/CD簡素、SQLite/SVG/Share標準提供 |
| Drizzle ORM | 型安全、マイグレーション標準、生SQLとも併用可（集計クエリで有用） |
| Jotai | 今回規模で Redux はオーバー、Context は再描画制御が手間。アトム単位のリアクティブ性が要件と合う |
| Victory Native XL | 縦帯グラフ（睡眠時間帯）はカスタム描画必須。Skia ベースで自由度高い |
| Maestro | Detox より導入が軽量、Expo 公式が推奨 |

## 6. リスクと対策

| リスク | 対策 |
|--------|------|
| 縦帯グラフのカスタム描画 | Victory Native XL の `Canvas`/Skia API でプリミティブ描画。早期にプロトタイプ |
| 睡眠タイムライン UI のジェスチャー | react-native-gesture-handler + Reanimated を採用、ハンドル単位で `useAnimatedGestureHandler` |
| year ビューの集約パフォーマンス | 集計は SQL 側で実行（GROUP BY MONTH）。365件 × 3指標なら問題ない見込み |
| 自動下書きの破損 | DraftRecord は1日1件、payload は JSON。書込み失敗時は無視し本データに影響させない |

## 7. ビルド・配布

- **開発**: `expo start` → Expo Go または dev client
- **テストビルド**: EAS Build で APK/IPA、TestFlight/内部テスト
- **本番配布**: 自分専用なので App Store/Play Store 公開は不要、Ad Hoc/Internal 配布で十分

## 8. 次に決めること（次フェーズ）

1. データ設計書: SQLite DDL、インデックス、集計クエリ
2. 詳細設計（睡眠タイムライン UI、3段グラフ）
3. 画面設計書、画面遷移図
4. 実装計画（マイルストーン分解）

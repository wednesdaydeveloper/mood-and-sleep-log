# 実装計画

> 関連: 設計書 01〜05

## 1. 進め方の原則

- **TDD**: 純粋関数から書き、UIへ。テスト先行（要件 §10 の受け入れ基準が最終ゴール）
- **マイルストーン単位で動くものを残す**: 各 M の終了時点で `expo start` で動作確認できる状態
- **薄く全層 → 厚く機能ごと**: M1 で全層を貫通する最小機能を完成、その後機能を厚くする

## 2. マイルストーン

### M1: 雛形 + DB（1〜2日）
**ゴール**: 起動 → DB 初期化 → ボトムタブ3画面が表示

- [ ] `npx create-expo-app` で雛形生成（TypeScript + expo-router テンプレ）
- [ ] 依存追加: jotai, drizzle-orm, **op-sqlcipher**, **expo-secure-store**, date-fns, react-hook-form, zod, victory-native, @shopify/react-native-skia, react-native-gesture-handler, react-native-reanimated, expo-haptics, expo-sharing, expo-file-system, i18next, react-i18next, expo-localization
- [ ] `src/db/schema.ts` 定義
- [ ] `drizzle.config.ts` + 初回マイグレーション生成
- [ ] `src/db/client.ts` で起動時マイグレーション適用
- [ ] **SQLCipher 鍵生成・保存ロジック**（expo-secure-store、初回時にランダム鍵生成）
- [ ] **クラウドバックアップ除外設定**（iOS: `setIsExcludedFromBackupAsync`、Android: `allowBackup=false`）
- [ ] ボトムタブレイアウト（ホーム/グラフ/設定の3画面、中身は空）
- [ ] テスト雛形: Jest 設定 + RNTL + Maestro `e2e/` ディレクトリ

**検証**: `expo start` で起動、SQLite ファイル生成確認

---

### M2: 記録の最小入力フロー（2〜3日）
**ゴール**: 気分・タグ・メモを入力して保存、ホーム一覧（リスト）に表示

- [ ] `domain/mood.ts`、`domain/tags.ts`（プリセット定義 + 単体テスト）
- [ ] `db/repositories/daily-record.ts` の upsert/list/findByDate（Repository テスト）
- [ ] `record/[date].tsx` の最小フォーム（気分5段階 + タグ + メモ）
- [ ] react-hook-form + zod スキーマ
- [ ] `index.tsx` のリスト表示
- [ ] ホーム → FAB → 入力 → 保存 → ホームへ戻る、の流れ

**検証**: M2 完了時点で「気分とメモだけのアプリ」として既に動く

---

### M3: 睡眠タイムラインUI（3〜4日 / 山場）
**ゴール**: 分割睡眠を含む睡眠区間を入力・編集

- [ ] `domain/sleep.ts` 純粋関数群（snap/overlap/clamp）+ 単体テスト
- [ ] `components/sleep-timeline/` コンポーネント実装
  - [ ] TimelineRuler（21:00〜翌11:00 の目盛り）
  - [ ] TimelineCanvas + タップで区間追加
  - [ ] SleepIntervalBar + Pan ジェスチャー（Reanimated worklet）
  - [ ] DragHandle（44pt ヒット領域）
  - [ ] 長押し削除モーダル
  - [ ] 10区間上限のトースト
- [ ] `record/[date].tsx` に組込
- [ ] `db/repositories/sleep-interval.ts` + トランザクションでの同期
- [ ] 詳細画面 `record/detail/[date].tsx`（表示のみ）

**検証**: 受け入れ基準「分割睡眠が登録・表示される」

---

### M4: 自動下書き保存 + カレンダー一覧（2日）
**ゴール**: アプリ強制終了で復元、カレンダー表示

- [ ] `db/repositories/draft.ts` + `cleanupOlderThan`（7日）
- [ ] `hooks/use-draft.ts`（debounce 500ms 自動保存、起動時クリーンアップ）
- [ ] 入力画面マウント時の復元ダイアログ
- [ ] 戻る時の未保存破棄ダイアログ
- [ ] ホームのカレンダー表示モード（`react-native-calendars` 検討、または自作）
- [ ] カレンダー/リスト切替タブ

**検証**: 受け入れ基準「アプリを再起動しても下書き復元」「カレンダー/リスト切替」

---

### M5: グラフ week / month（3〜4日）
**ゴール**: week と month の3段グラフ表示

- [ ] `domain/chart-aggregation.ts` の week/month 集約 + 単体テスト
- [ ] `components/chart/MoodChart.tsx`（Victory Native XL 折れ線）
- [ ] `components/chart/SleepDurationChart.tsx`（同上）
- [ ] `components/chart/SleepTimeRangeChart.tsx`（Skia 縦帯、分割対応）
- [ ] 期間タブ + ◀▶ ナビ
- [ ] X軸共有スケールの実装（親で計算、props で配信）
- [ ] タップ判定 + ポップアップ

**検証**: 受け入れ基準「week/month の3段パネル表示」「分割睡眠が縦帯で分かれる」

---

### M6: グラフ year + CSV エクスポート（2日）
**ゴール**: year 表示、CSV 出力

- [ ] `aggregateForYear` 実装（21:00起点分単位の月平均）+ 単体テスト
- [ ] year ビュー表示（0件月のギャップ含む）
- [ ] `domain/csv.ts` + 単体テスト（クォート、エスケープ）
- [ ] `lib/share.ts` で expo-sharing 連携
- [ ] 設定画面に「CSV エクスポート」ボタン

**検証**: 受け入れ基準「year 切替」「CSV エクスポートが iOS/Android で動作」

---

### M7: 仕上げ（2〜3日）
**ゴール**: 受け入れ基準を全て満たし、E2E パス

- [ ] アクセシビリティラベル全面付与
- [ ] ダーク/ライトテーマの色調整
- [ ] エッジケース対応（空データ、初回起動、極端な値）
- [ ] パフォーマンス計測（year ビュー 1秒以内）
- [ ] Maestro E2E フロー
  - [ ] `record-create.yaml`: 入力 → 保存 → 一覧で確認
  - [ ] `record-sleep-split.yaml`: 分割睡眠の登録
  - [ ] `chart-view.yaml`: タブ切替
  - [ ] `csv-export.yaml`: エクスポート起動
- [ ] EAS Build で実機ビルド確認（iOS/Android）

**検証**: 要件 §10 の受け入れ基準9項目すべてチェック

---

## 3. 依存関係グラフ

```
M1 (雛形+DB)
 ├─→ M2 (最小入力)
 │    ├─→ M3 (タイムラインUI)  ← 山場
 │    │    └─→ M4 (下書き+カレンダー)
 │    │         └─→ M5 (グラフ week/month)
 │    │              └─→ M6 (year + CSV)
 │    │                   └─→ M7 (仕上げ)
```

総工数見積: **15〜20日**（個人開発、副業ペース想定）

## 4. TDD 戦略

### レイヤー別テスト方針

| レイヤー | テスト | 比率 |
|----------|--------|------|
| domain（純粋関数） | Jest 単体、入力→出力をひたすら | 高（70%以上） |
| db / repositories | Jest 結合、in-memory または expo-sqlite モック | 中 |
| components | RNTL、レンダリング + イベント | 中 |
| screens | RNTL、ナビゲーション含む結合 | 低 |
| E2E | Maestro、受け入れ基準ベース | 重要フローのみ |

### テスト先行で書く順
1. `domain/mood.ts` `domain/tags.ts` `domain/sleep.ts` `domain/chart-aggregation.ts` `domain/csv.ts`
2. `db/repositories/*.ts`
3. `components/sleep-timeline/*` の純粋ロジック部分
4. UIインタラクション、ナビゲーション

### カバレッジ目標
- domain: 90%+
- db: 80%+
- components: 60%+
- 全体: 80%（要件§testing.md 準拠）

## 5. リスク対応

| リスク | 兆候 | 対応 |
|--------|------|------|
| Reanimated worklet で挙動不審 | M3 でドラッグがガタつく | 早期に最小再現を作る、必要なら Skia 描画に切替 |
| Skia 縦帯のタップ判定が複雑 | M5 でタップ反応しない | bbox を別途持つ、Pressable オーバーレイで対応 |
| Victory Native XL のAPI変更 | M5 で動作しない | バージョン固定、Skia 自作の代替案 |
| Drizzle のExpo相性 | M1 で起動失敗 | drizzle-orm/expo-sqlite 公式テンプレに準拠 |
| 設計と実装のずれ | 開発中に発覚 | マイルストーン終わりに設計書を更新（同期） |

## 6. Definition of Done（各マイルストーン共通）

- [ ] 計画されたタスクがすべて完了
- [ ] 単体テスト + 結合テストがパス
- [ ] `expo start` でクラッシュせず動作確認
- [ ] TypeScript エラー 0、ESLint warning 0
- [ ] 設計書との差分があれば設計書を更新
- [ ] 主要画面のスクリーンショットを `docs/screenshots/` に保存

## 7. プロジェクト初期コマンド

M1 着手時に実行:

```bash
npx create-expo-app@latest mood-and-sleep-log --template default
cd mood-and-sleep-log
npx expo install expo-router expo-sqlite expo-haptics expo-sharing expo-file-system \
  react-native-gesture-handler react-native-reanimated \
  @shopify/react-native-skia
npm install jotai drizzle-orm date-fns react-hook-form zod victory-native
npm install -D drizzle-kit @testing-library/react-native @types/jest
```

## 8. 進行管理

- マイルストーンごとにブランチ: `feat/m1-bootstrap`, `feat/m2-record-input`, ...
- マージ前に code-reviewer エージェントレビュー（global rules §code-review）
- 受け入れ基準は `docs/acceptance.md` にチェックボックスで残し、M7 で全てチェック

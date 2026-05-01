# E2Eシナリオ詳細

> ツール: [Maestro](https://maestro.mobile.dev/)（YAML フロー）

## 1. 配置

```
e2e/
├── flows/
│   ├── 01-record-create-basic.yaml
│   ├── 02-record-sleep-split.yaml
│   ├── 03-record-edit-delete.yaml
│   ├── 04-draft-restore.yaml
│   ├── 05-list-calendar-toggle.yaml
│   ├── 06-chart-week.yaml
│   ├── 07-chart-month-year.yaml
│   ├── 08-chart-tap-popup.yaml
│   └── 09-csv-export.yaml
├── fixtures/
│   └── seed.sql            # テストデータ流し込み（任意）
└── README.md
```

## 2. テストデータセット戦略

### 方針
- 各フローは **独立して動く**
- 開始前に DB をリセット（Maestro の `runFlow` で `reset.yaml` を呼ぶ）
- 必要なデータは各フロー内で UI 経由 or fixture で投入

### `reset.yaml`
```yaml
appId: com.example.moodsleep
---
- launchApp:
    clearState: true
- launchApp
```

### Seed（必要に応じて）
グラフ系のシナリオでは多日数のデータが必要なため、開発専用のデバッグ画面を用意する案も:
- 設定画面に `__DEV__` 限定で「サンプルデータ投入」ボタン
- E2E から該当ボタンをタップ

## 3. シナリオ一覧

### 3.1 基本記録作成（受け入れ基準: 30秒以内）

`01-record-create-basic.yaml`

```yaml
appId: com.example.moodsleep
---
- runFlow: ../reset.yaml
- launchApp
- tapOn: "+"                          # FAB
- tapOn:
    id: "mood-button-+1"
- tapOn:
    id: "tag-toggle-楽しい"
- tapOn:
    id: "memo-input"
- inputText: "良い1日だった"
- tapOn: "保存"
- assertVisible: "🙂"                  # 一覧に反映
- assertVisible: "良い1日だった"
```

### 3.2 分割睡眠の登録（受け入れ基準: 分割対応）

`02-record-sleep-split.yaml`

```yaml
appId: com.example.moodsleep
---
- runFlow: ../reset.yaml
- launchApp
- tapOn: "+"
- tapOn: "+ 区間を追加"               # 1回目
- swipe:                               # 終了ハンドルを 02:00 まで
    from: { id: "handle-0-end" }
    to:   { x: "30%", y: "60%" }
- tapOn: "+ 区間を追加"               # 2回目
- swipe:                               # 開始ハンドルを 03:30 へ
    from: { id: "handle-1-start" }
    to:   { x: "45%", y: "60%" }
- assertVisible: "合計"                # 合計時間が更新
- tapOn: "保存"
- assertVisible: "23:00 - 02:00"       # 詳細で2区間
- assertVisible: "03:30 - 07:00"
```

### 3.3 編集・削除

`03-record-edit-delete.yaml`

- 既存記録をタップ → 詳細画面
- 「編集」 → 気分変更 → 保存 → 一覧で反映確認
- 詳細画面に戻り「削除」 → 確認モーダル → 削除 → 一覧から消える

### 3.4 下書き復元

`04-draft-restore.yaml`

- 入力画面で気分とメモを入力
- バックボタン → 「破棄」せず戻る
- アプリを再起動（`launchApp` 再実行）
- 同じ日付の入力画面を開く
- 「下書きを復元しますか？」モーダル → 復元
- 入力した値が残っていることを確認

### 3.5 カレンダー/リスト切替

`05-list-calendar-toggle.yaml`

- リストタブで日付がリスト表示される
- カレンダータブで月表示に切り替わる
- 月送り ◀▶ で前月・翌月

### 3.6 グラフ week 表示

`06-chart-week.yaml`

- 設定の「サンプルデータ投入」で 7日分のデータ
- グラフタブを開く
- week が選択されていること
- 3段とも描画されていること（テストID で確認）

### 3.7 グラフ month/year 切替

`07-chart-month-year.yaml`

- month タブ → 月表示
- year タブ → 年表示
- 各タブ間でクラッシュしないこと

### 3.8 グラフタップでポップアップ

`08-chart-tap-popup.yaml`

- 上段の点をタップ → ポップアップに日付・気分・睡眠時間が表示
- 画面外タップで閉じる

### 3.9 CSV エクスポート

`09-csv-export.yaml`

- 設定 → 「CSV エクスポート」
- 標準シェアシートが起動すること（OS依存、`assertVisible: "Share"` 等で確認）
- キャンセルで閉じる

## 4. testID 命名規則

UI 側では `testID` を以下規則で付与:

| 種別 | パターン |
|------|---------|
| ボタン | `{action}-button` 例: `save-button` |
| 入力 | `{field}-input` 例: `memo-input` |
| リスト項目 | `record-item-{date}` 例: `record-item-2026-04-30` |
| タブ | `tab-{name}` 例: `tab-calendar`, `tab-week` |
| 動的要素 | `{type}-{id}-{role}` 例: `handle-0-start` |

## 5. CI 実行（任意）

GitHub Actions の macOS runner で iOS シミュレータ + Maestro:

```yaml
e2e:
  runs-on: macos-14
  steps:
    - uses: actions/checkout@v4
    - run: brew install maestro
    - run: npx expo prebuild --platform ios
    - run: xcodebuild ...   # ビルド
    - run: maestro test e2e/flows/
```

実装時間がかかるため、当面はローカル実行のみ（M7 で導入判断）。

## 6. 失敗時のデバッグ

- Maestro の `--debug-output` でスクリーンショット保存
- `--continuous` でファイル保存ごとに再実行（開発中）

```bash
maestro test --debug-output ./e2e-debug e2e/flows/02-record-sleep-split.yaml
```

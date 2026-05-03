# CI/CD・リリース運用

## 1. リポジトリ運用

### ブランチ戦略（GitHub Flow 軽量版）

`main` 一本 + 短命なフィーチャーブランチ。Git Flow のような develop/release/hotfix は採用しない（個人開発でオーバーエンジニアリング）。

#### ルール
- `main` は常にビルド可能・テスト緑
- 作業は必ずブランチを切る（main への直 push 禁止）
- PR 経由でマージ、CI 緑 + Self-review が条件
- マージは **Squash and Merge**（main の履歴を 1機能=1コミットに保つ）
- マージ後はブランチを削除（GitHub の自動削除を有効化）

#### 命名規則
| プレフィクス | 用途 |
|-------------|------|
| `feat/m{N}-{slug}` | 新機能（マイルストーン番号付き） |
| `fix/{slug}` | バグ修正 |
| `docs/{slug}` | ドキュメントのみ |
| `chore/{slug}` | 依存更新・設定・雑務 |
| `refactor/{slug}` | 動作不変のリファクタ |
| `test/{slug}` | テスト追加のみ |

例: `feat/m1-bootstrap`, `feat/m3-sleep-domain`, `fix/draft-restore-crash`

#### ブランチ粒度

**マイルストーンを丸ごと1ブランチにしない**。実装単位（半日〜2日、200〜500行差分）で分割する。

例: M3（睡眠タイムラインUI）の分割
```
feat/m3-sleep-domain          純粋関数 + 単体テスト
feat/m3-sleep-timeline-ruler  目盛りコンポーネント
feat/m3-sleep-interval-bar    帯 + ドラッグハンドル
feat/m3-sleep-integration     入力画面組込 + Repository
```

#### 例外パターン
| ケース | 対応 |
|--------|------|
| typo 修正・1行の自明な修正 | `main` 直 push 可（自分専用なので） |
| 設計書だけの大幅更新 | `docs/...` 単独ブランチ、コードと混ぜない |
| 設計と実装を同時に変更 | 1つの PR で両方更新可、PR 説明欄に対応設計書セクションを記載 |
| 緊急修正 | 通常の `fix/...` で対応（hotfix 特別扱いなし） |

#### やらないこと
- ❌ `develop` ブランチ（main と二重管理になる）
- ❌ `release/x.y.z` ブランチ（git tag で代替）
- ❌ 長寿命ブランチ（1週間以上は危険、こまめに main へマージ）

### コミット規約
[Conventional Commits](https://www.conventionalcommits.org/) を採用。

```
feat: 睡眠タイムライン UI を実装
fix: 区間重複時のクラッシュを修正
docs: 04-data-design.md の DDL 修正
test: chart-aggregation の境界テスト追加
chore: 依存パッケージ更新
```

### PR レビュー
- Self-review 必須（自分専用アプリでも）
- code-reviewer エージェントを起動して観点確認（global rules §code-review）

## 2. GitHub Actions（CI）

`.github/workflows/ci.yml` を以下構成で:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4   # 任意
```

### npm scripts（M1で設定）
```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx",
  "test": "jest",
  "format": "prettier --write ."
}
```

E2E（Maestro）は実機/エミュレータが必要なためローカル or 別ジョブ（macOS runner）。

## 3. EAS Build（配布）

実際の `eas.json` は [eas.json](../../eas.json) を参照。

### プロファイル
| プロファイル | 用途 |
|--------------|------|
| development | dev client、ローカル開発（現状未使用） |
| preview | iOS Simulator 用ビルド |
| production | TestFlight Internal Testing 配布用（自分・家族端末向け） |

### TestFlight Internal Testing による個人配布フロー

App Store には公開せず、**自分と家族の Apple ID にだけ TestFlight 経由で配布**する運用。
詳細手順は [docs/runbooks/testflight-setup.md](../runbooks/testflight-setup.md) を参照。

#### 毎回の更新コマンド

```powershell
npm run build:ios   # eas build -p ios --profile production（クラウドビルド ~15-30 分）
npm run submit:ios  # eas submit -p ios --latest（App Store Connect にアップロード）
# → TestFlight が内部テスター（自分・家族）の端末に自動通知
```

## 4. OTA 更新（EAS Update）

- JSコードのみの変更は OTA で配信可能（ネイティブモジュール変更時はストア再ビルド）
- v1.2 時点では未導入。将来必要になった場合に `expo-updates` を追加

## 5. バージョニング

- アプリバージョン: SemVer (`1.0.0` から開始)
- M7 完了で `1.0.0` リリース
- マイナーアップデート: 機能追加（タグ拡張など）
- パッチ: バグ修正

git タグ: `v1.0.0` の形式。

## 6. リリースチェックリスト（v1.0.0）

- [ ] 受け入れ基準（要件 §10）すべてチェック
- [ ] iOS/Android 両方で動作確認
- [ ] CSV エクスポートが両OSで動作
- [ ] ダーク/ライト両モードで表示崩れなし
- [ ] 1年分のダミーデータでパフォーマンス測定
- [ ] 設計書とコードの整合性確認
- [ ] README、ドキュメント最終更新
- [ ] git tag v1.0.0

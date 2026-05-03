# CLAUDE.md

> このファイルは Claude Code が起動時に自動で読み込む。プロジェクト固有の文脈・慣習・落とし穴をまとめる。
> グローバルルール (`~/.claude/rules/common/*`) と組み合わせて使う。

## プロジェクト概要

気分・睡眠時間帯・睡眠時間を記録し、過去の傾向を可視化する自分専用モバイルアプリ。

- **要件定義**: [docs/requirements/requirements.md](docs/requirements/requirements.md)
- **実装計画 (マイルストーン)**: [docs/design/06-implementation-plan.md](docs/design/06-implementation-plan.md)
- **進捗**: [README.md](README.md) の "ステータス" セクション

## 設計書のトリアージ

設計書は16本ある。タスクに応じて読む対象:

| やりたいこと | 主に見る設計書 |
|------------|---------------|
| 全体構成・技術スタック把握 | [01-architecture.md](docs/design/01-architecture.md) |
| 睡眠タイムライン UI 実装 | [02-sleep-timeline-ui.md](docs/design/02-sleep-timeline-ui.md) |
| グラフ画面実装 | [03-chart-panel.md](docs/design/03-chart-panel.md) |
| DB スキーマ・クエリ | [04-data-design.md](docs/design/04-data-design.md) |
| 画面遷移・ワイヤーフレーム | [05-screen-design.md](docs/design/05-screen-design.md) |
| マイルストーン分解 | [06-implementation-plan.md](docs/design/06-implementation-plan.md) |
| 配色・タイポ・UI 部品 | [08-design-system.md](docs/design/08-design-system.md) |
| エラー/ログの扱い | [09-error-logging.md](docs/design/09-error-logging.md) |
| E2E テスト | [10-e2e-scenarios.md](docs/design/10-e2e-scenarios.md) |
| データ保護・プライバシー | [11-security-privacy.md](docs/design/11-security-privacy.md) |
| ローカライズ | [12-i18n.md](docs/design/12-i18n.md) |
| ロードマップ・将来機能 | [13-future-roadmap.md](docs/design/13-future-roadmap.md) |
| v1.1 機能（タグ追加 / 軸表示 / 検索 / CSVインポート） | [16-v1.1-features.md](docs/design/16-v1.1-features.md) |
| v1.2 機能（服薬記録） | [17-v1.2-medications.md](docs/design/17-v1.2-medications.md) |
| **v1.3 機能（イベント項目）** | [18-v1.3-event-field.md](docs/design/18-v1.3-event-field.md) |

## 確定済みの主要技術判断

| 領域 | 採用 | 補足 |
|------|------|------|
| フレームワーク | Expo SDK 54 (managed) | dev client 化はしない |
| 言語 | TypeScript strict + `@/*` パスエイリアス | |
| ナビゲーション | expo-router 6 | ファイルベース |
| 状態管理 | Jotai | M2 から導入 |
| DB | expo-sqlite + Drizzle ORM | **暗号化なし** (§11) |
| グラフ | Victory Native XL + Skia | M5 から |
| フォーム | react-hook-form + zod | M2 から |
| テスト | Jest + jest-expo + RNTL + Maestro | |
| CI | GitHub Actions (typecheck + lint + test) | |

## 落とし穴 (Pitfalls)

実装中に踏みやすい点。ここを最初に確認すれば事故が減る。

### 1. 依存インストールは `legacy-peer-deps` 前提
- `.npmrc` で `legacy-peer-deps=true` を設定済み
- Expo の transitive dep（react-dom など）が peer 要求を厳しく出すため
- CI でも `npm ci --legacy-peer-deps` を使っている
- 新規パッケージ追加時は `npm install` がそのまま使える

### 2. Drizzle のマイグレーションは手動更新が必要
- `npx drizzle-kit generate` で `.sql` は生成される
- ただし `babel-plugin-inline-import` と Metro の相性問題で `.sql` 直 import は不可
- **新規マイグレーション追加時は [src/db/migrations/migrations.ts](src/db/migrations/migrations.ts) に SQL を template literal で貼り付ける**
- 手順はファイル冒頭のコメントに記載

### 3. SQLCipher は採用しない（戻さない）
- 健康データの暗号化は当初検討したが Expo Go 互換性のため撤回
- 詳細は [docs/design/11-security-privacy.md §2](docs/design/11-security-privacy.md)
- 将来 dev client 化する機会があれば再検討（v2.x ロードマップ）
- **`op-sqlite` や `op-sqlcipher` を提案しないこと**

### 4. SDK は Expo Go の SDK と一致させる
- 実機 Expo Go は SDK 54
- `expo@latest` は SDK 55+ に飛びうるので、依存追加は **`npx expo install <package>`** を使う（SDK 整列付き）
- バージョン整合チェック: `npx expo install --check`

### 5. iOS バックアップ除外は M7 で対応
- expo-file-system v19 で公開 API から外れた
- Android は `app.json` の `allowBackup=false` で対応済み
- iOS 側は M7（仕上げ）で expo-modules-core 経由のネイティブ呼び出しなど検討

### 6. Drizzle は内部テーブル `__drizzle_migrations` を作る
- ホーム画面の "DB テーブル数" 表示は要件テーブルだけカウント（`__drizzle_%` を除外）
- `sqlite_master` を集計する箇所は両方の prefix を除外する

## ブランチ戦略 (要約)

詳細: [docs/design/07-cicd-release.md §1](docs/design/07-cicd-release.md), [docs/design/15-github-management.md](docs/design/15-github-management.md)

- **GitHub Flow 軽量版**。`main` 一本 + 短命フィーチャーブランチ
- 命名: `feat/m{N}-{slug}` / `feat/v{X.Y}-{slug}` / `fix/{slug}` / `docs/{slug}` / `chore/{slug}`
- 1 PR の目安: **半日〜2日 / 200〜500行**
- マージは **Squash and Merge**
- マージ後は **必ず main に同期し直してから次ブランチを切る**
- **マージ済みブランチはローカル/リモート両方削除**（v1.0 リリース時に古い `feat/m5-line-charts` の再マージで主要修正が巻き戻る事故あり）

## バージョン更新の運用

機能追加で v1.x を切る際の必須手順:

1. `package.json` の `version` を更新
2. `app.json` の `expo.version` を同じ値に更新
3. README「ステータス」セクションを更新
4. main マージ後 `git tag -a vX.Y.Z` + `gh release create`

設定画面のバージョン表示は **`Constants.expoConfig?.version`** から取得（ハードコード禁止、v1.1 で導入）。1〜2 だけで自動反映される。

## よく使うコマンド

```bash
# 開発サーバー起動 (LAN がうまく行かないときは --tunnel)
npx expo start --tunnel --clear

# 依存追加（Expo SDK 整列）
npx expo install <package>

# 型・lint・テスト（CI と同じチェック）
npm run typecheck
npm run lint
npm test

# DB マイグレーション (.sql 生成)
npm run db:generate
# 生成後は src/db/migrations/migrations.ts に手動追記

# PR 作成（gh CLI、認証済み）
gh pr create --base main --head <branch> --title "..." --body "..."
```

## 開発フロー (Claude が実行する標準手順)

1. **タスク開始時**: `git fetch && git log HEAD..origin/main` でリモート状態確認
2. **新ブランチ**: `feat/m{N}-{slug}` で main から切る
3. **TDD**: 純粋関数→ドメイン→DB→UI の順、テスト先行
4. **逐次確認**: `npm run typecheck && npm run lint && npm test`
5. **コミット**: Conventional Commits（feat/fix/docs/chore/refactor/test）
6. **PR 作成**: テンプレート（`.github/pull_request_template.md`）を満たす
7. **マージ後**: ブランチ削除、main pull、次ブランチへ

### 不具合修正は実機検証を待ってから PR

`fix/*` ブランチや「修正してほしい」「治して」等の修正依頼で対応した場合、
コミット & push までは即座に実行してよいが、**`gh pr create` は実機検証 OK の連絡を待ってから**実行する。

- 修正の効果は実機（iPhone / iPad）で確認しないと分からない（特に UI / レイアウト系）
- 先に PR を立ててしまうと、追加修正が必要になった場合に PR を更新する手戻りが発生する
- push 後にユーザーへ「実機で確認お願いします」と伝え、確認待ちにする
- 追加要望があれば同じブランチに追加修正コミット → 再度確認待ち
- 確認 OK の連絡を受けてから PR 作成

**例外:**
- ユーザーが明示的に「PR 作って」と言った場合
- 機能追加（`feat/*`）は従来通り即 PR 作成 OK（実機未確認なら PR 説明欄に明記）

## このファイルの保守方針

- 新しい落とし穴に遭遇したら **追記する**（今後の自分のために）
- マイルストーン完了時に進捗を更新（最新進捗は README.md でも管理）
- 設計書と矛盾する内容は書かない（設計書が source of truth、ここは index）
- 長くなりすぎたらセクションを設計書に切り出す

# GitHub での管理運用

## 1. リポジトリ運用方針

### 公開設定
- **Private リポジトリ**で運用（自分専用、ただし公開しても困らないようにする）
- データは一切コミットしない（DBファイル、ログ、CSV出力は `.gitignore` で除外）

### `.gitignore` 追記項目（M1で確認）
```
# Expo
.expo/
node_modules/
dist/
*.ipa
*.apk

# 個人データ（誤コミット防止）
*.db
*.sqlite
e2e-debug/

# シークレット
.env
.env.local
eas-secrets.json
```

## 2. ドキュメント管理戦略

### 配置
- 要件定義書: `docs/requirements/requirements.md`
- 設計書: `docs/design/01〜15.md`
- 受け入れ基準チェックリスト: `docs/acceptance.md`（M1で作成）

### 更新フロー
- 設計と実装に乖離が出たら **設計書を更新する PR** をコードと別に出す（または同PR内で `docs/` を更新）
- M ごとの DoD に「設計書との差分確認」を含む（§06）

### バージョニング
- ドキュメントは `main` ブランチのものが常に最新
- リリース時は git tag（v1.0.0 等）で固定スナップショット

## 3. GitHub Issues 運用

### ラベル
| ラベル | 色 | 用途 |
|--------|-----|------|
| `bug` | 赤 | 不具合 |
| `enhancement` | 青 | 機能追加・改善 |
| `docs` | 緑 | ドキュメント |
| `chore` | 灰 | 雑務・依存更新 |
| `M1`〜`M7` | 紫 | マイルストーン |
| `priority:high/mid/low` | 黄 | 優先度 |
| `blocked` | 黒 | ブロック中 |
| `good-first-issue` | 桃 | （将来公開時用） |

### テンプレート
`.github/ISSUE_TEMPLATE/` に bug.md / feature.md を配置済み（このセッションで作成）。

### Issue 起票タイミング
- 開発中に気づいた TODO（その場で対応しないもの）
- バグ報告
- 将来ロードマップ §13 の項目

## 4. GitHub Projects（Kanban）

### ボード構成（推奨）
```
Backlog → To Do → In Progress → In Review → Done
```

### カラム自動化
- PR Open → In Review
- PR Merged → Done
- Issue Close → Done

### マイルストーン連動
- GitHub Milestones を M1〜M7 で作成
- 各 Issue/PR を該当マイルストーンに紐付け

## 5. PR 運用

### テンプレート
`.github/pull_request_template.md` 配置済み。

### マージ戦略
- **Squash and Merge** を採用（main の履歴がきれい）
- マージ前に CI（typecheck, lint, test）が通ること
- マージ後はブランチ自動削除（Settings → General → "Automatically delete head branches"）

### PR サイズの目安
- **1 PR = 200〜500行の差分** を目標
- **半日〜2日** で完成する単位
- **1機能/1観点**（UI追加 + バグ修正は別PR、混ぜない）
- 巨大化しそうなら、先にレビュー可能な単位に分割する

### Draft PR
- 作業途中で意見を求めたい場合は Draft で作成
- レビュー準備ができたら "Ready for review"

> ブランチ戦略の詳細（命名規則・粒度ルール・例外）は §07 を参照。

## 6. ブランチ保護（Settings → Branches）

`main` ブランチを保護:
- [x] Require a pull request before merging
- [x] Require status checks to pass（CI）
- [x] Require branches to be up to date before merging
- [x] Include administrators（自分も例外にしない）
- [ ] Require approvals（自分専用なら不要、レビュアー入れるならON）

## 7. リリース運用（GitHub Releases）

各バージョンで Release 作成:

```
Tag: v1.0.0
Title: v1.0.0 — 初回リリース
Body:
## 機能
- 気分5段階記録
- 睡眠時間帯のドラッグ入力
- 3段グラフ（week/month/year）
- CSV エクスポート

## 変更点
（Squash コミットメッセージから自動生成、または手書き）
```

EAS Build の成果物（IPA/APK）を Asset として添付しても良い（Private なので問題なし）。

## 8. Secrets 管理

GitHub Settings → Secrets and variables → Actions:

| Secret | 用途 |
|--------|------|
| `EXPO_TOKEN` | EAS Build を CI から実行する場合 |
| `SENTRY_DSN` | Sentry を導入する場合（今回は使わない） |

## 9. README の役割

トップ `README.md` は以下を含む（このセッションで更新済み）:
- プロジェクト概要
- ステータス
- ドキュメント目次（各設計書へのリンク）
- 技術スタック
- セットアップ手順

将来公開する際は **スクリーンショット**、**ライセンス**、**コントリビュート方法** も追加。

## 10. ドキュメントとコードの同期Tips

- PR説明欄に「対応する設計書セクション: §0X.Y」を必ず書く
- 実装中に設計と乖離したら、その PR で `docs/` も同時に更新
- 大きな設計変更は別PR（設計書のみ）で先にレビュー → 承認後に実装PR

## 11. 自動化の余地

将来的に追加検討:
- **Dependabot**: 依存パッケージの自動アップデートPR（`.github/dependabot.yml`）
- **CodeQL**: GitHub の標準セキュリティスキャン
- **Pre-commit hooks**: husky + lint-staged で commit 前 lint/typecheck

## 12. 最小スタートセット（M1 着手時にやること）

- [ ] `.gitignore` を Expo 用に更新
- [ ] README を整える（このセッションで完了）
- [ ] PR / Issue テンプレート配置（このセッションで完了）
- [ ] GitHub Milestones (M1〜M7) を作成
- [ ] ラベル群を作成
- [ ] `main` ブランチ保護を有効化
- [ ] CI ワークフロー（`.github/workflows/ci.yml`）配置（§07）

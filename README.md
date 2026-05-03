# mood-and-sleep-log

気分・睡眠時間帯・睡眠時間を記録し、過去の傾向を可視化するモバイルアプリ（自分専用）。

## ステータス

**v1.3 完了**。

### v1.3 機能（実装済み）
- **イベント項目**: 記録入力画面のメモ直前に「📅 イベント（任意）」テキストフィールドを追加（200 文字以内）。ホームリスト表示・キーワード検索対象・グラフポップアップ・CSV 入出力に統合
- **日付ラベルに西暦年**: ホームリスト通常行を `YYYY/M/D(曜)` 形式に、グラフ期間ナビ (week/month) を `YYYY/M/D(曜) 〜 YYYY/M/D(曜)` 形式に
- **iPad カレンダー修正**: 前月/翌月ボタンが iPad で表示されない問題を修正（テキスト矢印に置換）
- DB スキーマに `event` カラム追加（既存記録は null）
- CSV を 8 列形式に拡張。v1.0/v1.1 (5 列)、v1.2 (7 列) のインポートも引き続き可能（後方互換）

詳細: [docs/design/18-v1.3-event-field.md](docs/design/18-v1.3-event-field.md)

### v1.2 機能（実装済み）
- 記録入力画面に「睡眠導入剤」（9 択）と「頓服薬」（4 択）のラジオボタンを追加
- 既定値はどちらも「なし」
- DB スキーマに `sleep_aid` / `prn_medication` カラム追加（既存記録は null = 「なし」）
- CSV エクスポートに 2 列追加。v1.0 / v1.1 で出力した 5 列 CSV のインポートも引き続き可能（後方互換）

詳細: [docs/design/17-v1.2-medications.md](docs/design/17-v1.2-medications.md)

### v1.1 機能（実装済み）
- 感情タグ追加（11 個、合計 41）
- グラフ Y 軸グリッド + ラベル明示
- リスト検索（キーワード + タグ、ハイライト表示）
- CSV インポート（既存データ全削除＋取込）
- 一覧/カレンダーで気分スコア数値を絵文字の右に併記
- リスト 3 行レイアウト

過去リリース:
- [v1.0.0](https://github.com/wednesdaydeveloper/mood-and-sleep-log/releases/tag/v1.0.0)
- [v1.2.0](https://github.com/wednesdaydeveloper/mood-and-sleep-log/releases/tag/v1.2.0)
- [v1.2.1](https://github.com/wednesdaydeveloper/mood-and-sleep-log/releases/tag/v1.2.1)
- [v1.3.0](https://github.com/wednesdaydeveloper/mood-and-sleep-log/releases/tag/v1.3.0)

v1.1 詳細: [docs/design/16-v1.1-features.md](docs/design/16-v1.1-features.md)

### v1.0 完了マイルストーン
- M1 ✅ プロジェクト雛形 + DB + テスト/CI 基盤
- M2 ✅ 気分・タグ・メモの記録 + ホーム一覧表示
- M3 ✅ 睡眠タイムライン UI（ドラッグ・タップ・長押し）
- M4 ✅ 自動下書き保存 + カレンダー/リスト切替
- M5 ✅ グラフ week/month（折れ線 + 縦帯）
- M6 ✅ year ビュー（月平均）+ CSV エクスポート
- M7 ✅ ポップアップ・期間スクロール・テーマ・a11y・E2E

受け入れ基準: [docs/acceptance.md](docs/acceptance.md)

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [要件定義書](docs/requirements/requirements.md) | 機能要件・非機能要件・受け入れ基準 |
| [01 アーキテクチャ](docs/design/01-architecture.md) | 技術スタック、レイヤー構成 |
| [02 睡眠タイムラインUI](docs/design/02-sleep-timeline-ui.md) | ドラッグ入力UIの詳細 |
| [03 グラフパネル](docs/design/03-chart-panel.md) | 3段グラフの設計 |
| [04 データ設計](docs/design/04-data-design.md) | DBスキーマ、CSV仕様 |
| [05 画面設計](docs/design/05-screen-design.md) | ワイヤーフレーム、画面遷移 |
| [06 実装計画](docs/design/06-implementation-plan.md) | マイルストーン M1〜M7 |
| [07 CI/CD・リリース](docs/design/07-cicd-release.md) | GitHub Actions、EAS、配布 |
| [08 デザインシステム](docs/design/08-design-system.md) | トークン、タイポ、コンポーネント |
| [09 エラー処理・ログ](docs/design/09-error-logging.md) | クラッシュ対応、ログ設計 |
| [10 E2Eシナリオ](docs/design/10-e2e-scenarios.md) | Maestro テストケース |
| [11 セキュリティ・プライバシー](docs/design/11-security-privacy.md) | データ保護方針 |
| [12 i18n](docs/design/12-i18n.md) | ローカライズ戦略 |
| [13 将来ロードマップ](docs/design/13-future-roadmap.md) | スコープ外機能の見通し |
| [14 オンボーディング](docs/design/14-onboarding.md) | 初回起動チュートリアル |
| [15 GitHub管理運用](docs/design/15-github-management.md) | リポジトリ・Issue・PR・リリース運用 |
| [16 v1.1 追加機能](docs/design/16-v1.1-features.md) | タグ追加 / 軸表示 / 検索 / CSVインポートの設計 |
| [17 v1.2 服薬記録](docs/design/17-v1.2-medications.md) | 睡眠導入剤・頓服薬のラジオボタン追加の設計 |
| [18 v1.3 イベント項目](docs/design/18-v1.3-event-field.md) | イベント TextField 追加（DB / 検索 / CSV / コンバータ）の設計 |

## 技術スタック

Expo (managed) + TypeScript + expo-router + Jotai + Drizzle ORM + expo-sqlite + Victory Native XL + Skia

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# Expo の推奨バージョンに整列（初回のみ）
npx expo install --fix

# 起動
npx expo start
```

Expo Go アプリ（iOS/Android）または iOS Simulator / Android Emulator で動作確認。

詳細は [01-architecture.md](docs/design/01-architecture.md) を参照。

## データ移行ツール

過去に Excel で記録していた気分・睡眠データを CSV インポート形式に変換する一回限りのスクリプト: [convert/README.md](convert/README.md)

## 配布（TestFlight）

App Store には公開せず、TestFlight Internal Testing で自分・家族の Apple ID にだけ配布する運用。
セットアップ・更新手順: [docs/runbooks/testflight-setup.md](docs/runbooks/testflight-setup.md)

```powershell
npm run build:ios   # クラウドビルド
npm run submit:ios  # App Store Connect にアップロード → TestFlight 自動通知
```

## ライセンス

Private（自分専用、公開予定なし）。

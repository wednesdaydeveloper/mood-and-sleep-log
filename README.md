# mood-and-sleep-log

気分・睡眠時間帯・睡眠時間を記録し、過去の傾向を可視化するモバイルアプリ（自分専用）。

## ステータス

**v1.1 完了、v1.2（服薬記録）実装中**。

### v1.2 計画
- 記録入力画面に「睡眠導入剤」「頓服薬」のラジオボタンを追加
- CSV エクスポート/インポートにも反映

詳細: [docs/design/17-v1.2-medications.md](docs/design/17-v1.2-medications.md)

### v1.1 機能（実装済み）
- 感情タグ追加（11 個、合計 41）
- グラフ Y 軸グリッド + ラベル明示
- リスト検索（キーワード + タグ、ハイライト表示）
- CSV インポート（既存データ全削除＋取込）
- 一覧/カレンダーで気分スコア数値を絵文字の右に併記
- リスト 3 行レイアウト

過去リリース: [v1.0.0](https://github.com/wednesdaydeveloper/mood-and-sleep-log/releases/tag/v1.0.0)
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

## ライセンス

Private（自分専用、公開予定なし）。

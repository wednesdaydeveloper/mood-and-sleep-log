# TestFlight Internal Testing による個人配布手順

App Store には公開せず、**自分と家族の Apple ID に TestFlight 経由で配布**するための初回セットアップと運用手順。

## 前提

- Apple Developer Program 契約済み（$99/年）
- Bundle ID: `com.wednesdaydeveloper.moodandsleeplog`
- Expo SDK 54 (managed workflow) のまま運用（dev client 化はしない）

## 初回セットアップ（一度だけ）

### 1. Expo アカウント

```powershell
eas login
```

未登録なら無料で作成（Expo の Web から。GitHub OAuth 可）。

### 2. プロジェクトを EAS にリンク

```powershell
eas init
```

- Expo プロジェクト ID が `app.json` に書き込まれる（コミット OK）
- 既に `slug: "mood-and-sleep-log"` が設定されているので、対話で「このプロジェクトを使う」を選択

### 3. 初回 iOS ビルド

```powershell
npm run build:ios
```

初回のみ対話で以下を聞かれる:

| 質問 | 回答 |
|------|------|
| Apple ID | あなたの Apple Developer アカウント |
| App-specific password | App Store Connect の設定で生成（推奨）または通常パスワード + 2FA |
| Generate a new Apple Distribution Certificate? | Yes |
| Generate a new Apple Provisioning Profile? | Yes |
| Bundle ID をレジストレーションする？ | Yes（自動で Developer Portal に登録） |

**EAS が裏で自動的にやってくれること:**
- Apple Developer Portal に App ID 登録
- Distribution 証明書の生成・管理
- Provisioning Profile の生成・管理
- ビルド番号の自動インクリメント

ビルドはクラウド (Expo のサーバ) で実行される。15〜30 分かかる。完了すると IPA のダウンロード URL が表示される（手動アップロードする場合に使う、通常は次の `submit` で自動アップロード）。

### 4. App Store Connect に App を作成

初回ビルド後、`eas submit` を実行すると App Store Connect 側のアプリが未作成だと失敗するため、先に作成する。

1. https://appstoreconnect.apple.com にログイン
2. 「マイ App」→「+」→「新規 App」
3. 入力:
   - プラットフォーム: iOS
   - 名前: 気分・睡眠ログ
   - プライマリ言語: 日本語
   - Bundle ID: `com.wednesdaydeveloper.moodandsleeplog`（プルダウンから選択、EAS 初回ビルドで自動登録済みのはず）
   - SKU: 任意の一意文字列（例: `mood-sleep-log-001`）
   - ユーザーアクセス: 「フルアクセス」

### 5. 初回アップロード

```powershell
npm run submit:ios
```

EAS が App Store Connect に直接 IPA をアップロード。完了まで 5〜10 分。

アップロード後、App Store Connect の TestFlight タブに「処理中」のビルドが表示される。Apple 側のバイナリ処理に追加で 10〜30 分かかる。

### 6. 内部テスター招待

1. App Store Connect → アプリ → **TestFlight** タブ
2. 左メニュー「**内部テスト**」→ 「+」でグループ作成（例: 「家族」）
3. 「テスター」タブで「+」→ メールアドレスで招待:
   - 自分の Apple ID
   - 妻の Apple ID
4. **重要:** 内部テスターは App Store Connect の「ユーザーとアクセス」にも追加が必要
   - 「ユーザーとアクセス」→「+」→ 役割: **App Manager** または **Developer**
   - 妻の Apple ID を追加
5. 招待メールが届くので、招待先で TestFlight アプリ（App Store からインストール）を開いてアクセプト

### 7. ビルドをグループに追加

処理が完了したビルドを TestFlight 内部テストグループに紐付け:

1. TestFlight → 内部テスト → 作成したグループを選択
2. 「ビルド」タブで「+」→ 該当ビルドを追加
3. 即座にテスター全員に通知される

→ 妻の TestFlight アプリに通知が来て、1 タップでインストール完了

## 毎回の更新フロー

新機能追加・バグ修正後:

```powershell
# 1. ビルド（クラウド、~15-30 分）
npm run build:ios

# 2. App Store Connect にアップロード（~5-10 分）
npm run submit:ios

# 3. App Store Connect で処理待ち（~10-30 分）
#    完了するとテスターに自動通知される
```

ビルド番号は `eas.json` の `production.autoIncrement` で自動採番されるので手動操作不要。

## 期限と再ビルドのタイミング

| 項目 | 期限 |
|------|------|
| TestFlight ビルド | **90 日**（期限切れ後はテスターがインストールできなくなる） |
| Distribution 証明書 | 1 年 |
| Provisioning Profile | 1 年 |

**実用上は 60〜80 日に 1 回**は新規ビルドを上げて TestFlight の有効期限を更新する運用がおすすめ。
コードに変更がなくてもビルド番号だけ上げて再 submit すれば OK。

## トラブルシューティング

### Bundle ID エラー
EAS が「Bundle ID が既に他のチームで使用されている」エラーを出す場合、Apple Developer Portal で衝突を解消する。`com.wednesdaydeveloper.moodandsleeplog` は固有なので新規なら問題なし。

### ITSAppUsesNonExemptEncryption の確認
`app.json` の `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` で「暗号化を使っていない」と申告済み。
HTTPS 通信や標準 SQLCipher 暗号化を導入する場合は再検討要。

### iPad 表示
`ios.supportsTablet: true` を設定済み。iPad では iPhone と同じレイアウトが拡大表示される（縦固定のため）。
iPad 専用レイアウトは現状なし（個人利用としては十分）。

### バージョン番号が増えない
`appVersionSource: "remote"` を設定しているため、ビルド番号は EAS サーバ側で管理。
`package.json` / `app.json` の `version`（マーケティングバージョン）は手動で上げる必要あり（リリース時のみ）。

## 参考

- [EAS Build 公式](https://docs.expo.dev/build/introduction/)
- [TestFlight 内部テスト](https://developer.apple.com/jp/testflight/)
- 設計: [07-cicd-release.md](../design/07-cicd-release.md)

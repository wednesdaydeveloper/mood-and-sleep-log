# E2E テスト

[Maestro](https://maestro.mobile.dev/) による E2E フロー。詳細は [docs/design/10-e2e-scenarios.md](../docs/design/10-e2e-scenarios.md) を参照。

## 配置

```
e2e/
├── flows/         # 各シナリオの YAML
├── reset.yaml     # 共通: アプリ状態リセット
└── README.md
```

## ローカル実行

```bash
# Maestro CLI のインストール（未導入の場合）
# https://maestro.mobile.dev/getting-started/installing-maestro

# シミュレータ/エミュレータを起動した状態で
maestro test e2e/flows/

# 単一シナリオ
maestro test e2e/flows/01-record-create-basic.yaml --debug-output ./e2e-debug
```

## シナリオ実装状況

設計書 §10 で計画した 9 シナリオは、各機能マイルストーン (M2〜M6) で順次追加。M1 時点では雛形のみ。

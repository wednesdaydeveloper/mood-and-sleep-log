# エラー処理・ログ設計

## 1. エラー方針

### 原則
- **エラーを握り潰さない**（global rules §coding-style）
- ユーザー向けには分かりやすい日本語メッセージ
- 内部にはスタックトレース・コンテキストを残す
- 復旧可能なエラーは復旧、不可能なら明確に伝えて終了

### 分類

| 種別 | 例 | 対応 |
|------|-----|------|
| バリデーションエラー | 区間重複、必須未入力 | 入力UIにインライン表示、保存阻止 |
| ビジネスルール違反 | 終了 < 開始時刻 | 同上 |
| データ不整合 | DB の壊れた行 | エラー画面、再起動誘導、ログ詳細記録 |
| 外部依存エラー | シェアシート起動失敗 | トーストで通知、再試行 |
| プログラミングバグ | 想定外の null | クラッシュ、後述のグローバルハンドラで捕捉 |

## 2. エラー型

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>,
    public cause?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("VALIDATION", message, context);
  }
}

export class DataError extends AppError {
  constructor(message: string, cause?: unknown, context?: Record<string, unknown>) {
    super("DATA", message, context, cause);
  }
}
```

`code` で機械的判定、`message` でユーザー向け、`context` でログ用補足。

## 3. ローカルログ

### 構造化ログ

```typescript
// src/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  ts: number;
  level: LogLevel;
  module: string;
  message: string;
  context?: Record<string, unknown>;
};

class Logger {
  log(level: LogLevel, module: string, message: string, context?: object) {
    const entry: LogEntry = { ts: Date.now(), level, module, message, context };
    if (__DEV__) console[level === "debug" ? "log" : level](entry);
    void this.persist(entry);  // 非同期で SQLite or ファイルに追記
  }
}

export const logger = new Logger();
```

### ログ保存

- SQLite に `app_log` テーブル（または `expo-file-system` でJSON Lines）
- **保持期間: 7日**（`logs.cleanupOlderThan` を起動時実行）
- レベル: 開発時 debug 以上、本番 info 以上

### ログ閲覧

設定画面に「ログを表示」ボタン（任意、開発時のみ表示）。
バグ報告時にコピー可能。

## 4. グローバルクラッシュハンドラ

```typescript
// app/_layout.tsx
import { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

// expo-router の ErrorBoundary が自動で機能、追加で:
import * as Updates from "expo-updates";

if (!__DEV__) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.log("error", "global", error.message, { stack: error.stack, isFatal });
    if (isFatal) {
      // ユーザーに「予期しないエラーが発生しました。再起動します」を表示
      Updates.reloadAsync();
    }
  });
}
```

`expo-router` の `+error.tsx` でルート単位のエラー画面も用意。

## 5. データ層のエラー処理

### Repository

```typescript
async function upsert(input: SaveRecordInput): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // ...
    });
  } catch (e) {
    logger.log("error", "daily-record-repo", "upsert failed", { input, error: String(e) });
    throw new DataError("記録の保存に失敗しました", e);
  }
}
```

### UI

```typescript
const onSubmit = async (data) => {
  try {
    await dailyRecordRepo.upsert(data);
    router.back();
  } catch (e) {
    if (e instanceof ValidationError) {
      setFieldErrors(e.context);
    } else if (e instanceof DataError) {
      toast.error(e.message);
    } else {
      toast.error("予期しないエラーが発生しました");
      logger.log("error", "record-screen", "submit failed", { error: String(e) });
    }
  }
};
```

## 6. 想定エラーシナリオと挙動

| シナリオ | UI挙動 | ログ |
|---------|--------|------|
| 区間重複でドラッグ | ハンドルが境界で停止 | log なし（仕様通り） |
| 保存時に zod 失敗 | フィールドにエラーメッセージ | warn |
| DB マイグレーション失敗 | 起動時エラー画面 | error + 詳細 |
| CSV エクスポート失敗 | トースト「エクスポートに失敗しました」 | error |
| 下書き JSON パース失敗 | 下書きを破棄、空フォーム表示 | warn |
| グラフ描画でランタイム例外 | エラー画面、戻るボタンで復帰 | error |

## 7. クラッシュレポート（任意）

自分専用なのでクラウドサービス（Sentry等）は不要だが、希望なら:
- Sentry Free tier（5k errors/month）で自動収集可能
- 個人情報を含まないログだけ送信（メモ本文は除外）
- 設定画面で「クラッシュレポート送信」をユーザーがON/OFF

今回スコープでは **オフ** で進める。

## 8. テスト

- **エラーケースのテストを忘れない**:
  - Repository は失敗系（NULL violation、UNIQUE違反）もテスト
  - UI は zod スキーマ違反の表示をテスト
  - グローバルハンドラはモックで発火確認

カバレッジに「エラーパス」を含める意識（happy path だけにならないよう）。

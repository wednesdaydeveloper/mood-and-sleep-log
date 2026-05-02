# データ設計書

> 関連: 要件定義 §6、アーキテクチャ §3

## 1. 採用技術

- **DB**: SQLite（端末ローカル、`expo-sqlite`、**plain（暗号化なし）**）
- **ORM**: Drizzle ORM (`drizzle-orm/expo-sqlite`)
- **マイグレーション**: drizzle-kit（`drizzle.config.ts` で生成、起動時に自動適用）
- **ID生成**: `expo-crypto` の randomUUID()
- **バックアップ**: クラウドバックアップから除外（§11）

> **DB 暗号化について**: 当初 SQLCipher 採用を計画したが、Expo Go 互換のため不採用。詳細は §11 を参照。

## 2. テーブル定義（Drizzle スキーマ）

`src/db/schema.ts`

```typescript
import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const dailyRecord = sqliteTable("daily_record", {
  id: text("id").primaryKey(),                   // UUID
  date: text("date").notNull(),                  // ISO yyyy-MM-dd
  moodScore: integer("mood_score").notNull(),    // -2〜+2
  moodTags: text("mood_tags").notNull(),         // JSON配列文字列 ["不安","疲れ"]
  memo: text("memo"),                            // nullable
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  dateUnique: uniqueIndex("idx_daily_record_date").on(t.date),
}));

export const sleepInterval = sqliteTable("sleep_interval", {
  id: text("id").primaryKey(),
  recordId: text("record_id")
    .notNull()
    .references(() => dailyRecord.id, { onDelete: "cascade" }),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),  // UTC unix秒
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  byRecord: index("idx_sleep_interval_record").on(t.recordId),
  byStart: index("idx_sleep_interval_start").on(t.startAt),
}));

// v1.1 で機能撤去。テーブル定義は互換性のため残るが
// アプリから読み書きされない（既存ユーザーのデータ破壊回避）。
export const draftRecord = sqliteTable("draft_record", {
  date: text("date").primaryKey(),               // ISO yyyy-MM-dd
  payload: text("payload").notNull(),            // JSON {moodScore, moodTags, memo, intervals[]}
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### 設計判断

| 判断 | 根拠 |
|------|------|
| `moodTags` を JSON 文字列で格納 | 中間テーブル不要、SQLite はJSON1拡張あり、検索要件なし |
| `date` を TEXT (ISO) | SQLite のDATE型なし、ISO文字列でソート可、可読性高い |
| `startAt` `endAt` を unix秒（INTEGER） | タイムゾーン非依存、比較・差分計算が高速 |
| `onDelete: cascade` | DailyRecord 削除時に SleepInterval も自動削除 |
| `draftRecord.date` を PK | 1日1下書き、INSERT OR REPLACE で UPSERT 簡潔 |
| `mood_score` を INTEGER | -2〜+2 を直接格納（オフセット不要） |

## 3. インデックス戦略

| インデックス | 用途 |
|--------------|------|
| `idx_daily_record_date` (UNIQUE) | 一覧表示・グラフ範囲取得・date重複防止 |
| `idx_sleep_interval_record` | 詳細画面・編集時に区間取得 |
| `idx_sleep_interval_start` | グラフ範囲のJOIN（補助） |

## 4. マイグレーション運用

```
src/db/migrations/
├── 0000_init.sql          # 初回スキーマ
└── meta/
    └── _journal.json
```

- 開発時: `drizzle-kit generate` でスキーマ差分から生成
- 起動時: `drizzle-orm/expo-sqlite/migrator` の `migrate()` で適用
- 本番ユーザーは自分のみだが、機能追加でスキーマ変更する場合に備えて運用フローを確立

## 5. 主要クエリ

### 5.1 一覧取得（カレンダー / リスト）

```typescript
// 表示月の全レコードを取得
db.select().from(dailyRecord)
  .where(and(
    gte(dailyRecord.date, "2026-04-01"),
    lte(dailyRecord.date, "2026-04-30")
  ))
  .orderBy(desc(dailyRecord.date));
```

### 5.2 グラフ用範囲取得（week/month）

```typescript
// レコード + 区間を JOIN（Drizzle の relations 機能で1クエリ化）
db.query.dailyRecord.findMany({
  where: between(dailyRecord.date, fromIso, toIso),
  with: { intervals: true },
  orderBy: dailyRecord.date,
});
```

### 5.3 グラフ用 year 月集約

集約はアプリ側（ドメイン層）で実施。要件規模（〜365件）ではアプリ側のほうが保守しやすい。

```typescript
// 1年分を date 昇順で取得 → domain/chart-aggregation.ts の aggregateForYear に渡す
```

将来パフォーマンス問題が出たら以下のSQL集約に切替:

```sql
SELECT
  strftime('%Y-%m', date) AS month,
  AVG(mood_score) AS avg_mood,
  AVG(total_minutes) AS avg_sleep_min
FROM (
  SELECT
    dr.date,
    dr.mood_score,
    COALESCE(SUM((si.end_at - si.start_at) / 60), 0) AS total_minutes
  FROM daily_record dr
  LEFT JOIN sleep_interval si ON si.record_id = dr.id
  WHERE dr.date BETWEEN ? AND ?
  GROUP BY dr.id
)
GROUP BY month
ORDER BY month;
```

### 5.4 自動下書き UPSERT

```typescript
db.insert(draftRecord)
  .values({ date, payload, updatedAt: new Date() })
  .onConflictDoUpdate({
    target: draftRecord.date,
    set: { payload, updatedAt: new Date() },
  });
```

### 5.5 古い下書きのクリーンアップ（7日経過破棄）

アプリ起動時に1度実行:

```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
db.delete(draftRecord).where(lt(draftRecord.updatedAt, sevenDaysAgo));
```

## 6. リポジトリ層 API

```typescript
// db/repositories/daily-record.ts
export const dailyRecordRepo = {
  findByDate(date: string): Promise<DailyRecordWithIntervals | null>,
  list(from: string, to: string): Promise<DailyRecordWithIntervals[]>,
  upsert(input: SaveRecordInput): Promise<void>,   // トランザクション内で intervals も同期
  delete(id: string): Promise<void>,
};

export const draftRepo = {
  get(date: string): Promise<DraftRecord | null>,
  save(date: string, payload: object): Promise<void>,
  remove(date: string): Promise<void>,
  cleanupOlderThan(date: Date): Promise<void>,
};
```

`upsert` は **トランザクション** で `daily_record` と `sleep_interval` を同期（intervals は delete-then-insert）。

## 7. CSVエクスポート仕様

> 要件 §4.4 を確定形に詳細化

### フォーマット
- 文字コード: **UTF-8 BOM 付き**（Excel 互換）
- 改行: LF（CSV標準）
- 区切り: カンマ `,`
- クォート: ダブルクォート `"`、フィールド内の `"` は `""` にエスケープ（RFC 4180）

### 列定義

| 列 | 型 | 例 |
|----|-----|-----|
| date | ISO yyyy-MM-dd | 2026-04-30 |
| moodScore | INTEGER | -1 |
| moodTags | quoted | `"不安,疲れ,無力感"` |
| memo | quoted | `"今日は早めに寝た"` |
| sleepIntervals | quoted | `"23:00-02:00,03:30-07:00"` |

### 出力例

```csv
date,moodScore,moodTags,memo,sleepIntervals
2026-04-25,0,"疲れ","",""
2026-04-26,1,"楽しい,感謝","友人と食事","23:30-07:30"
2026-04-29,-1,"不安,鬱","眠りが浅かった","23:00-02:00,03:30-07:00"
```

### 実装

```typescript
// domain/csv.ts
export function toCsv(records: DailyRecordWithIntervals[]): string {
  const header = "date,moodScore,moodTags,memo,sleepIntervals";
  const rows = records.map(r => [
    r.date,
    String(r.moodScore),
    quote(r.moodTags.join(",")),
    quote(r.memo ?? ""),
    quote(r.intervals.map(i =>
      `${formatHHmm(i.startAt)}-${formatHHmm(i.endAt)}`
    ).join(",")),
  ].join(","));
  return "﻿" + [header, ...rows].join("\n");
}

function quote(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}
```

シェアシート連携は `expo-sharing` の `shareAsync()` で実現（ファイルは `expo-file-system` で `cacheDirectory` に書き出し）。

## 8. データ容量の見積もり

| 項目 | 見積 |
|------|------|
| DailyRecord 1件 | 〜200B（タグ・メモ込み） |
| SleepInterval 1件 | 〜80B |
| 1日平均サイズ | 〜400B（区間2件想定） |
| 5年分 | 〜730 KB |

→ SQLite で問題なし、何年でも端末内で動作可能。

## 9. テスト戦略

- **Repository ユニット/結合**: in-memory SQLite を使った Drizzle テスト（`@op-engineering/op-sqlite` を使えば node でも動くが、Expo 互換性確認のため Jest 環境で expo-sqlite を mock）
- **CSV シリアライザ**: 純粋関数として完全にユニットテスト（クォート、エスケープ、空値、特殊文字）
- **マイグレーション**: 各バージョンの DDL 実行 → CRUD が動作するスモークテスト

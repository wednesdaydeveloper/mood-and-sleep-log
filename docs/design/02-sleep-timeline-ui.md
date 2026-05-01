# 詳細設計: 睡眠タイムライン入力UI

> 対象機能: 要件定義 §FR-1.3
> 関連: §6 データモデル（SleepInterval）、§FR-3 グラフ下段（同じ時刻レンジを共有）

## 1. 機能要件サマリ

- 横軸タイムライン上で睡眠区間（開始〜終了）をドラッグ選択
- 横軸レンジ：**21:00 〜 翌 11:00 固定**（14時間）
- 粒度：**10分単位**（スナップ）
- **分割睡眠対応**：1日に複数区間（重複不可）
- タップで新規区間追加、長押しで区間削除
- 合計睡眠時間は自動計算

## 2. 画面レイアウト（モバイル縦持ち想定）

```
┌─────────────────────────────────────┐
│ 睡眠時間帯                           │
│ 合計: 7時間20分                      │
├─────────────────────────────────────┤
│                                     │
│  21  23  01  03  05  07  09  11    │ ← 時刻目盛り（2時間ごと）
│  ├───┼───┼───┼───┼───┼───┼───┤   │
│      ▓▓▓▓▓▓▓                        │ ← 区間1: 23:00-02:00
│                  ▓▓▓▓▓▓▓▓           │ ← 区間2: 03:30-07:00
│  ├───┼───┼───┼───┼───┼───┼───┤   │
│                                     │
│  [+ 区間を追加]                      │
└─────────────────────────────────────┘
```

横軸スクロールはせず、画面幅にフィット（14時間を一画面に表示）。

## 3. データモデル（内部状態）

```typescript
type SleepInterval = {
  id: string;             // UUID（既存区間 or 新規）
  startMin: number;       // 21:00 起点の経過分（0 〜 840）
  endMin: number;         // 21:00 起点の経過分（startMin < endMin <= 840）
};

// 21:00起点の理由：
// - 14時間 = 840分
// - 10分粒度 = 84スロット
// - 日付跨ぎを意識せず単純な数値演算で済む
```

**変換規則** (DB ⇄ 内部状態):

```
DB (TIMESTAMP) → 内部 (startMin)
  recordDate=4/30 を基準に
  - timestamp が 4/30 21:00 〜 5/1 11:00 の範囲に正規化
  - startMin = (timestamp - 4/30 21:00) / 60000 / 10 * 10

内部 → DB
  startAt = recordDate 21:00 + startMin 分
  endAt   = recordDate 21:00 + endMin 分
  ※ endMin > 180 (24:00超え) なら翌日扱い
```

## 4. コンポーネント構成

```
<SleepTimeline>                       — ルート、状態保持
  ├─ <TimelineRuler>                  — 時刻目盛り
  ├─ <TimelineCanvas>                 — タップで新規区間
  │   └─ <SleepIntervalBar>[]         — 各区間の帯
  │        ├─ <DragHandle left>       — 開始時刻ハンドル
  │        ├─ <DragHandle right>      — 終了時刻ハンドル
  │        └─ <BarBody>               — 帯本体（長押しで削除）
  └─ <TotalDurationLabel>             — 合計時間表示
```

## 5. ジェスチャー設計

`react-native-gesture-handler` + `react-native-reanimated` v3 を使用。

### 5.1 タップ（新規区間追加）
- 対象: `<TimelineCanvas>` 上の空白領域
- 動作:
  1. **既に10区間ある場合はトーストで「最大10区間まで」を表示し、何もしない**
  2. タップ位置 X座標 を分単位に変換（10分スナップ）
  3. デフォルト長 = 60分の区間を生成
  4. 既存区間と重複する場合は、重複しない位置にシフト or 不可表示

### 5.2 ドラッグ（ハンドル移動）
- 対象: `<DragHandle>` (両端のつまみ、**ヒット領域 44pt 四方**、見た目は中央の視覚要素のみ)
- 動作:
  1. `Pan` ジェスチャーで X座標差分を取得
  2. 10分単位にスナップ
  3. 制約:
     - left ハンドル: `[0, endMin - 10]` の範囲
     - right ハンドル: `[startMin + 10, 840]` の範囲
     - 他区間との重複禁止（ドラッグ中の境界で停止）
  4. ドラッグ中は触覚フィードバック（10分境界を跨ぐたびに `Haptics.selectionAsync()`）

### 5.3 長押し（区間削除）
- 対象: `<BarBody>`
- 動作:
  1. 500ms 長押しで削除確認モーダル
  2. 確認 → 区間を配列から除去

## 6. 状態管理

Jotai アトム + react-hook-form フィールドを橋渡し。

```typescript
// store/current-record.ts
const sleepIntervalsAtom = atom<SleepInterval[]>([]);

const totalSleepMinutesAtom = atom((get) =>
  get(sleepIntervalsAtom).reduce((sum, i) => sum + (i.endMin - i.startMin), 0)
);
```

`SleepTimeline` コンポーネントは `useAtom(sleepIntervalsAtom)` で読み書き。
親フォーム送信時に `getValues()` 同等で取り出し DB 永続化。

## 7. 重複検出アルゴリズム

```typescript
// domain/sleep.ts
function hasOverlap(intervals: SleepInterval[], candidate: SleepInterval, excludeId?: string): boolean {
  return intervals
    .filter(i => i.id !== excludeId)
    .some(i => candidate.startMin < i.endMin && candidate.endMin > i.startMin);
}

// ドラッグ中の制約計算（左ハンドルを動かす場合）
function clampLeftHandle(intervals: SleepInterval[], currentId: string, proposedStart: number): number {
  const current = intervals.find(i => i.id === currentId)!;
  const others = intervals.filter(i => i.id !== currentId);

  // 自分の右ハンドルより左
  let max = current.endMin - 10;
  // 左隣の区間の終端より右
  const leftNeighbor = others
    .filter(i => i.endMin <= current.startMin)
    .sort((a, b) => b.endMin - a.endMin)[0];
  let min = leftNeighbor ? leftNeighbor.endMin : 0;

  return Math.max(min, Math.min(max, snapTo10Min(proposedStart)));
}

function snapTo10Min(min: number): number {
  return Math.round(min / 10) * 10;
}
```

## 8. 座標変換

```typescript
// 画面幅を W、左右パディングを P とする
const usableWidth = W - 2 * P;
const TOTAL_MINUTES = 840; // 14h

function pxToMin(px: number): number {
  return snapTo10Min((px - P) / usableWidth * TOTAL_MINUTES);
}

function minToPx(min: number): number {
  return P + (min / TOTAL_MINUTES) * usableWidth;
}
```

Reanimated の `useDerivedValue` でX座標と分の同期を worklet 内で計算（メインスレッド経由しない）。

## 9. バリデーション（zod スキーマ）

```typescript
const sleepIntervalSchema = z.object({
  id: z.string(),
  startMin: z.number().int().min(0).max(830).multipleOf(10),
  endMin: z.number().int().min(10).max(840).multipleOf(10),
}).refine(d => d.endMin > d.startMin, { message: "終了は開始より後にしてください" });

const sleepIntervalsSchema = z.array(sleepIntervalSchema)
  .refine(arr => !hasAnyOverlap(arr), { message: "区間が重複しています" });
```

## 10. アクセシビリティ

- 各 `DragHandle` に `accessibilityLabel`（例: "区間1の開始時刻 23:00"）
- `accessibilityActions` で `+10分 / -10分` ボタン操作も提供（ドラッグが困難なユーザー向け）
- VoiceOver/TalkBack 対応

## 11. テスト戦略

### 単体（純粋関数、`tests/unit/sleep.test.ts`）
- `snapTo10Min`: 境界値（0, 5, 9, 10, 11, ...）
- `hasOverlap`: 隣接（重複なし）、完全包含、部分重複、ID除外
- `clampLeftHandle`: 左隣あり/なし、自分の右ハンドル制約
- 座標変換 `pxToMin` / `minToPx` の往復一貫性

### コンポーネント（RNTL、`tests/integration/sleep-timeline.test.tsx`）
- 初期表示で区間が正しい位置に描画
- ドラッグ操作で `sleepIntervalsAtom` が更新
- 重複しようとすると stop する
- 長押しで削除モーダルが出る

### E2E（Maestro、`e2e/flows/record-sleep.yaml`）
- 記録画面を開く → 空白タップで区間追加 → ハンドルドラッグ → 保存 → 詳細画面で同じ区間が表示

## 12. 実装上の注意

- **Reanimated のworkletで Jotai store にアクセス禁止**。ジェスチャー終了時に `runOnJS` でアトム更新
- **ドラッグ中の60fps維持**：帯のレイアウトは `transform: translateX` のみで実現（top/left は使わない）
- **記録日跨ぎ**: `startMin >= 180`（24:00 = 21:00 + 180分）以降は翌日扱いで TIMESTAMP 化
- **横画面対応**: 今回はスコープ外、`<SleepTimeline>` の幅計算は縦持ち固定でOK

## 13. 確定事項

- **ハンドルのヒット領域**: **44pt四方**（Apple HIG 準拠、見た目はそれより小さくてもタップ判定は44pt）
- **区間の最小長**: 10分（粒度と一致）
- **区間の最大数**: **1日10区間でソフト上限**（11個目を追加しようとするとトーストで通知）

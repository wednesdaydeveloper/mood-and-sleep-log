# 詳細設計: 3段グラフパネル

> 対象機能: 要件定義 §FR-3
> 関連: §FR-1.3 睡眠タイムライン（時刻レンジ 21:00〜翌11:00 を共有）

## 1. 機能要件サマリ

- 縦3段パネル（X軸共有）
  - 上段: 気分（折れ線、Y軸 −2〜+2）
  - 中段: 睡眠時間合計（折れ線、Y軸 自動）
  - 下段: 睡眠時間帯（縦帯グラフ、Y軸 21:00〜翌11:00 固定）
- 期間切替: **week / month / year**
- year は月平均集約、0件月は線にギャップ
- 各点・各帯タップで該当日の値を表示

## 2. 画面レイアウト

```
┌──────────────────────────────────────┐
│ [week] [month] [year]                │ ← 期間切替タブ
├──────────────────────────────────────┤
│ ◀  2026年4月25日 - 5月1日       ▶  │ ← 期間ナビ
├──────────────────────────────────────┤
│ 気分                                  │
│ +2 ─────────────────────────         │
│ +1 ──╱╲──╱──╲──╱─╲─╱──               │
│  0 ─╱──╲╱────╲╱───╲╱──               │
│ -1 ─────────────────────             │
│ -2 ─────────────────────             │
├──────────────────────────────────────┤
│ 睡眠時間                              │
│ 9h ─────────────────────             │
│ 8h ──╲──╱╲──╱──╲──╱╲                │
│ 7h ───╲╱──╲╱────╲╱──                │
│ 6h ─────────────────────             │
├──────────────────────────────────────┤
│ 睡眠時間帯                            │
│ 11 ─                                 │
│ 09 ─ ▓ ▓ ▓ ▓ ▓ ▓ ▓                  │
│ 07 ─ ▓ ▓ ▓ ▓ ▓ ▓ ▓                  │
│ 05 ─ ▓ ▓ ▓ ▓   ▓ ▓                  │ ← 4/29 は分割
│ 03 ─       ▓                         │
│ 01 ─ ▓ ▓ ▓   ▓ ▓ ▓                  │
│ 23 ─ ▓ ▓ ▓ ▓ ▓ ▓ ▓                  │
│ 21 ─                                 │
│      4/25  4/27  4/29  5/1          │ ← 共通X軸ラベル
└──────────────────────────────────────┘
```

## 3. データフローと集約

### 3.1 データ取得（Repository）

```typescript
// db/repositories/chart.ts
async function getRecordsInRange(from: Date, to: Date): Promise<{
  date: string;          // ISO yyyy-MM-dd
  moodScore: number;
  totalSleepMinutes: number;
  intervals: { startMin: number; endMin: number }[];
}[]> {
  // Drizzle で DailyRecord と SleepInterval を JOIN
  // intervals は 21:00起点の分単位に変換済みで返す
}
```

### 3.2 期間集約（ドメイン層、純粋関数）

```typescript
// domain/chart-aggregation.ts

type RawDay = { date: Date; moodScore: number; totalSleepMinutes: number; intervals: Interval[] };
type ChartPoint = { x: Date; mood: number | null; sleep: number | null; intervals: Interval[] };

function aggregateForWeek(raw: RawDay[]): ChartPoint[] {
  // 7日 → 7点（生データのまま）
}

function aggregateForMonth(raw: RawDay[]): ChartPoint[] {
  // 約30日 → 30点（生データのまま、X軸ラベルだけ間引き）
}

function aggregateForYear(raw: RawDay[]): ChartPoint[] {
  // 12ヶ月 → 12点
  // 各月: その月のレコードを平均
  //   - mood: 平均（0件 → null）
  //   - sleep: 平均（0件 → null）
  //   - intervals: 月平均の就寝・起床時刻を1区間として算出（0件 → []）
}
```

### 3.3 SQLでの集約（year 用）
day 数が多いとアプリ側集約のコストが上がるため、year は SQL で月単位に集約してから取得することも検討。今回は365件 × 数フィールドなのでアプリ側集約で十分高速。

## 4. コンポーネント構成

```
<ChartScreen>
  ├─ <PeriodTabs>                  — week/month/year
  ├─ <PeriodNavigator>              — 前後送り、現在期間表示
  ├─ <MoodChart>                    — 上段（Victory Native XL の折れ線）
  ├─ <SleepDurationChart>           — 中段（同上）
  ├─ <SleepTimeRangeChart>          — 下段（縦帯グラフ、Skia カスタム描画）
  └─ <DataPointTooltip>             — タップ時のポップアップ
```

3段とも同じ X軸（period × point数）を共有するため、X座標スケールは親で計算し props で渡す。

## 5. 上段・中段（折れ線）

### 5.1 Victory Native XL での実装

```typescript
import { CartesianChart, Line } from "victory-native";

<CartesianChart
  data={points}
  xKey="x"
  yKeys={["mood"]}
  domain={{ y: [-2, 2] }}
>
  {({ points: chartPoints }) => (
    <Line points={chartPoints.mood} color="green" strokeWidth={2} />
  )}
</CartesianChart>
```

### 5.2 0件月のギャップ処理

`mood: null` の点は Line から自動的に除外され、前後の点を結ばない（Victory Native XL の仕様）。
仕様通り「線にギャップ」が実現される。

## 6. 下段（縦帯グラフ）

Victory Native XL に縦帯グラフのプリセットがないため、**Skia でカスタム描画**。

### 6.1 描画モデル

```typescript
type IntervalBar = {
  xPx: number;        // 列の中心X座標
  widthPx: number;    // 帯の幅（列幅の60%程度）
  topPx: number;      // 帯上端Y座標（startMin から計算）
  heightPx: number;   // 帯の高さ（duration から計算）
};

// 21:00起点の分(0-840) → Y座標
function minToYPx(min: number, plotHeight: number): number {
  return (min / 840) * plotHeight;
}
```

### 6.2 描画擬似コード

```typescript
import { Canvas, Rect } from "@shopify/react-native-skia";

<Canvas style={{ width, height }}>
  {points.flatMap((point, idx) =>
    point.intervals.map((iv, j) => (
      <Rect
        key={`${idx}-${j}`}
        x={xScale(idx) - barWidth / 2}
        y={minToYPx(iv.startMin, plotHeight)}
        width={barWidth}
        height={minToYPx(iv.endMin - iv.startMin, plotHeight)}
        color="rgba(200,40,40,0.85)"
      />
    ))
  )}
  {/* Y軸目盛: 21, 23, 01, 03, 05, 07, 09, 11 (2hごと) */}
  {/* X軸目盛: 親と共通 */}
</Canvas>
```

### 6.3 分割睡眠の表現

`point.intervals` が複数ある日は、その日の列に複数の `<Rect>` が並ぶ。間が空くため自然に分割が表現される。

### 6.4 year ビューの帯

- 月平均の就寝開始時刻と起床時刻を計算 → 1区間にまとめて描画
- 0件月は描画しない（X軸列だけ存在、帯なし）

## 7. インタラクション

### 7.1 タップ
- 折れ線: Victory Native XL の `Pressable` ラッパで近接点を検出
- 縦帯: Skia 上のヒットテストを自前実装
  - タップ位置が帯の bbox に含まれるかチェック
- タップ → `<DataPointTooltip>` を該当列上にフローティング表示

### 7.2 期間切替
- タブクリック → period atom を更新 → useChartData フックがクエリ再実行

### 7.3 期間スクロール
- ◀▶ ボタンで `currentPeriodStart` atom を ±1単位（週/月/年）移動

## 8. 状態管理

```typescript
// store/chart.ts
const periodAtom = atom<"week" | "month" | "year">("week");
const periodStartAtom = atom<Date>(startOfWeek(new Date()));

// 派生：表示すべき範囲
const periodRangeAtom = atom((get) => {
  const period = get(periodAtom);
  const start = get(periodStartAtom);
  return computeRange(period, start);
});
```

## 9. パフォーマンス

- 365日（year）でも生データは ~365行 × 平均1.5 intervals ≈ 600行。問題なし
- グラフ初期描画 1秒以内（要件§5）の余裕あり
- year集約はメモ化（period × periodStart をキー）

## 10. テスト戦略

### 単体（`tests/unit/chart-aggregation.test.ts`）
- `aggregateForWeek/Month/Year` の境界
- 0件日 / 0件月の null 処理
- year の月平均算出（小数点処理）
- 時刻平均: 23:30 と 01:30 の平均は 00:30 か（日跨ぎ平均は今回 単純平均で割り切る、要確認）

### 結合（`tests/integration/chart-screen.test.tsx`）
- 期間切替で表示が更新される
- ◀▶ で範囲移動
- データなし期間でもクラッシュしない

### E2E（`e2e/flows/chart-view.yaml`）
- 記録を3日入力 → グラフ画面 → week 表示で3点が表示
- month/year に切替

## 11. 確定事項

- **時刻平均（year）**: **21:00起点の分単位（0〜840）で単純平均** → 表示時に時刻へ戻す
- **3段の高さ配分**: **上:中:下 = 1:1:2**（下段は時刻レンジが広いため高め）
- **month のX軸ラベル**: **7日ごと（週単位）**
- **タップ時の挙動**: **ポップアップで詳細表示**（その場で日付・気分・睡眠時刻を表示）

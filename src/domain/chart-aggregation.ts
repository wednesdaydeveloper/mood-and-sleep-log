// グラフ表示用のデータ集約。M5 では week/month を実装。year は M6 で追加。
// 詳細設計: docs/design/03-chart-panel.md §3

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { fromIsoDate, toIsoDate } from '@/lib/date';

import { type MoodScore } from './mood';
import { TIMELINE_TOTAL_MINUTES } from './sleep';
import { toTimelineInterval } from './sleep-mapping';

export type ChartPeriod = 'week' | 'month' | 'year';

export interface ChartIntervalRange {
  /** 21:00 起点の経過分（0 〜 840） */
  startMin: number;
  /** 21:00 起点の経過分（startMin < endMin <= 840） */
  endMin: number;
}

export interface ChartPoint {
  /** ISO yyyy-MM-dd の日付ラベル（year は yyyy-MM、その月の代表点）。 */
  dateIso: string;
  /** X 軸の表示用ラベル（例: '4/25'）。 */
  label: string;
  /** 気分スコア。データなしは null（折れ線にギャップ）。 */
  mood: number | null;
  /** 睡眠時間合計（分）。データなしは null。 */
  sleepMinutes: number | null;
  /** 縦帯グラフ用の睡眠区間（21:00 起点の分）。データなしは空配列。 */
  intervals: ChartIntervalRange[];
}

interface RawByDate {
  iso: string;
  record: DailyRecordWithIntervals | undefined;
}

/** 直近 7 日分（昨日まで遡って 7 日）の点を返す。 */
export function aggregateForWeek(
  records: readonly DailyRecordWithIntervals[],
  endIso: string,
): ChartPoint[] {
  const days = enumerateDays(endIso, 7);
  return mapByDate(records, days).map(toRawDayPoint);
}

/** 直近 30 日分の点を返す。 */
export function aggregateForMonth(
  records: readonly DailyRecordWithIntervals[],
  endIso: string,
): ChartPoint[] {
  const days = enumerateDays(endIso, 30);
  return mapByDate(records, days).map(toRawDayPoint);
}

/** 期間の終端から `count` 日分を昇順で返す。 */
function enumerateDays(endIso: string, count: number): string[] {
  const endDate = fromIsoDate(endIso);
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    result.push(toIsoDate(d));
  }
  return result;
}

function mapByDate(
  records: readonly DailyRecordWithIntervals[],
  days: readonly string[],
): RawByDate[] {
  const map = new Map<string, DailyRecordWithIntervals>();
  for (const r of records) map.set(r.date, r);
  return days.map((iso) => ({ iso, record: map.get(iso) }));
}

function toRawDayPoint({ iso, record }: RawByDate): ChartPoint {
  if (!record) {
    return { dateIso: iso, label: shortLabel(iso), mood: null, sleepMinutes: null, intervals: [] };
  }
  const intervals = record.intervals.map((iv) => {
    const tl = toTimelineInterval(iso, iv);
    return { startMin: tl.startMin, endMin: tl.endMin };
  });
  const sleepMinutes = intervals.reduce((sum, i) => sum + (i.endMin - i.startMin), 0);
  return {
    dateIso: iso,
    label: shortLabel(iso),
    mood: record.moodScore as MoodScore,
    sleepMinutes,
    intervals,
  };
}

function shortLabel(iso: string): string {
  const d = fromIsoDate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 期間タブから `count` を取得。year は M6 で実装予定。 */
export function periodDayCount(period: ChartPeriod): number {
  switch (period) {
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'year':
      return 365;
  }
}

/** タイムライン分の上限（参照用）。 */
export const CHART_TIMELINE_TOTAL_MINUTES = TIMELINE_TOTAL_MINUTES;

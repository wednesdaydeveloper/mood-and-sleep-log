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
  /** v1.3: イベント。week/month のみ設定（year は集約のため null）。データなしも null。 */
  event: string | null;
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

/**
 * 直近 12 ヶ月分の点を月平均で返す（要件 §FR-3.1, §FR-3.2 / 設計 §3.2 §11）。
 *
 * - 末尾は `endIso` を含む月、そこから 11 ヶ月遡る
 * - 各月の mood / sleepMinutes は単純平均
 * - 睡眠時間帯は 21:00 起点の分単位で平均（startMin / endMin の平均）し
 *   1 つの代表区間として描画
 * - 記録 0 件の月は mood/sleepMinutes が null で intervals は空配列
 *   （折れ線は線にギャップ、縦帯は何も描画されない）
 */
export function aggregateForYear(
  records: readonly DailyRecordWithIntervals[],
  endIso: string,
): ChartPoint[] {
  const months = enumerateMonths(endIso, 12);
  // 月キー (yyyy-MM) で記録をグルーピング
  const groups = new Map<string, DailyRecordWithIntervals[]>();
  for (const r of records) {
    const key = r.date.slice(0, 7);
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }
  return months.map((monthIso) => buildYearPoint(monthIso, groups.get(monthIso) ?? []));
}

/** 末尾月を含めて `count` ヶ月分の `yyyy-MM` を昇順で返す。 */
function enumerateMonths(endIso: string, count: number): string[] {
  const endDate = fromIsoDate(endIso);
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }
  return result;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function buildYearPoint(monthIso: string, group: readonly DailyRecordWithIntervals[]): ChartPoint {
  const label = formatMonthLabel(monthIso);
  if (group.length === 0) {
    return { dateIso: monthIso, label, mood: null, sleepMinutes: null, intervals: [], event: null };
  }

  const moodSum = group.reduce((s, r) => s + r.moodScore, 0);
  const meanMood = moodSum / group.length;

  // 各日の睡眠データを 21:00 起点の分単位に揃え、月平均を取る。
  // - 就寝（startMin）: その日の最早開始
  // - 起床（endMin）: その日の最遅終了
  // 設計 §03 §11 に従い、21:00 起点の分単位 [0, 840] で算術平均する。
  const dailyTotals: number[] = [];
  const dailyStartMins: number[] = [];
  const dailyEndMins: number[] = [];
  for (const r of group) {
    const intervals = r.intervals.map((iv) => toTimelineInterval(r.date, iv));
    if (intervals.length === 0) continue;
    const total = intervals.reduce((s, i) => s + (i.endMin - i.startMin), 0);
    if (total <= 0) continue;
    dailyTotals.push(total);
    const startMins = intervals.map((i) => i.startMin);
    const endMins = intervals.map((i) => i.endMin);
    dailyStartMins.push(Math.min(...startMins));
    dailyEndMins.push(Math.max(...endMins));
  }

  const sleepMinutes = dailyTotals.length > 0 ? mean(dailyTotals) : null;
  const intervals: ChartIntervalRange[] =
    dailyStartMins.length > 0 && dailyEndMins.length > 0
      ? [
          {
            startMin: Math.round(mean(dailyStartMins)),
            endMin: Math.round(mean(dailyEndMins)),
          },
        ]
      : [];

  return {
    dateIso: monthIso,
    label,
    mood: round2(meanMood),
    sleepMinutes,
    intervals,
    // year は集約のため複数日のイベントを 1 つに集約しない（null 固定）
    event: null,
  };
}

function mean(arr: readonly number[]): number {
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMonthLabel(monthIso: string): string {
  const [, mm] = monthIso.split('-');
  return `${parseInt(mm ?? '0', 10)}月`;
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
    return {
      dateIso: iso,
      label: shortLabel(iso),
      mood: null,
      sleepMinutes: null,
      intervals: [],
      event: null,
    };
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
    event: record.event,
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

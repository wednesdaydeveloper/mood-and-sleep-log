import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { toTimelineInterval } from './sleep-mapping';
import { formatTimelineMinute } from './sleep';

const HEADER = ['date', 'moodScore', 'moodTags', 'memo', 'sleepIntervals'].join(',');

/**
 * 設計 §4.4 / §7 に従い、CSV (RFC 4180、UTF-8 BOM 付き) 形式で
 * 全レコードをシリアライズする。
 *
 * - 区切り: カンマ `,`
 * - moodTags 内の複数タグもカンマ区切り、フィールド全体は ダブルクォートで囲む
 * - sleepIntervals 内の複数区間もカンマ区切り、形式は `start-end`
 *   start/end は HH:mm（21:00 起点 + 経過分から逆算した実時刻）
 */
export function recordsToCsv(records: readonly DailyRecordWithIntervals[]): string {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const rows = sorted.map((r) => rowFor(r));
  const body = [HEADER, ...rows].join('\n');
  return BOM + body;
}

const BOM = '﻿';

function rowFor(record: DailyRecordWithIntervals): string {
  const intervalsField = record.intervals
    .map((iv) => {
      const tl = toTimelineInterval(record.date, iv);
      return `${formatTimelineMinute(tl.startMin)}-${formatTimelineMinute(tl.endMin)}`;
    })
    .join(',');

  return [
    record.date,
    String(record.moodScore),
    quote(record.moodTags.join(',')),
    quote(record.memo ?? ''),
    quote(intervalsField),
  ].join(',');
}

/** RFC 4180: フィールドを `"` で囲み、内部の `"` は `""` にエスケープ。 */
function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

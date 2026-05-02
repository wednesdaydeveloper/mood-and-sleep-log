import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import type { MoodScore } from './mood';
import { isMoodScore } from './mood';
import { isValidTagName } from './tags';
import { toTimelineInterval } from './sleep-mapping';
import { formatTimelineMinute, TIMELINE_TOTAL_MINUTES } from './sleep';
import { fromIsoDate } from '@/lib/date';

const HEADER_COLUMNS = ['date', 'moodScore', 'moodTags', 'memo', 'sleepIntervals'] as const;
const HEADER = HEADER_COLUMNS.join(',');
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RANGE_PATTERN = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;
const BOM = '﻿';

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

// ============================================================
// CSV パース（v1.1）
// ============================================================

export interface ParsedCsvInterval {
  /** 21:00 起点の経過分 */
  startMin: number;
  /** 同上 */
  endMin: number;
}

export interface ParsedCsvRecord {
  date: string;
  moodScore: MoodScore;
  moodTags: string[];
  memo: string | null;
  intervals: ParsedCsvInterval[];
}

export interface CsvParseError {
  /** 1 始まりの行番号 */
  line: number;
  message: string;
}

export interface CsvParseResult {
  records: ParsedCsvRecord[];
  errors: CsvParseError[];
}

/**
 * CSV 文字列をパースしてレコードと不正行を返す。
 * 列順は `recordsToCsv` の出力と完全互換。BOM は自動除去。
 */
export function parseCsv(content: string): CsvParseResult {
  const stripped = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  const rows = parseRows(stripped);
  const errors: CsvParseError[] = [];
  const records: ParsedCsvRecord[] = [];

  if (rows.length === 0) {
    return { records, errors: [{ line: 0, message: 'CSV が空です' }] };
  }

  const header = rows[0];
  if (!header || !isValidHeader(header)) {
    errors.push({ line: 1, message: 'ヘッダー行が想定形式と異なります' });
    return { records, errors };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 1;
    if (!row || row.length === 0 || (row.length === 1 && row[0] === '')) {
      // 空行はスキップ
      continue;
    }
    const parsed = parseRow(row, lineNumber);
    if ('error' in parsed) {
      errors.push({ line: lineNumber, message: parsed.error });
    } else {
      records.push(parsed.record);
    }
  }

  return { records, errors };
}

function isValidHeader(row: readonly string[]): boolean {
  if (row.length !== HEADER_COLUMNS.length) return false;
  return HEADER_COLUMNS.every((col, i) => row[i] === col);
}

function parseRow(
  row: readonly string[],
  lineNumber: number,
): { record: ParsedCsvRecord } | { error: string } {
  if (row.length !== HEADER_COLUMNS.length) {
    return { error: `列数が ${HEADER_COLUMNS.length} と一致しません（実際: ${row.length}）` };
  }

  const [dateStr, moodStr, tagsStr, memoStr, intervalsStr] = row;
  if (!dateStr || !ISO_DATE_PATTERN.test(dateStr)) {
    return { error: `不正な日付: "${dateStr ?? ''}"` };
  }
  try {
    fromIsoDate(dateStr);
  } catch {
    return { error: `不正な日付: "${dateStr}"` };
  }

  const moodNum = Number(moodStr);
  if (!isMoodScore(moodNum)) {
    return { error: `不正な moodScore: "${moodStr ?? ''}"` };
  }

  const tags = (tagsStr ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const validTags = tags.filter(isValidTagName);
  if (validTags.length !== tags.length) {
    return { error: `未定義のタグが含まれています: ${tags.filter((t) => !isValidTagName(t)).join(', ')}` };
  }

  const memo = memoStr && memoStr.length > 0 ? memoStr : null;

  const intervalsField = (intervalsStr ?? '').trim();
  const intervals: ParsedCsvInterval[] = [];
  if (intervalsField.length > 0) {
    const parts = intervalsField.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    for (const part of parts) {
      const m = TIME_RANGE_PATTERN.exec(part);
      if (!m) {
        return { error: `不正な睡眠時間帯: "${part}"` };
      }
      const startMin = timeToTimelineMin(Number(m[1]), Number(m[2]));
      const endMin = timeToTimelineMin(Number(m[3]), Number(m[4]));
      if (
        startMin === null ||
        endMin === null ||
        endMin <= startMin
      ) {
        return { error: `睡眠時間帯の範囲が不正: "${part}"` };
      }
      intervals.push({ startMin, endMin });
    }
  }

  void lineNumber;

  return {
    record: {
      date: dateStr,
      moodScore: moodNum,
      moodTags: validTags,
      memo,
      intervals,
    },
  };
}

/**
 * 「HH:mm」を 21:00 起点の経過分（0〜840、終点は 11:00）に変換。
 * 開始は 21:00〜23:59 → 0〜180、00:00〜10:59 → 180〜840 と扱う。
 * end の場合 11:00 → 840 を許容。
 */
function timeToTimelineMin(h: number, m: number): number | null {
  if (
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  let min: number;
  if (h >= 21) {
    min = (h - 21) * 60 + m;
  } else if (h <= 11) {
    min = (24 - 21) * 60 + h * 60 + m;
  } else {
    return null;
  }
  if (min < 0 || min > TIMELINE_TOTAL_MINUTES) return null;
  return min;
}

/** CSV 全体を行単位、各行をフィールド単位にパースする。RFC 4180 互換。 */
function parseRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          // エスケープされた "
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      // CRLF や CR を改行として扱う
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // ファイル末尾に改行がない場合の最終行
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

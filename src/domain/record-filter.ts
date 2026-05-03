// ホーム画面リストの検索/絞り込み用の純粋関数。
// 設計: docs/design/16-v1.1-features.md §3

import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

export interface FilterCriteria {
  /** 部分一致するキーワード。空文字列で無条件マッチ。 */
  keyword: string;
  /** 全部含む必要のあるタグ（AND）。空配列で無条件マッチ。 */
  selectedTags: readonly string[];
}

/** 各レコードに対するフィルタ判定。 */
export function matches(
  record: DailyRecordWithIntervals,
  criteria: FilterCriteria,
): boolean {
  return matchesKeyword(record, criteria.keyword) && matchesTags(record, criteria.selectedTags);
}

/** 配列を一括でフィルタする。 */
export function filterRecords(
  records: readonly DailyRecordWithIntervals[],
  criteria: FilterCriteria,
): DailyRecordWithIntervals[] {
  return records.filter((r) => matches(r, criteria));
}

/**
 * キーワードがメモ・タグ名・イベント・日記のいずれかに含まれていれば一致（OR）。
 * 大文字小文字は区別しない。空文字列は常に true。
 */
function matchesKeyword(record: DailyRecordWithIntervals, keyword: string): boolean {
  const trimmed = keyword.trim();
  if (trimmed === '') return true;
  const needle = trimmed.toLowerCase();
  if (record.memo && record.memo.toLowerCase().includes(needle)) return true;
  if (record.event && record.event.toLowerCase().includes(needle)) return true;
  if (record.diary && record.diary.toLowerCase().includes(needle)) return true;
  if (record.moodTags.some((t) => t.toLowerCase().includes(needle))) return true;
  return false;
}

/**
 * 選択されたタグがすべてレコードに含まれていれば一致（AND）。
 * 空配列は常に true。
 */
function matchesTags(
  record: DailyRecordWithIntervals,
  selectedTags: readonly string[],
): boolean {
  if (selectedTags.length === 0) return true;
  return selectedTags.every((t) => record.moodTags.includes(t));
}

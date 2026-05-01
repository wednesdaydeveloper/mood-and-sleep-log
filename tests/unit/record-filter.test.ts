import { filterRecords, matches, type FilterCriteria } from '@/domain/record-filter';
import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

function r(
  date: string,
  moodTags: string[] = [],
  memo: string | null = null,
): DailyRecordWithIntervals {
  return {
    id: `id-${date}`,
    date,
    moodScore: 0,
    moodTags,
    memo,
    intervals: [],
    createdAt: new Date(date),
    updatedAt: new Date(date),
  };
}

const empty: FilterCriteria = { keyword: '', selectedTags: [] };

describe('matches', () => {
  it('returns true for empty criteria', () => {
    expect(matches(r('2026-04-30'), empty)).toBe(true);
  });

  describe('keyword (memo OR tag name, case-insensitive)', () => {
    it('matches memo substring', () => {
      const rec = r('2026-04-30', [], '今日は良い1日だった');
      expect(matches(rec, { keyword: '良い', selectedTags: [] })).toBe(true);
    });

    it('matches tag name substring', () => {
      const rec = r('2026-04-30', ['不安', '楽しい']);
      expect(matches(rec, { keyword: '楽', selectedTags: [] })).toBe(true);
    });

    it('returns false when keyword matches neither memo nor tag', () => {
      const rec = r('2026-04-30', ['不安'], 'メモ内容');
      expect(matches(rec, { keyword: 'XYZ', selectedTags: [] })).toBe(false);
    });

    it('is case-insensitive', () => {
      const rec = r('2026-04-30', [], 'Hello World');
      expect(matches(rec, { keyword: 'hello', selectedTags: [] })).toBe(true);
      expect(matches(rec, { keyword: 'WORLD', selectedTags: [] })).toBe(true);
    });

    it('whitespace-only keyword acts as no filter', () => {
      const rec = r('2026-04-30', [], 'memo');
      expect(matches(rec, { keyword: '   ', selectedTags: [] })).toBe(true);
    });

    it('returns false when memo is null and tag does not match', () => {
      const rec = r('2026-04-30', ['不安']);
      expect(matches(rec, { keyword: '楽しい', selectedTags: [] })).toBe(false);
    });
  });

  describe('selectedTags (AND of all)', () => {
    it('matches when record contains all selected tags', () => {
      const rec = r('2026-04-30', ['不安', '楽しい', '感謝']);
      expect(matches(rec, { keyword: '', selectedTags: ['不安', '感謝'] })).toBe(true);
    });

    it('returns false when one selected tag is missing', () => {
      const rec = r('2026-04-30', ['不安']);
      expect(matches(rec, { keyword: '', selectedTags: ['不安', '感謝'] })).toBe(false);
    });

    it('empty selectedTags acts as no filter', () => {
      const rec = r('2026-04-30');
      expect(matches(rec, { keyword: '', selectedTags: [] })).toBe(true);
    });
  });

  describe('combined (keyword AND tags)', () => {
    it('requires both keyword and tags to match', () => {
      const rec = r('2026-04-30', ['楽しい'], '今日は楽しかった');
      expect(matches(rec, { keyword: '楽しか', selectedTags: ['楽しい'] })).toBe(true);
      expect(matches(rec, { keyword: '楽しか', selectedTags: ['不安'] })).toBe(false);
      expect(matches(rec, { keyword: 'XYZ', selectedTags: ['楽しい'] })).toBe(false);
    });
  });
});

describe('filterRecords', () => {
  const records = [
    r('2026-04-25', ['不安'], '不調'),
    r('2026-04-26', ['楽しい', '感謝'], '友人と食事'),
    r('2026-04-27', ['イライラ'], null),
  ];

  it('returns all records on empty criteria', () => {
    expect(filterRecords(records, empty)).toHaveLength(3);
  });

  it('filters by keyword', () => {
    const result = filterRecords(records, { keyword: '友人', selectedTags: [] });
    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe('2026-04-26');
  });

  it('filters by tag', () => {
    const result = filterRecords(records, { keyword: '', selectedTags: ['不安'] });
    expect(result.map((r) => r.date)).toEqual(['2026-04-25']);
  });

  it('preserves the order of input records', () => {
    const result = filterRecords(records, { keyword: '', selectedTags: [] });
    expect(result.map((r) => r.date)).toEqual(['2026-04-25', '2026-04-26', '2026-04-27']);
  });
});

import {
  aggregateForMonth,
  aggregateForWeek,
  aggregateForYear,
} from '@/domain/chart-aggregation';
import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

function makeRecord(
  date: string,
  moodScore: -2 | -1 | 0 | 1 | 2,
  intervals: { startAt: Date; endAt: Date }[] = [],
): DailyRecordWithIntervals {
  return {
    id: `id-${date}`,
    date,
    moodScore,
    moodTags: [],
    memo: null,
    intervals: intervals.map((iv, i) => ({ id: `iv-${i}`, ...iv })),
    createdAt: new Date(date),
    updatedAt: new Date(date),
  };
}

describe('aggregateForWeek', () => {
  it('returns 7 points ending on the given date', () => {
    const points = aggregateForWeek([], '2026-05-01');
    expect(points).toHaveLength(7);
    expect(points[0]?.dateIso).toBe('2026-04-25');
    expect(points[6]?.dateIso).toBe('2026-05-01');
  });

  it('fills missing days with null mood and empty intervals', () => {
    const points = aggregateForWeek([], '2026-05-01');
    for (const p of points) {
      expect(p.mood).toBeNull();
      expect(p.sleepMinutes).toBeNull();
      expect(p.intervals).toEqual([]);
    }
  });

  it('matches records by date', () => {
    const records = [
      makeRecord('2026-04-29', 1),
      makeRecord('2026-05-01', -1),
    ];
    const points = aggregateForWeek(records, '2026-05-01');
    expect(points[4]?.dateIso).toBe('2026-04-29');
    expect(points[4]?.mood).toBe(1);
    expect(points[6]?.mood).toBe(-1);
    expect(points[0]?.mood).toBeNull();
  });

  it('computes sleep minutes from intervals (record date = 4/30 covers 4/30 21:00 - 5/1 11:00)', () => {
    const records = [
      makeRecord('2026-04-30', 0, [
        { startAt: new Date(2026, 3, 30, 23, 0), endAt: new Date(2026, 4, 1, 7, 0) }, // 8h
      ]),
    ];
    const points = aggregateForWeek(records, '2026-05-01');
    // 4/30 は points[5]
    expect(points[5]?.dateIso).toBe('2026-04-30');
    expect(points[5]?.sleepMinutes).toBe(8 * 60);
    expect(points[5]?.intervals).toHaveLength(1);
    expect(points[5]?.intervals[0]?.startMin).toBe(120); // 23:00
    expect(points[5]?.intervals[0]?.endMin).toBe(600); // 翌 07:00
  });

  it('handles split sleep correctly', () => {
    const records = [
      makeRecord('2026-04-30', 0, [
        { startAt: new Date(2026, 3, 30, 23, 0), endAt: new Date(2026, 4, 1, 2, 0) }, // 3h
        { startAt: new Date(2026, 4, 1, 3, 30), endAt: new Date(2026, 4, 1, 7, 0) }, // 3h30m
      ]),
    ];
    const points = aggregateForWeek(records, '2026-05-01');
    expect(points[5]?.sleepMinutes).toBe(3 * 60 + 3 * 60 + 30);
    expect(points[5]?.intervals).toHaveLength(2);
  });
});

describe('aggregateForMonth', () => {
  it('returns 30 points', () => {
    const points = aggregateForMonth([], '2026-05-01');
    expect(points).toHaveLength(30);
    expect(points[29]?.dateIso).toBe('2026-05-01');
  });

  it('uses the same per-day mapping as week', () => {
    const records = [makeRecord('2026-04-15', 2)];
    const points = aggregateForMonth(records, '2026-05-01');
    const matched = points.find((p) => p.dateIso === '2026-04-15');
    expect(matched?.mood).toBe(2);
  });
});

describe('aggregateForYear', () => {
  it('returns 12 month points ending on the month of endIso', () => {
    const points = aggregateForYear([], '2026-05-15');
    expect(points).toHaveLength(12);
    expect(points[0]?.dateIso).toBe('2025-06');
    expect(points[11]?.dateIso).toBe('2026-05');
    expect(points[11]?.label).toBe('5月');
  });

  it('uses null for months without records (gap)', () => {
    const points = aggregateForYear([], '2026-05-15');
    for (const p of points) {
      expect(p.mood).toBeNull();
      expect(p.sleepMinutes).toBeNull();
      expect(p.intervals).toEqual([]);
    }
  });

  it('computes the mean mood for a month', () => {
    const records = [
      makeRecord('2026-04-01', 2),
      makeRecord('2026-04-15', 0),
      makeRecord('2026-04-30', -2),
    ];
    const points = aggregateForYear(records, '2026-05-01');
    const april = points.find((p) => p.dateIso === '2026-04');
    expect(april?.mood).toBe(0); // (2 + 0 - 2) / 3
  });

  it('computes the mean sleep minutes from days that have intervals', () => {
    const records = [
      makeRecord('2026-04-01', 0, [
        { startAt: new Date(2026, 3, 1, 23, 0), endAt: new Date(2026, 3, 2, 7, 0) }, // 8h
      ]),
      makeRecord('2026-04-02', 0, [
        { startAt: new Date(2026, 3, 2, 23, 0), endAt: new Date(2026, 3, 3, 5, 0) }, // 6h
      ]),
    ];
    const points = aggregateForYear(records, '2026-05-01');
    const april = points.find((p) => p.dateIso === '2026-04');
    expect(april?.sleepMinutes).toBe(7 * 60); // (8h + 6h) / 2
    expect(april?.intervals).toHaveLength(1);
    expect(april?.intervals[0]?.startMin).toBe(120); // 23:00
    expect(april?.intervals[0]?.endMin).toBe(540); // 平均: (600 + 480) / 2
  });

  it('keeps mood null when month exists but no intervals', () => {
    const records = [makeRecord('2026-04-15', 1)]; // moodはあるが intervals 無し
    const points = aggregateForYear(records, '2026-05-01');
    const april = points.find((p) => p.dateIso === '2026-04');
    expect(april?.mood).toBe(1);
    expect(april?.sleepMinutes).toBeNull();
    expect(april?.intervals).toEqual([]);
  });
});

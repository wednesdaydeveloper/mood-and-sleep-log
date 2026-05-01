import { aggregateForMonth, aggregateForWeek } from '@/domain/chart-aggregation';
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

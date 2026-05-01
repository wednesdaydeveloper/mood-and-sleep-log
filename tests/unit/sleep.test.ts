import {
  DEFAULT_NEW_INTERVAL_MINUTES,
  MAX_INTERVALS_PER_DAY,
  TIMELINE_TOTAL_MINUTES,
  canAddInterval,
  clampLeftHandle,
  clampRightHandle,
  findInsertSlot,
  formatTimelineMinute,
  hasOverlap,
  minToPx,
  pxToMin,
  snapTo10Min,
  totalSleepMinutes,
  type SleepInterval,
} from '@/domain/sleep';

describe('snapTo10Min', () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 10], // Math.round(0.5) = 1
    [6, 10],
    [10, 10],
    [14, 10],
    [15, 20],
    [840, 840],
  ])('snaps %i to %i', (input, expected) => {
    expect(snapTo10Min(input)).toBe(expected);
  });
});

describe('hasOverlap', () => {
  const intervals: SleepInterval[] = [
    { id: 'a', startMin: 120, endMin: 300 },
    { id: 'b', startMin: 400, endMin: 600 },
  ];

  it('returns false when candidate is before all intervals', () => {
    expect(hasOverlap(intervals, { startMin: 0, endMin: 100 })).toBe(false);
  });

  it('returns false when candidate is after all intervals', () => {
    expect(hasOverlap(intervals, { startMin: 700, endMin: 800 })).toBe(false);
  });

  it('returns false when candidate is exactly between two intervals (no gap overlap)', () => {
    expect(hasOverlap(intervals, { startMin: 300, endMin: 400 })).toBe(false);
  });

  it('returns true when candidate partially overlaps an interval', () => {
    expect(hasOverlap(intervals, { startMin: 250, endMin: 350 })).toBe(true);
  });

  it('returns true when candidate fully contains an interval', () => {
    expect(hasOverlap(intervals, { startMin: 100, endMin: 700 })).toBe(true);
  });

  it('returns true when candidate is fully inside an interval', () => {
    expect(hasOverlap(intervals, { startMin: 200, endMin: 250 })).toBe(true);
  });

  it('excludes interval matching excludeId from comparison', () => {
    expect(hasOverlap(intervals, { startMin: 250, endMin: 350 }, 'a')).toBe(false);
  });
});

describe('clampLeftHandle', () => {
  const intervals: SleepInterval[] = [
    { id: 'a', startMin: 100, endMin: 200 },
    { id: 'b', startMin: 300, endMin: 500 },
  ];

  it('clamps to 0 when no left neighbor and proposed is negative', () => {
    expect(clampLeftHandle(intervals, 'a', -50)).toBe(0);
  });

  it('clamps to left neighbor end when proposed is too small', () => {
    expect(clampLeftHandle(intervals, 'b', 150)).toBe(200); // a.endMin
  });

  it('clamps to (endMin - 10) max so the interval keeps minimum length', () => {
    expect(clampLeftHandle(intervals, 'b', 600)).toBe(490); // 500 - 10
  });

  it('snaps to 10-min grid', () => {
    expect(clampLeftHandle(intervals, 'b', 354)).toBe(350);
  });

  it('returns snapped value if currentId not found', () => {
    expect(clampLeftHandle(intervals, 'unknown', 123)).toBe(120);
  });
});

describe('clampRightHandle', () => {
  const intervals: SleepInterval[] = [
    { id: 'a', startMin: 100, endMin: 200 },
    { id: 'b', startMin: 300, endMin: 500 },
  ];

  it('clamps to TIMELINE_TOTAL_MINUTES when no right neighbor and proposed is over', () => {
    expect(clampRightHandle(intervals, 'b', 999)).toBe(TIMELINE_TOTAL_MINUTES);
  });

  it('clamps to right neighbor start when proposed is too large', () => {
    expect(clampRightHandle(intervals, 'a', 400)).toBe(300); // b.startMin
  });

  it('clamps to (startMin + 10) min so the interval keeps minimum length', () => {
    expect(clampRightHandle(intervals, 'b', 0)).toBe(310); // 300 + 10
  });
});

describe('totalSleepMinutes', () => {
  it('sums durations of all intervals', () => {
    expect(
      totalSleepMinutes([
        { id: 'a', startMin: 0, endMin: 100 },
        { id: 'b', startMin: 200, endMin: 350 },
      ]),
    ).toBe(250);
  });

  it('returns 0 for empty list', () => {
    expect(totalSleepMinutes([])).toBe(0);
  });
});

describe('formatTimelineMinute', () => {
  it.each([
    [0, '21:00'],
    [60, '22:00'],
    [180, '00:00'], // 21 + 3 = 24 → 00
    [300, '02:00'],
    [600, '07:00'],
    [840, '11:00'],
  ])('formats %i as %s', (min, expected) => {
    expect(formatTimelineMinute(min)).toBe(expected);
  });

  it('formats partial hours', () => {
    expect(formatTimelineMinute(30)).toBe('21:30');
    expect(formatTimelineMinute(195)).toBe('00:15');
  });
});

describe('findInsertSlot', () => {
  it('returns a default-length slot centered on tap when empty', () => {
    const slot = findInsertSlot([], 200);
    expect(slot).toEqual({ startMin: 170, endMin: 230 });
  });

  it('finds a gap when tap position overlaps existing interval', () => {
    const intervals: SleepInterval[] = [{ id: 'a', startMin: 100, endMin: 300 }];
    const slot = findInsertSlot(intervals, 200);
    // 重なる場合は最初の隙間 (0..100) に収まる
    expect(slot).not.toBeNull();
    expect(slot!.startMin).toBeGreaterThanOrEqual(0);
    expect(hasOverlap(intervals, slot!)).toBe(false);
  });

  it('returns null when no slot of MIN_INTERVAL_MINUTES is available', () => {
    const intervals: SleepInterval[] = [
      { id: 'a', startMin: 0, endMin: TIMELINE_TOTAL_MINUTES },
    ];
    expect(findInsertSlot(intervals, 100)).toBeNull();
  });

  it('uses requested length when room permits', () => {
    const slot = findInsertSlot([], 100, DEFAULT_NEW_INTERVAL_MINUTES);
    expect(slot!.endMin - slot!.startMin).toBe(DEFAULT_NEW_INTERVAL_MINUTES);
  });
});

describe('canAddInterval', () => {
  it('returns true below the limit', () => {
    const intervals = Array.from({ length: MAX_INTERVALS_PER_DAY - 1 }, (_, i) => ({
      id: `${i}`,
      startMin: i * 20,
      endMin: i * 20 + 10,
    }));
    expect(canAddInterval(intervals)).toBe(true);
  });

  it('returns false at the limit', () => {
    const intervals = Array.from({ length: MAX_INTERVALS_PER_DAY }, (_, i) => ({
      id: `${i}`,
      startMin: i * 20,
      endMin: i * 20 + 10,
    }));
    expect(canAddInterval(intervals)).toBe(false);
  });
});

describe('coordinate conversions', () => {
  const usable = 280;

  it('round-trips with snap fidelity', () => {
    const min = 360;
    const px = minToPx(min, usable);
    expect(pxToMin(px, usable)).toBe(min);
  });

  it('pxToMin returns 0 for non-positive width', () => {
    expect(pxToMin(100, 0)).toBe(0);
  });

  it('snaps pxToMin output to 10-minute grid', () => {
    // px representing ~ 17 min should snap to 20
    const px = minToPx(17, usable);
    expect(pxToMin(px, usable)).toBe(20);
  });
});

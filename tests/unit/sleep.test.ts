import { hasOverlap, snapTo10Min, type SleepInterval } from '@/domain/sleep';

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

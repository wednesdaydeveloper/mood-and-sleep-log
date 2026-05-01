import { fromIsoDate, toIsoDate, todayIso, yesterdayIso } from '@/lib/date';

describe('toIsoDate', () => {
  it('formats single-digit month and day with zero padding', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formats double-digit month and day correctly', () => {
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('fromIsoDate', () => {
  it('parses ISO yyyy-MM-dd into a Date at local midnight', () => {
    const d = fromIsoDate('2026-04-30');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(30);
    expect(d.getHours()).toBe(0);
  });

  it('round-trips with toIsoDate', () => {
    const iso = '2026-04-30';
    expect(toIsoDate(fromIsoDate(iso))).toBe(iso);
  });
});

describe('yesterdayIso vs todayIso', () => {
  it('yesterday is one day earlier than today', () => {
    const today = fromIsoDate(todayIso());
    const yesterday = fromIsoDate(yesterdayIso());
    const diffMs = today.getTime() - yesterday.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});

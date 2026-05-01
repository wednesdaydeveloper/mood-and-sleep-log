import { toDbInterval, toTimelineInterval } from '@/domain/sleep-mapping';

describe('sleep-mapping', () => {
  const recordDate = '2026-04-30';

  it('round-trips a single interval (23:00 - 02:00)', () => {
    const ui = { id: 'x', startMin: 120, endMin: 300 }; // 23:00 - 02:00 翌日
    const db = toDbInterval(recordDate, ui);
    expect(toTimelineInterval(recordDate, { id: 'x', ...db })).toEqual(ui);
  });

  it('round-trips a split sleep (23:00-02:00 + 03:30-07:00)', () => {
    const ivs = [
      { id: 'a', startMin: 120, endMin: 300 },
      { id: 'b', startMin: 390, endMin: 600 },
    ];
    for (const ui of ivs) {
      const db = toDbInterval(recordDate, ui);
      expect(toTimelineInterval(recordDate, { id: ui.id, ...db })).toEqual(ui);
    }
  });

  it('clamps DB times outside the timeline range to 0..840', () => {
    const before = toTimelineInterval(recordDate, {
      id: 'pre',
      startAt: new Date(2026, 3, 30, 18, 0),
      endAt: new Date(2026, 3, 30, 19, 0),
    });
    expect(before.startMin).toBe(0);
    expect(before.endMin).toBe(0);

    const after = toTimelineInterval(recordDate, {
      id: 'post',
      startAt: new Date(2026, 4, 1, 12, 0),
      endAt: new Date(2026, 4, 1, 13, 0),
    });
    expect(after.startMin).toBe(840);
    expect(after.endMin).toBe(840);
  });

  it('toDbInterval preserves the timeline minute as exact local Date', () => {
    const { startAt } = toDbInterval(recordDate, { id: 'a', startMin: 0, endMin: 60 });
    expect(startAt.getHours()).toBe(21);
    expect(startAt.getMinutes()).toBe(0);
    expect(startAt.getDate()).toBe(30);
  });

  it('toDbInterval crosses midnight correctly', () => {
    const { endAt } = toDbInterval(recordDate, { id: 'a', startMin: 0, endMin: 240 }); // 21:00 - 翌 01:00
    expect(endAt.getDate()).toBe(1); // 翌日
    expect(endAt.getHours()).toBe(1);
  });
});

import { recordsToCsv } from '@/domain/csv';
import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

function makeRecord(
  date: string,
  moodScore: -2 | -1 | 0 | 1 | 2,
  moodTags: string[] = [],
  memo: string | null = null,
  intervals: { startAt: Date; endAt: Date }[] = [],
): DailyRecordWithIntervals {
  return {
    id: `id-${date}`,
    date,
    moodScore,
    moodTags,
    memo,
    intervals: intervals.map((iv, i) => ({ id: `iv-${i}`, ...iv })),
    createdAt: new Date(date),
    updatedAt: new Date(date),
  };
}

describe('recordsToCsv', () => {
  it('outputs header even when records are empty', () => {
    const csv = recordsToCsv([]);
    expect(csv).toContain('date,moodScore,moodTags,memo,sleepIntervals');
  });

  it('starts with UTF-8 BOM', () => {
    const csv = recordsToCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('serializes a record with tags, memo, and one interval', () => {
    const records = [
      makeRecord(
        '2026-04-30',
        1,
        ['楽しい', '感謝'],
        '友人と食事',
        [{ startAt: new Date(2026, 3, 30, 23, 30), endAt: new Date(2026, 4, 1, 7, 30) }],
      ),
    ];
    const csv = recordsToCsv(records);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe(
      '2026-04-30,1,"楽しい,感謝","友人と食事","23:30-07:30"',
    );
  });

  it('escapes embedded double-quotes by doubling them', () => {
    const records = [makeRecord('2026-04-30', 0, [], '彼は"良い"と言った', [])];
    const csv = recordsToCsv(records);
    expect(csv).toContain('"彼は""良い""と言った"');
  });

  it('joins multiple sleep intervals with comma inside the quoted field', () => {
    const records = [
      makeRecord('2026-04-29', -1, ['不安', '鬱'], '眠りが浅かった', [
        { startAt: new Date(2026, 3, 29, 23, 0), endAt: new Date(2026, 3, 30, 2, 0) },
        { startAt: new Date(2026, 3, 30, 3, 30), endAt: new Date(2026, 3, 30, 7, 0) },
      ]),
    ];
    const csv = recordsToCsv(records);
    expect(csv).toContain('"23:00-02:00,03:30-07:00"');
  });

  it('sorts rows by date ascending', () => {
    const records = [
      makeRecord('2026-04-30', 0),
      makeRecord('2026-04-25', 1),
      makeRecord('2026-04-28', -1),
    ];
    const csv = recordsToCsv(records);
    const dataRows = csv.split('\n').slice(1);
    expect(dataRows[0]).toMatch(/^2026-04-25/);
    expect(dataRows[1]).toMatch(/^2026-04-28/);
    expect(dataRows[2]).toMatch(/^2026-04-30/);
  });

  it('keeps empty memo as quoted empty string', () => {
    const records = [makeRecord('2026-04-30', 0)];
    const csv = recordsToCsv(records);
    expect(csv).toContain(',"",""');
  });
});

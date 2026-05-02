import { parseCsv, recordsToCsv } from '@/domain/csv';
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
    sleepAid: null,
    prnMedication: null,
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

describe('parseCsv', () => {
  it('returns an empty result when CSV is empty', () => {
    const result = parseCsv('');
    expect(result.records).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects header that does not match', () => {
    const result = parseCsv('foo,bar,baz\n');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/ヘッダー/);
  });

  it('parses a header-only CSV without errors and no records', () => {
    const result = parseCsv('date,moodScore,moodTags,memo,sleepIntervals\n');
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('strips UTF-8 BOM transparently', () => {
    const csv = '﻿date,moodScore,moodTags,memo,sleepIntervals\n2026-04-25,0,"","",""\n';
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.date).toBe('2026-04-25');
  });

  it('parses a single record with tags, memo and intervals', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,1,"楽しい,感謝","友人と食事","23:30-07:30"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    const r = result.records[0]!;
    expect(r.moodScore).toBe(1);
    expect(r.moodTags).toEqual(['楽しい', '感謝']);
    expect(r.memo).toBe('友人と食事');
    expect(r.intervals).toHaveLength(1);
    expect(r.intervals[0]?.startMin).toBe(150); // 23:30 = 21:00 + 2h30m
    expect(r.intervals[0]?.endMin).toBe(630); // 07:30 = 21:00 + 10h30m
  });

  it('parses split sleep intervals separated by comma inside quoted field', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-29,-1,"不安,鬱","","23:00-02:00,03:30-07:00"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.intervals).toHaveLength(2);
  });

  it('treats double-quote escapes correctly', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,0,"","彼は""良い""と言った",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.memo).toBe('彼は"良い"と言った');
  });

  it('reports invalid moodScore', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,5,"","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.line).toBe(2);
    expect(result.errors[0]?.message).toMatch(/moodScore/);
  });

  it('reports invalid date format', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026/04/30,0,"","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/日付/);
  });

  it('reports unknown tag', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,0,"未知のタグ","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/未定義のタグ/);
  });

  it('reports invalid time range', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,0,"","","12:00-15:00"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/睡眠時間帯/);
  });

  it('skips blank lines', () => {
    const csv = [
      'date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-30,0,"","",""',
      '',
      '2026-04-29,-1,"","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
  });

  it('round-trips with recordsToCsv', () => {
    const csv = [
      '﻿date,moodScore,moodTags,memo,sleepIntervals',
      '2026-04-25,0,"","",""',
      '2026-04-29,-1,"不安","眠れない","23:00-02:00,03:30-07:00"',
      '2026-04-30,1,"楽しい,感謝","友人と食事","23:30-07:30"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(3);
  });
});

import { parseCsv, recordsToCsv } from '@/domain/csv';
import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

type MakeRecordOpts = {
  moodTags?: string[];
  memo?: string | null;
  intervals?: { startAt: Date; endAt: Date }[];
  sleepAid?: DailyRecordWithIntervals['sleepAid'];
  prnMedication?: DailyRecordWithIntervals['prnMedication'];
  event?: string | null;
};

function makeRecord(
  date: string,
  moodScore: -2 | -1 | 0 | 1 | 2,
  opts: MakeRecordOpts = {},
): DailyRecordWithIntervals {
  return {
    id: `id-${date}`,
    date,
    moodScore,
    moodTags: opts.moodTags ?? [],
    memo: opts.memo ?? null,
    sleepAid: opts.sleepAid ?? null,
    prnMedication: opts.prnMedication ?? null,
    event: opts.event ?? null,
    intervals: (opts.intervals ?? []).map((iv, i) => ({ id: `iv-${i}`, ...iv })),
    createdAt: new Date(date),
    updatedAt: new Date(date),
  };
}

const HEADER_V13 = 'date,moodScore,moodTags,memo,sleepIntervals,sleepAid,prnMedication,event';

describe('recordsToCsv', () => {
  it('outputs v1.3 header (8 columns) even when records are empty', () => {
    const csv = recordsToCsv([]);
    expect(csv).toContain(HEADER_V13);
  });

  it('starts with UTF-8 BOM', () => {
    const csv = recordsToCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('serializes a record with tags, memo, and one interval (no medication, no event)', () => {
    const records = [
      makeRecord('2026-04-30', 1, {
        moodTags: ['楽しい', '感謝'],
        memo: '友人と食事',
        intervals: [
          { startAt: new Date(2026, 3, 30, 23, 30), endAt: new Date(2026, 4, 1, 7, 30) },
        ],
      }),
    ];
    const csv = recordsToCsv(records);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe(
      '2026-04-30,1,"楽しい,感謝","友人と食事","23:30-07:30","","",""',
    );
  });

  it('serializes medication stable keys', () => {
    const records = [
      makeRecord('2026-04-30', 0, {
        sleepAid: 'lunesta-0.5',
        prnMedication: 'lunesta-2.0',
      }),
    ];
    const csv = recordsToCsv(records);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe('2026-04-30,0,"","","","lunesta-0.5","lunesta-2.0",""');
  });

  it('serializes event as plain text', () => {
    const records = [
      makeRecord('2026-04-30', 0, {
        event: '梅田でショッピング',
      }),
    ];
    const csv = recordsToCsv(records);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe('2026-04-30,0,"","","","","","梅田でショッピング"');
  });

  it('serializes null medication / null event as empty string', () => {
    const records = [makeRecord('2026-04-30', 0)];
    const csv = recordsToCsv(records);
    const dataRow = csv.split('\n')[1];
    expect(dataRow?.endsWith(',"","",""')).toBe(true);
  });

  it('escapes embedded double-quotes by doubling them', () => {
    const records = [makeRecord('2026-04-30', 0, { memo: '彼は"良い"と言った' })];
    const csv = recordsToCsv(records);
    expect(csv).toContain('"彼は""良い""と言った"');
  });

  it('joins multiple sleep intervals with comma inside the quoted field', () => {
    const records = [
      makeRecord('2026-04-29', -1, {
        moodTags: ['不安', '鬱'],
        memo: '眠りが浅かった',
        intervals: [
          { startAt: new Date(2026, 3, 29, 23, 0), endAt: new Date(2026, 3, 30, 2, 0) },
          { startAt: new Date(2026, 3, 30, 3, 30), endAt: new Date(2026, 3, 30, 7, 0) },
        ],
      }),
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
    const result = parseCsv(HEADER_V13 + '\n');
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('strips UTF-8 BOM transparently', () => {
    const csv = '﻿' + HEADER_V13 + '\n2026-04-25,0,"","","","","",""\n';
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.date).toBe('2026-04-25');
  });

  it('parses a single record with tags, memo and intervals', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,1,"楽しい,感謝","友人と食事","23:30-07:30","","",""',
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
    expect(r.sleepAid).toBeNull();
    expect(r.prnMedication).toBeNull();
    expect(r.event).toBeNull();
  });

  it('parses event field', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","","","","梅田でショッピング"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.event).toBe('梅田でショッピング');
  });

  it('parses event with embedded quotes and commas', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","","","","梅田、なんば（""友人""）"',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.event).toBe('梅田、なんば（"友人"）');
  });

  it('parses sleepAid and prnMedication stable keys', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","","lunesta-0.5","lunesta-2.0",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.sleepAid).toBe('lunesta-0.5');
    expect(result.records[0]?.prnMedication).toBe('lunesta-2.0');
  });

  it('falls back unknown medication keys to null without raising errors', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","","lunesta-99","unknown-drug",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.sleepAid).toBeNull();
    expect(result.records[0]?.prnMedication).toBeNull();
  });

  it('parses split sleep intervals separated by comma inside quoted field', () => {
    const csv = [
      HEADER_V13,
      '2026-04-29,-1,"不安,鬱","","23:00-02:00,03:30-07:00","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.intervals).toHaveLength(2);
  });

  it('treats double-quote escapes correctly', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","彼は""良い""と言った","","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records[0]?.memo).toBe('彼は"良い"と言った');
  });

  it('reports invalid moodScore', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,5,"","","","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.line).toBe(2);
    expect(result.errors[0]?.message).toMatch(/moodScore/);
  });

  it('reports invalid date format', () => {
    const csv = [
      HEADER_V13,
      '2026/04/30,0,"","","","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/日付/);
  });

  it('reports unknown tag', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"未知のタグ","","","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/未定義のタグ/);
  });

  it('reports invalid time range', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","12:00-15:00","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/睡眠時間帯/);
  });

  it('skips blank lines', () => {
    const csv = [
      HEADER_V13,
      '2026-04-30,0,"","","","","",""',
      '',
      '2026-04-29,-1,"","","","","",""',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
  });

  it('round-trips with recordsToCsv (current 8-column format with event)', () => {
    const records = [
      makeRecord('2026-04-30', 1, {
        moodTags: ['楽しい'],
        sleepAid: 'lunesta-0.5',
        prnMedication: 'lunesta-1.0',
        event: '美容院',
      }),
    ];
    const csv = recordsToCsv(records);
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.sleepAid).toBe('lunesta-0.5');
    expect(result.records[0]?.prnMedication).toBe('lunesta-1.0');
    expect(result.records[0]?.event).toBe('美容院');
  });

  describe('legacy 7-column format (v1.2)', () => {
    const HEADER_V12 = 'date,moodScore,moodTags,memo,sleepIntervals,sleepAid,prnMedication';

    it('accepts header without event and defaults event to null', () => {
      const csv = [
        HEADER_V12,
        '2026-04-30,1,"楽しい","友人と食事","23:30-07:30","lunesta-0.5","lunesta-1.0"',
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]?.sleepAid).toBe('lunesta-0.5');
      expect(result.records[0]?.prnMedication).toBe('lunesta-1.0');
      expect(result.records[0]?.event).toBeNull();
    });
  });

  describe('legacy 5-column format (v1.0 / v1.1)', () => {
    it('accepts header without sleepAid / prnMedication / event and defaults them to null', () => {
      const csv = [
        'date,moodScore,moodTags,memo,sleepIntervals',
        '2026-04-30,1,"楽しい","友人と食事","23:30-07:30"',
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]?.sleepAid).toBeNull();
      expect(result.records[0]?.prnMedication).toBeNull();
      expect(result.records[0]?.event).toBeNull();
      expect(result.records[0]?.moodTags).toEqual(['楽しい']);
    });

    it('rejects rows that have extra columns under the legacy header', () => {
      // ヘッダーは 5 列なのに、データ行が 8 列だった場合は行ごとにエラー
      const csv = [
        'date,moodScore,moodTags,memo,sleepIntervals',
        '2026-04-30,0,"","","","lunesta-0.5","",""',
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.records).toEqual([]);
      expect(result.errors[0]?.message).toMatch(/列数/);
    });
  });
});

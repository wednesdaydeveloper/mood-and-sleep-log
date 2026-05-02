import { formatPeriodRange } from '@/domain/chart-period-format';

describe('formatPeriodRange', () => {
  describe('year', () => {
    it('accepts yyyy-MM start (集約点の dateIso 形式) without throwing', () => {
      expect(formatPeriodRange('year', '2025-06', '2026-05-02')).toBe(
        '2025/6 〜 2026/5',
      );
    });

    it('accepts yyyy-MM-dd on both ends', () => {
      expect(formatPeriodRange('year', '2025-06-15', '2026-05-02')).toBe(
        '2025/6 〜 2026/5',
      );
    });

    it('strips leading zero from the month component', () => {
      expect(formatPeriodRange('year', '2025-01', '2025-12-31')).toBe(
        '2025/1 〜 2025/12',
      );
    });

    it('throws on a malformed iso input', () => {
      expect(() => formatPeriodRange('year', 'not-a-date', '2026-05-02')).toThrow(
        /Invalid year-month/,
      );
    });
  });

  describe('week / month', () => {
    it('formats yyyy-MM-dd as M/D(曜) 〜 M/D(曜)', () => {
      // 2026-04-25 は土曜、2026-05-01 は金曜
      expect(formatPeriodRange('week', '2026-04-25', '2026-05-01')).toBe(
        '4/25(土) 〜 5/1(金)',
      );
    });

    it('rejects yyyy-MM (week ではフルパスが必須)', () => {
      expect(() => formatPeriodRange('week', '2025-06', '2026-05-02')).toThrow();
    });
  });
});

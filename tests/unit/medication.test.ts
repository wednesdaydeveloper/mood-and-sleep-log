import {
  MEDICATION_LABEL,
  NONE_LABEL,
  PRN_MEDICATION_OPTIONS,
  SLEEP_AID_OPTIONS,
  coercePrnMedication,
  coerceSleepAid,
  isPrnMedication,
  isSleepAid,
  medicationLabel,
} from '@/domain/medication';

describe('SLEEP_AID_OPTIONS / PRN_MEDICATION_OPTIONS', () => {
  it('has 8 sleep aid options', () => {
    expect(SLEEP_AID_OPTIONS).toHaveLength(8);
  });

  it('has 3 PRN medication options', () => {
    expect(PRN_MEDICATION_OPTIONS).toHaveLength(3);
  });

  it('all PRN options are also sleep aid options (overlap by spec)', () => {
    for (const v of PRN_MEDICATION_OPTIONS) {
      expect(SLEEP_AID_OPTIONS).toContain(v);
    }
  });
});

describe('MEDICATION_LABEL', () => {
  it('has a label for every sleep aid option', () => {
    for (const v of SLEEP_AID_OPTIONS) {
      expect(MEDICATION_LABEL[v]).toMatch(/.+/);
    }
  });

  it('produces Japanese labels', () => {
    expect(MEDICATION_LABEL['lunesta-0.5']).toBe('ルネスタ 0.5mg');
    expect(MEDICATION_LABEL['lunesta-3.0']).toBe('ルネスタ 3.0mg');
  });
});

describe('isSleepAid', () => {
  it('returns true for null', () => {
    expect(isSleepAid(null)).toBe(true);
  });

  it.each(SLEEP_AID_OPTIONS)('returns true for %p', (v) => {
    expect(isSleepAid(v)).toBe(true);
  });

  it.each(['lunesta-9.9', 'unknown', '', 0, undefined, {}])(
    'returns false for invalid %p',
    (v) => {
      expect(isSleepAid(v)).toBe(false);
    },
  );
});

describe('isPrnMedication', () => {
  it('returns true for null', () => {
    expect(isPrnMedication(null)).toBe(true);
  });

  it.each(PRN_MEDICATION_OPTIONS)('returns true for %p', (v) => {
    expect(isPrnMedication(v)).toBe(true);
  });

  it.each(['lunesta-0.5', 'unknown', ''])('returns false for non-PRN %p', (v) => {
    // 0.5mg は睡眠導入剤専用、頓服薬には含まれない
    expect(isPrnMedication(v)).toBe(false);
  });
});

describe('coerceSleepAid', () => {
  it('passes through valid keys', () => {
    expect(coerceSleepAid('lunesta-0.5')).toBe('lunesta-0.5');
  });

  it('returns null for empty string', () => {
    expect(coerceSleepAid('')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(coerceSleepAid(undefined)).toBeNull();
  });

  it('returns null for unknown values without throwing', () => {
    expect(coerceSleepAid('lunesta-9.9')).toBeNull();
    expect(coerceSleepAid(123)).toBeNull();
  });
});

describe('coercePrnMedication', () => {
  it('returns null for sleep-aid-only key (lunesta-0.5)', () => {
    expect(coercePrnMedication('lunesta-0.5')).toBeNull();
  });

  it('passes through valid PRN keys', () => {
    expect(coercePrnMedication('lunesta-2.0')).toBe('lunesta-2.0');
  });
});

describe('medicationLabel', () => {
  it('returns NONE_LABEL for null', () => {
    expect(medicationLabel(null)).toBe(NONE_LABEL);
  });

  it('returns Japanese label for known key', () => {
    expect(medicationLabel('lunesta-1.5')).toBe('ルネスタ 1.5mg');
  });
});

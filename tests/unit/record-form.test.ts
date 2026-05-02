import { DEFAULT_FORM_VALUES, recordFormSchema } from '@/domain/record-form';

describe('recordFormSchema', () => {
  const baseValues = {
    moodScore: 0 as const,
    moodTags: [],
    memo: null,
    sleepAid: null,
    prnMedication: null,
  };

  it('accepts default values', () => {
    expect(recordFormSchema.safeParse(DEFAULT_FORM_VALUES).success).toBe(true);
  });

  describe('sleepAid', () => {
    it.each([
      'lunesta-0.25',
      'lunesta-0.5',
      'lunesta-0.75',
      'lunesta-1.0',
      'lunesta-1.5',
      'lunesta-2.0',
      'lunesta-2.5',
      'lunesta-3.0',
    ])('accepts valid value %s', (value) => {
      const result = recordFormSchema.safeParse({ ...baseValues, sleepAid: value });
      expect(result.success).toBe(true);
    });

    it('accepts null', () => {
      const result = recordFormSchema.safeParse({ ...baseValues, sleepAid: null });
      expect(result.success).toBe(true);
    });

    it('rejects unknown string', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        sleepAid: 'lunesta-99',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-string non-null value', () => {
      const result = recordFormSchema.safeParse({ ...baseValues, sleepAid: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('prnMedication', () => {
    it.each(['lunesta-1.0', 'lunesta-2.0', 'lunesta-3.0'])(
      'accepts valid value %s',
      (value) => {
        const result = recordFormSchema.safeParse({
          ...baseValues,
          prnMedication: value,
        });
        expect(result.success).toBe(true);
      },
    );

    it('accepts null', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        prnMedication: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects sleep-aid-only dose (lunesta-0.5)', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        prnMedication: 'lunesta-0.5',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DEFAULT_FORM_VALUES', () => {
    it('initializes both medications as null (= なし)', () => {
      expect(DEFAULT_FORM_VALUES.sleepAid).toBeNull();
      expect(DEFAULT_FORM_VALUES.prnMedication).toBeNull();
    });
  });
});

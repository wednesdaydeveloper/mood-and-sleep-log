import { DEFAULT_FORM_VALUES, recordFormSchema } from '@/domain/record-form';

describe('recordFormSchema', () => {
  const baseValues = {
    moodScore: 0 as const,
    moodTags: [],
    memo: null,
    sleepAid: null,
    prnMedication: null,
    event: null,
    diary: null,
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

  describe('event', () => {
    it('accepts null', () => {
      const result = recordFormSchema.safeParse({ ...baseValues, event: null });
      expect(result.success).toBe(true);
    });

    it('accepts a short string', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        event: '梅田でショッピング',
      });
      expect(result.success).toBe(true);
    });

    it('accepts exactly 200 chars', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        event: 'a'.repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it('rejects 201 chars', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        event: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('diary', () => {
    it('accepts null', () => {
      const result = recordFormSchema.safeParse({ ...baseValues, diary: null });
      expect(result.success).toBe(true);
    });

    it('accepts a long multi-line string', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        diary: '今日は\n良い1日だった。\n色々あった。',
      });
      expect(result.success).toBe(true);
    });

    it('accepts exactly 5000 chars', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        diary: 'a'.repeat(5000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects 5001 chars', () => {
      const result = recordFormSchema.safeParse({
        ...baseValues,
        diary: 'a'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DEFAULT_FORM_VALUES', () => {
    it('initializes optional fields as null', () => {
      expect(DEFAULT_FORM_VALUES.sleepAid).toBeNull();
      expect(DEFAULT_FORM_VALUES.prnMedication).toBeNull();
      expect(DEFAULT_FORM_VALUES.event).toBeNull();
      expect(DEFAULT_FORM_VALUES.diary).toBeNull();
    });
  });
});

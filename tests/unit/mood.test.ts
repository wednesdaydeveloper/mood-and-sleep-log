import { MOOD_EMOJI, MOOD_LABEL, MOOD_SCORES, isMoodScore } from '@/domain/mood';

describe('MOOD_SCORES', () => {
  it('contains exactly the five values from -2 to +2', () => {
    expect(MOOD_SCORES).toEqual([-2, -1, 0, 1, 2]);
  });
});

describe('MOOD_EMOJI', () => {
  it('maps each score to a non-empty emoji', () => {
    for (const score of MOOD_SCORES) {
      expect(MOOD_EMOJI[score]).toMatch(/.+/);
    }
  });

  it('uses distinct emoji per score', () => {
    const emojis = MOOD_SCORES.map((s) => MOOD_EMOJI[s]);
    expect(new Set(emojis).size).toBe(MOOD_SCORES.length);
  });
});

describe('MOOD_LABEL', () => {
  it('maps each score to a non-empty label', () => {
    for (const score of MOOD_SCORES) {
      expect(MOOD_LABEL[score]).toMatch(/.+/);
    }
  });
});

describe('isMoodScore', () => {
  it.each([-2, -1, 0, 1, 2])('returns true for valid score %i', (value) => {
    expect(isMoodScore(value)).toBe(true);
  });

  it.each([-3, 3, 0.5, NaN, Infinity])('returns false for invalid number %s', (value) => {
    expect(isMoodScore(value)).toBe(false);
  });

  it.each(['0', null, undefined, {}, []])('returns false for non-number %p', (value) => {
    expect(isMoodScore(value)).toBe(false);
  });
});

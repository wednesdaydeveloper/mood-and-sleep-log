import {
  TAG_CATEGORY_LABEL,
  TAG_NAMES,
  TAG_PRESETS,
  getTagsByCategory,
  isValidTagName,
  type TagCategory,
} from '@/domain/tags';

const ALL_CATEGORIES: TagCategory[] = ['negative', 'positive', 'state', 'thought'];

describe('TAG_PRESETS', () => {
  it('has tags for all four categories', () => {
    const categories = new Set(TAG_PRESETS.map((t) => t.category));
    expect(categories).toEqual(new Set(ALL_CATEGORIES));
  });

  it('has unique tag names across all categories', () => {
    const names = TAG_PRESETS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('matches the v1.1 preset count (negative: 12, positive: 10, state: 15, thought: 4)', () => {
    expect(getTagsByCategory('negative')).toHaveLength(12);
    expect(getTagsByCategory('positive')).toHaveLength(10);
    expect(getTagsByCategory('state')).toHaveLength(15);
    expect(getTagsByCategory('thought')).toHaveLength(4);
  });

  it('total tag count is 41', () => {
    expect(TAG_PRESETS).toHaveLength(41);
  });

  it('contains the v1.1 newly added tags', () => {
    const names = TAG_PRESETS.map((t) => t.name);
    for (const tag of [
      '退屈',
      '物足りない',
      '楽',
      '憂鬱',
      '集中できない',
      '軽躁',
      '軽鬱',
      '躁',
      'フラット',
      'アイデアが駆け巡る',
      '過活動',
    ]) {
      expect(names).toContain(tag);
    }
  });

  it('does not duplicate the existing 不安 tag', () => {
    const names = TAG_PRESETS.map((t) => t.name);
    const count = names.filter((n) => n === '不安').length;
    expect(count).toBe(1);
  });
});

describe('TAG_CATEGORY_LABEL', () => {
  it('has a Japanese label for every category', () => {
    for (const category of ALL_CATEGORIES) {
      expect(TAG_CATEGORY_LABEL[category]).toMatch(/.+/);
    }
  });
});

describe('isValidTagName', () => {
  it('returns true for known preset tag names', () => {
    expect(isValidTagName('不安')).toBe(true);
    expect(isValidTagName('楽しい')).toBe(true);
    expect(isValidTagName('鬱')).toBe(true);
    expect(isValidTagName('「逃げたい」')).toBe(true);
  });

  it('returns false for unknown names', () => {
    expect(isValidTagName('未定義タグ')).toBe(false);
    expect(isValidTagName('')).toBe(false);
  });
});

describe('getTagsByCategory', () => {
  it('returns only tags belonging to the requested category', () => {
    const result = getTagsByCategory('positive');
    expect(result.length).toBeGreaterThan(0);
    for (const tag of result) {
      expect(tag.category).toBe('positive');
    }
  });
});

describe('TAG_NAMES', () => {
  it('contains every preset name in the same order as TAG_PRESETS', () => {
    expect(TAG_NAMES).toEqual(TAG_PRESETS.map((t) => t.name));
  });
});

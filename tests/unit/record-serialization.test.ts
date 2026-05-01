import { parseMoodTags, serializeMoodTags } from '@/domain/record-serialization';

describe('serializeMoodTags', () => {
  it('serializes empty array as []', () => {
    expect(serializeMoodTags([])).toBe('[]');
  });

  it('serializes a list of valid tag names', () => {
    expect(serializeMoodTags(['不安', '楽しい'])).toBe('["不安","楽しい"]');
  });

  it('preserves order', () => {
    const tags = ['楽しい', '不安', '感謝'];
    const restored = JSON.parse(serializeMoodTags(tags));
    expect(restored).toEqual(tags);
  });
});

describe('parseMoodTags', () => {
  it('returns empty array for null / undefined / empty string', () => {
    expect(parseMoodTags(null)).toEqual([]);
    expect(parseMoodTags(undefined)).toEqual([]);
    expect(parseMoodTags('')).toEqual([]);
  });

  it('parses a valid JSON array of preset tag names', () => {
    expect(parseMoodTags('["不安","楽しい"]')).toEqual(['不安', '楽しい']);
  });

  it('falls back to empty array on malformed JSON', () => {
    expect(parseMoodTags('not-json')).toEqual([]);
    expect(parseMoodTags('{"a":1}')).toEqual([]);
  });

  it('filters out non-string elements', () => {
    expect(parseMoodTags('["不安",123,null,"楽しい"]')).toEqual(['不安', '楽しい']);
  });

  it('filters out tags that are not in the preset (forward compatibility)', () => {
    expect(parseMoodTags('["未定義タグ","不安"]')).toEqual(['不安']);
  });

  it('round-trips with serializeMoodTags', () => {
    const original = ['不安', '楽しい', '感謝'];
    expect(parseMoodTags(serializeMoodTags(original))).toEqual(original);
  });
});

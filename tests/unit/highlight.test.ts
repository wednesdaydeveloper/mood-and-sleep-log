import { splitWithHighlight } from '@/lib/highlight';

describe('splitWithHighlight', () => {
  it('returns empty array for empty text', () => {
    expect(splitWithHighlight('', 'abc')).toEqual([]);
  });

  it('returns single non-match segment when keyword is empty', () => {
    expect(splitWithHighlight('hello', '')).toEqual([{ text: 'hello', match: false }]);
  });

  it('returns single non-match segment when keyword is only whitespace', () => {
    expect(splitWithHighlight('hello', '   ')).toEqual([{ text: 'hello', match: false }]);
  });

  it('marks a single match in the middle', () => {
    expect(splitWithHighlight('foo abc bar', 'abc')).toEqual([
      { text: 'foo ', match: false },
      { text: 'abc', match: true },
      { text: ' bar', match: false },
    ]);
  });

  it('marks a match at the start', () => {
    expect(splitWithHighlight('abc tail', 'abc')).toEqual([
      { text: 'abc', match: true },
      { text: ' tail', match: false },
    ]);
  });

  it('marks a match at the end', () => {
    expect(splitWithHighlight('head abc', 'abc')).toEqual([
      { text: 'head ', match: false },
      { text: 'abc', match: true },
    ]);
  });

  it('marks multiple non-overlapping matches', () => {
    expect(splitWithHighlight('a-abc-abc-z', 'abc')).toEqual([
      { text: 'a-', match: false },
      { text: 'abc', match: true },
      { text: '-', match: false },
      { text: 'abc', match: true },
      { text: '-z', match: false },
    ]);
  });

  it('is case-insensitive but preserves original casing in segments', () => {
    expect(splitWithHighlight('Hello World', 'hello')).toEqual([
      { text: 'Hello', match: true },
      { text: ' World', match: false },
    ]);
  });

  it('handles Japanese text', () => {
    expect(splitWithHighlight('今日は嬉しい1日でした', '嬉しい')).toEqual([
      { text: '今日は', match: false },
      { text: '嬉しい', match: true },
      { text: '1日でした', match: false },
    ]);
  });

  it('returns single non-match when keyword is not found', () => {
    expect(splitWithHighlight('hello', 'xyz')).toEqual([{ text: 'hello', match: false }]);
  });
});

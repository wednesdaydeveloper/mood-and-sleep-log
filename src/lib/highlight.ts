/**
 * 文字列を「マッチ部分」と「非マッチ部分」のセグメント列に分割する純粋関数。
 * 検索キーワードのハイライト表示用。React Native の Text の中で
 * 各セグメントを <Text> でラップしてスタイルを切替えるのに使う。
 *
 * 大文字小文字は区別せず、全マッチを切り出す。重複や入れ子は考えない。
 */

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * `text` のうち `keyword` に一致する箇所を `match: true` のセグメントに分割。
 * `keyword` が空文字や全空白のときはマッチなしの単一セグメントを返す。
 */
export function splitWithHighlight(text: string, keyword: string): HighlightSegment[] {
  if (!text) return [];
  const trimmed = keyword.trim();
  if (trimmed === '') return [{ text, match: false }];

  const haystack = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = haystack.indexOf(needle, cursor);
    if (found === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (found > cursor) {
      segments.push({ text: text.slice(cursor, found), match: false });
    }
    segments.push({ text: text.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
  }

  return segments;
}

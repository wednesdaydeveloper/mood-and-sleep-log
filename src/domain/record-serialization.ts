// DailyRecord と DB スキーマの間のシリアライズ補助。
// moodTags は SQLite の TEXT カラムに JSON 配列文字列として格納する（要件設計 §6）。

import { logger } from '@/lib/logger';

import { isValidTagName } from './tags';

/**
 * 感情タグ配列を DB 保存用の JSON 文字列にシリアライズ。
 */
export function serializeMoodTags(tags: readonly string[]): string {
  return JSON.stringify(tags);
}

/**
 * DB から読み出した文字列を感情タグ配列にパース。
 *
 * - 不正な JSON は空配列にフォールバック
 * - 既知のプリセット名でないタグは除外（プリセット改廃時の互換性）
 */
export function parseMoodTags(serialized: string | null | undefined): string[] {
  if (!serialized) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (e) {
    logger.warn('record-serialization', 'parseMoodTags JSON failed', { error: String(e) });
    return [];
  }
  if (!Array.isArray(parsed)) {
    logger.warn('record-serialization', 'parseMoodTags non-array payload');
    return [];
  }
  const valid = parsed.filter(
    (value): value is string => typeof value === 'string' && isValidTagName(value),
  );
  if (valid.length !== parsed.length) {
    logger.warn('record-serialization', 'parseMoodTags filtered unknown tags', {
      raw: parsed.length,
      valid: valid.length,
    });
  }
  return valid;
}

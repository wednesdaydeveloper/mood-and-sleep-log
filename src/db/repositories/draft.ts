import { eq, lt } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../client';
import { draftRecord } from '../schema';

import { logger } from '@/lib/logger';
import type { MoodScore } from '@/domain/mood';
import { isValidTagName } from '@/domain/tags';

/** 下書きの保持期間: 最終更新から 7 日。 */
export const DRAFT_TTL_DAYS = 7;

const draftPayloadSchema = z.object({
  moodScore: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
  ]),
  moodTags: z.array(z.string().refine(isValidTagName)),
  memo: z.string().nullable(),
  intervals: z.array(
    z.object({
      id: z.string(),
      startMin: z.number().int(),
      endMin: z.number().int(),
    }),
  ),
});

export type DraftPayload = z.infer<typeof draftPayloadSchema>;
// MoodScore 型との整合性を型レベルで担保
const _moodScoreCheck: DraftPayload['moodScore'] = 0 as MoodScore;
void _moodScoreCheck;

export interface DraftRecord {
  date: string;
  payload: DraftPayload;
  updatedAt: Date;
}

export async function getDraft(date: string): Promise<DraftRecord | null> {
  const row = await db.query.draftRecord.findFirst({
    where: eq(draftRecord.date, date),
  });
  if (!row) return null;
  const parsed = safeParse(row.payload, date);
  if (!parsed) return null;
  return { date: row.date, payload: parsed, updatedAt: row.updatedAt };
}

export async function saveDraft(date: string, payload: DraftPayload): Promise<void> {
  const now = new Date();
  await db
    .insert(draftRecord)
    .values({ date, payload: JSON.stringify(payload), updatedAt: now })
    .onConflictDoUpdate({
      target: draftRecord.date,
      set: { payload: JSON.stringify(payload), updatedAt: now },
    });
}

export async function removeDraft(date: string): Promise<void> {
  await db.delete(draftRecord).where(eq(draftRecord.date, date));
}

/** 指定日時より古い下書きを削除（起動時のクリーンアップで使用）。 */
export async function cleanupDraftsOlderThan(threshold: Date): Promise<void> {
  await db.delete(draftRecord).where(lt(draftRecord.updatedAt, threshold));
}

/** TTL 過ぎの下書きを削除する。 */
export async function cleanupExpiredDrafts(): Promise<void> {
  const threshold = new Date(Date.now() - DRAFT_TTL_DAYS * 86400_000);
  await cleanupDraftsOlderThan(threshold);
}

function safeParse(json: string, date: string): DraftPayload | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    logger.warn('draft', 'JSON parse failed', { date, error: String(e) });
    return null;
  }
  const result = draftPayloadSchema.safeParse(raw);
  if (!result.success) {
    logger.warn('draft', 'schema validation failed', {
      date,
      issues: result.error.issues.length,
    });
    return null;
  }
  return result.data;
}

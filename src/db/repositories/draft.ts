import { eq, lt } from 'drizzle-orm';

import { db } from '../client';
import { draftRecord } from '../schema';

import type { MoodScore } from '@/domain/mood';

/** 下書きの保持期間: 最終更新から 7 日。 */
export const DRAFT_TTL_DAYS = 7;

export interface DraftPayload {
  moodScore: MoodScore;
  moodTags: string[];
  memo: string | null;
  /** タイムライン分 (21:00 起点) で保存。DB 保存時の Date 化を避けて軽量に。 */
  intervals: { id: string; startMin: number; endMin: number }[];
}

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
  const parsed = safeParse(row.payload);
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

function safeParse(json: string): DraftPayload | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as DraftPayload;
  } catch {
    return null;
  }
}

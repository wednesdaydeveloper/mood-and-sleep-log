import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '../client';
import { dailyRecord, sleepInterval } from '../schema';
import { newId } from '@/lib/id';
import { logger } from '@/lib/logger';
import { isMoodScore, type MoodScore } from '@/domain/mood';
import { parseMoodTags, serializeMoodTags } from '@/domain/record-serialization';

export interface DailyRecordWithIntervals {
  id: string;
  date: string; // ISO yyyy-MM-dd
  moodScore: MoodScore;
  moodTags: string[];
  memo: string | null;
  intervals: { id: string; startAt: Date; endAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveRecordInput {
  date: string; // ISO yyyy-MM-dd
  moodScore: MoodScore;
  moodTags: readonly string[];
  memo: string | null;
  intervals: readonly { startAt: Date; endAt: Date }[];
}

/** 指定日の記録を取得（紐づく睡眠区間を含む）。なければ null。 */
export async function findByDate(date: string): Promise<DailyRecordWithIntervals | null> {
  const record = await db.query.dailyRecord.findFirst({
    where: eq(dailyRecord.date, date),
    with: { intervals: true },
  });
  return record ? toDomain(record) : null;
}

/** 指定範囲（包括）の記録を新しい日付順で取得。 */
export async function list(fromIso: string, toIso: string): Promise<DailyRecordWithIntervals[]> {
  const records = await db.query.dailyRecord.findMany({
    where: and(gte(dailyRecord.date, fromIso), lte(dailyRecord.date, toIso)),
    with: { intervals: true },
    orderBy: [desc(dailyRecord.date)],
  });
  return records.map(toDomain);
}

/**
 * 1日の記録を upsert する。
 * 同じ date が既にあれば上書き、無ければ新規作成。
 * 睡眠区間は delete-then-insert で同期する（トランザクション内）。
 */
export async function upsert(input: SaveRecordInput): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    const existing = await tx.query.dailyRecord.findFirst({
      where: eq(dailyRecord.date, input.date),
    });

    let recordId: string;
    if (existing) {
      recordId = existing.id;
      await tx
        .update(dailyRecord)
        .set({
          moodScore: input.moodScore,
          moodTags: serializeMoodTags(input.moodTags),
          memo: input.memo,
          updatedAt: now,
        })
        .where(eq(dailyRecord.id, recordId));
      // 既存区間を一旦全削除（CASCADE 任せでなく明示的に）
      await tx.delete(sleepInterval).where(eq(sleepInterval.recordId, recordId));
    } else {
      recordId = newId();
      await tx.insert(dailyRecord).values({
        id: recordId,
        date: input.date,
        moodScore: input.moodScore,
        moodTags: serializeMoodTags(input.moodTags),
        memo: input.memo,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (input.intervals.length > 0) {
      await tx.insert(sleepInterval).values(
        input.intervals.map((iv) => ({
          id: newId(),
          recordId,
          startAt: iv.startAt,
          endAt: iv.endAt,
        })),
      );
    }
  });
}

/** 記録を削除する。睡眠区間は CASCADE で自動削除。 */
export async function deleteById(id: string): Promise<void> {
  await db.delete(dailyRecord).where(eq(dailyRecord.id, id));
}

interface RawDailyRecord {
  id: string;
  date: string;
  moodScore: number;
  moodTags: string;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
  intervals: { id: string; recordId: string; startAt: Date; endAt: Date }[];
}

function toDomain(raw: RawDailyRecord): DailyRecordWithIntervals {
  let moodScore: MoodScore;
  if (isMoodScore(raw.moodScore)) {
    moodScore = raw.moodScore;
  } else {
    // DB が壊れている場合のフォールバック。0（普通）に丸めてユーザーが上書き可能に
    logger.warn('daily-record-repo', 'invalid moodScore in DB, falling back to 0', {
      date: raw.date,
      raw: raw.moodScore,
    });
    moodScore = 0;
  }

  return {
    id: raw.id,
    date: raw.date,
    moodScore,
    moodTags: parseMoodTags(raw.moodTags),
    memo: raw.memo,
    intervals: raw.intervals.map((iv) => ({
      id: iv.id,
      startAt: iv.startAt,
      endAt: iv.endAt,
    })),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

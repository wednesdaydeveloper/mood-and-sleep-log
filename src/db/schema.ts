import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const dailyRecord = sqliteTable(
  'daily_record',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    moodScore: integer('mood_score').notNull(),
    moodTags: text('mood_tags').notNull(),
    memo: text('memo'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    dateUnique: uniqueIndex('idx_daily_record_date').on(t.date),
  }),
);

export const sleepInterval = sqliteTable(
  'sleep_interval',
  {
    id: text('id').primaryKey(),
    recordId: text('record_id')
      .notNull()
      .references(() => dailyRecord.id, { onDelete: 'cascade' }),
    startAt: integer('start_at', { mode: 'timestamp' }).notNull(),
    endAt: integer('end_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    byRecord: index('idx_sleep_interval_record').on(t.recordId),
    byStart: index('idx_sleep_interval_start').on(t.startAt),
  }),
);

export const draftRecord = sqliteTable('draft_record', {
  date: text('date').primaryKey(),
  payload: text('payload').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const dailyRecordRelations = relations(dailyRecord, ({ many }) => ({
  intervals: many(sleepInterval),
}));

export const sleepIntervalRelations = relations(sleepInterval, ({ one }) => ({
  record: one(dailyRecord, {
    fields: [sleepInterval.recordId],
    references: [dailyRecord.id],
  }),
}));

export type DailyRecord = typeof dailyRecord.$inferSelect;
export type NewDailyRecord = typeof dailyRecord.$inferInsert;
export type SleepInterval = typeof sleepInterval.$inferSelect;
export type NewSleepInterval = typeof sleepInterval.$inferInsert;
export type DraftRecord = typeof draftRecord.$inferSelect;
export type NewDraftRecord = typeof draftRecord.$inferInsert;

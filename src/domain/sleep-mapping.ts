// DB の SleepInterval（startAt/endAt: Date）と
// タイムライン UI の SleepInterval（startMin/endMin: 21:00 起点の経過分）の相互変換。

import { fromIsoDate } from '@/lib/date';

import { TIMELINE_START_HOUR, TIMELINE_TOTAL_MINUTES, type SleepInterval } from './sleep';

export interface DbSleepInterval {
  id: string;
  startAt: Date;
  endAt: Date;
}

/** 記録日の 21:00（タイムライン起点）の Date を返す。 */
function timelineBase(recordDateIso: string): Date {
  const base = fromIsoDate(recordDateIso);
  base.setHours(TIMELINE_START_HOUR, 0, 0, 0);
  return base;
}

/** DB → タイムライン分。レンジ外は端へクランプ。 */
export function toTimelineInterval(
  recordDateIso: string,
  db: DbSleepInterval,
): SleepInterval {
  const base = timelineBase(recordDateIso).getTime();
  const clampToRange = (n: number): number =>
    Math.min(TIMELINE_TOTAL_MINUTES, Math.max(0, Math.round(n)));
  const startMin = clampToRange((db.startAt.getTime() - base) / 60000);
  const endMin = clampToRange((db.endAt.getTime() - base) / 60000);
  return { id: db.id, startMin, endMin };
}

/** タイムライン分 → DB Date 形式。 */
export function toDbInterval(
  recordDateIso: string,
  ui: SleepInterval,
): { startAt: Date; endAt: Date } {
  const base = timelineBase(recordDateIso).getTime();
  return {
    startAt: new Date(base + ui.startMin * 60000),
    endAt: new Date(base + ui.endMin * 60000),
  };
}

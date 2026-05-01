// 睡眠区間に関する純粋関数群
// 詳細設計: docs/design/02-sleep-timeline-ui.md

const SNAP_MINUTES = 10;

/**
 * 分単位の値を10分粒度にスナップする。
 * 例: 23 → 20, 25 → 30
 */
export function snapTo10Min(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export interface SleepInterval {
  id: string;
  /** 21:00 起点の経過分（0 〜 840） */
  startMin: number;
  /** 21:00 起点の経過分（startMin < endMin <= 840） */
  endMin: number;
}

/**
 * 候補区間が既存区間と重複するかを判定。
 * `excludeId` を指定するとその ID の既存区間を比較対象から除外（自分自身の編集時に使用）。
 */
export function hasOverlap(
  intervals: readonly SleepInterval[],
  candidate: Pick<SleepInterval, 'startMin' | 'endMin'>,
  excludeId?: string,
): boolean {
  return intervals.some((i) => {
    if (excludeId !== undefined && i.id === excludeId) return false;
    return candidate.startMin < i.endMin && candidate.endMin > i.startMin;
  });
}

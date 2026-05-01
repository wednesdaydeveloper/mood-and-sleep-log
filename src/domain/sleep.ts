// 睡眠区間に関する純粋関数群
// 詳細設計: docs/design/02-sleep-timeline-ui.md

/** タイムライン横軸レンジ: 21:00 〜 翌 11:00 = 14 時間 = 840 分 */
export const TIMELINE_TOTAL_MINUTES = 840;

/** タイムラインの起点（21:00）。日跨ぎや時刻変換で使用 */
export const TIMELINE_START_HOUR = 21;

/** 入力粒度: 10 分 */
export const SNAP_MINUTES = 10;

/** 1 区間の最小長 */
export const MIN_INTERVAL_MINUTES = 10;

/** 1 日あたりの区間ソフト上限 */
export const MAX_INTERVALS_PER_DAY = 10;

/** 新規区間追加時のデフォルト長 */
export const DEFAULT_NEW_INTERVAL_MINUTES = 60;

/**
 * 分単位の値を 10 分粒度にスナップする。
 * 例: 23 → 20, 25 → 30
 */
export function snapTo10Min(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/** 値を [min, max] にクランプする。 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
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

/**
 * 左ハンドル（startMin）のドラッグ先を制約する。
 * - 自身の右ハンドルから 10 分手前まで
 * - 左隣の区間の終端より右まで
 */
export function clampLeftHandle(
  intervals: readonly SleepInterval[],
  currentId: string,
  proposedStart: number,
): number {
  const current = intervals.find((i) => i.id === currentId);
  if (!current) return snapTo10Min(proposedStart);
  const max = current.endMin - MIN_INTERVAL_MINUTES;
  const leftNeighbor = intervals
    .filter((i) => i.id !== currentId && i.endMin <= current.startMin)
    .sort((a, b) => b.endMin - a.endMin)[0];
  const min = leftNeighbor ? leftNeighbor.endMin : 0;
  return clamp(snapTo10Min(proposedStart), min, max);
}

/**
 * 右ハンドル（endMin）のドラッグ先を制約する。
 * - 自身の左ハンドルから 10 分後まで
 * - 右隣の区間の始端より左まで
 */
export function clampRightHandle(
  intervals: readonly SleepInterval[],
  currentId: string,
  proposedEnd: number,
): number {
  const current = intervals.find((i) => i.id === currentId);
  if (!current) return snapTo10Min(proposedEnd);
  const min = current.startMin + MIN_INTERVAL_MINUTES;
  const rightNeighbor = intervals
    .filter((i) => i.id !== currentId && i.startMin >= current.endMin)
    .sort((a, b) => a.startMin - b.startMin)[0];
  const max = rightNeighbor ? rightNeighbor.startMin : TIMELINE_TOTAL_MINUTES;
  return clamp(snapTo10Min(proposedEnd), min, max);
}

/** 区間の合計時間（分）。 */
export function totalSleepMinutes(intervals: readonly SleepInterval[]): number {
  return intervals.reduce((sum, i) => sum + (i.endMin - i.startMin), 0);
}

/** 21:00 起点の分（0〜840）を 'HH:mm' に整形。840 を超える分は翌日扱い。 */
export function formatTimelineMinute(min: number): string {
  const totalHours = TIMELINE_START_HOUR + Math.floor(min / 60);
  const hour = ((totalHours % 24) + 24) % 24;
  const minute = min % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * タップ位置から新規区間（既存とぶつからない）を見つける。
 * デフォルト長 (DEFAULT_NEW_INTERVAL_MINUTES) を確保できる位置にスナップ。
 * 確保できなければ null。
 */
export function findInsertSlot(
  intervals: readonly SleepInterval[],
  tappedMin: number,
  desiredLength: number = DEFAULT_NEW_INTERVAL_MINUTES,
): { startMin: number; endMin: number } | null {
  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);
  // タップ位置を中心に、希望長の区間を作る初期候補
  const half = Math.floor(desiredLength / 2);
  let start = snapTo10Min(tappedMin - half);
  let end = start + desiredLength;
  start = clamp(start, 0, TIMELINE_TOTAL_MINUTES - MIN_INTERVAL_MINUTES);
  end = clamp(end, start + MIN_INTERVAL_MINUTES, TIMELINE_TOTAL_MINUTES);

  if (!hasOverlap(sorted, { startMin: start, endMin: end })) {
    return { startMin: start, endMin: end };
  }

  // 既存区間の隙間を順に探索し、空きが MIN_INTERVAL_MINUTES 以上ある最初の区間に収める
  let cursor = 0;
  for (const iv of sorted) {
    const gap = iv.startMin - cursor;
    if (gap >= MIN_INTERVAL_MINUTES) {
      const len = Math.min(desiredLength, gap);
      return { startMin: cursor, endMin: cursor + len };
    }
    cursor = Math.max(cursor, iv.endMin);
  }
  const tailGap = TIMELINE_TOTAL_MINUTES - cursor;
  if (tailGap >= MIN_INTERVAL_MINUTES) {
    const len = Math.min(desiredLength, tailGap);
    return { startMin: cursor, endMin: cursor + len };
  }
  return null;
}

/** 区間を追加できるかを判定（上限・空きスロットの両方）。 */
export function canAddInterval(intervals: readonly SleepInterval[]): boolean {
  return intervals.length < MAX_INTERVALS_PER_DAY;
}

/** ピクセル → タイムライン分。usableWidth は描画領域の幅。 */
export function pxToMin(px: number, usableWidth: number): number {
  if (usableWidth <= 0) return 0;
  return snapTo10Min((px / usableWidth) * TIMELINE_TOTAL_MINUTES);
}

/** タイムライン分 → ピクセル。 */
export function minToPx(min: number, usableWidth: number): number {
  return (min / TIMELINE_TOTAL_MINUTES) * usableWidth;
}

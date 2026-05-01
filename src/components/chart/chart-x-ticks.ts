import { type ChartPeriod } from '@/domain/chart-aggregation';

/**
 * 各折れ線グラフ内に表示する X 軸ティックのインデックスを返す。
 * - week:  全 7 点
 * - month: 末尾起算で 7 日ごと（"今日" を必ず含む）
 * - year:  全 12 点
 */
export function computeXTickIndices(count: number, period: ChartPeriod): number[] {
  if (count <= 0) return [];
  if (period === 'week') {
    return Array.from({ length: count }, (_, i) => i);
  }
  if (period === 'month') {
    const set = new Set<number>();
    for (let i = count - 1; i >= 0; i -= 7) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }
  // year
  return Array.from({ length: count }, (_, i) => i);
}

import { StyleSheet, Text, View } from 'react-native';

import { type ChartPeriod, type ChartPoint } from '@/domain/chart-aggregation';

interface ChartXAxisProps {
  points: readonly ChartPoint[];
  period: ChartPeriod;
}

/**
 * 3 段グラフの共通 X 軸ラベル。Victory のラベルを使わず手動描画することで
 * 各段（折れ線・縦帯）と確実に同じ刻みでラベルを表示する。
 *
 * - week: すべての日付
 * - month: 7 日ごと（週単位）
 * - year: 月ごと（M6 で対応）
 */
export function ChartXAxis({ points, period }: ChartXAxisProps) {
  const labelPositions = computeLabelPositions(points.length, period);
  return (
    <View style={styles.row}>
      {points.map((p, index) => (
        <View key={p.dateIso} style={styles.cell}>
          {labelPositions.has(index) ? <Text style={styles.label}>{p.label}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function computeLabelPositions(count: number, period: ChartPeriod): Set<number> {
  const set = new Set<number>();
  if (count === 0) return set;
  if (period === 'week') {
    for (let i = 0; i < count; i++) set.add(i);
    return set;
  }
  if (period === 'month') {
    // 7 日ごと（最後も入れる）
    for (let i = 0; i < count; i += 7) set.add(i);
    set.add(count - 1);
    return set;
  }
  // year は M6 で実装。当面は両端のみ
  set.add(0);
  set.add(count - 1);
  return set;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
});

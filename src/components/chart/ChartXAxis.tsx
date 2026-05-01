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
 * - month: 末尾起算で 7 日ごと（"今日" を必ず含む）
 * - year: 月ごと（M6 で対応）
 *
 * セル幅が狭い場合でもラベルが折り返されないよう、
 * 各ラベルを絶対配置で中央揃えにし numberOfLines={1} で 1 行に固定する。
 */
export function ChartXAxis({ points, period }: ChartXAxisProps) {
  const labelIndices = computeLabelPositions(points.length, period);
  const count = points.length;

  return (
    <View style={styles.container}>
      {Array.from(labelIndices).map((index) => {
        const p = points[index];
        if (!p) return null;
        const ratio = count > 1 ? index / (count - 1) : 0.5;
        return (
          <Text
            key={p.dateIso}
            style={[styles.label, { left: `${ratio * 100}%` }]}
            numberOfLines={1}
          >
            {p.label}
          </Text>
        );
      })}
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
    // 末尾（今日）から逆算して 7 日ごと
    for (let i = count - 1; i >= 0; i -= 7) set.add(i);
    return set;
  }
  // year は M6 で実装。当面は両端のみ
  set.add(0);
  set.add(count - 1);
  return set;
}

const styles = StyleSheet.create({
  container: {
    height: 18,
    marginHorizontal: 12,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: 2,
    fontSize: 10,
    color: '#666',
    width: 40,
    marginLeft: -20,
    textAlign: 'center',
  },
});

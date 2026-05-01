import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

import { type ChartPoint } from '@/domain/chart-aggregation';
import { useTheme } from '@/theme/useTheme';

interface MoodChartProps {
  points: readonly ChartPoint[];
  height: number;
}

interface ChartDatum extends Record<string, unknown> {
  index: number;
  mood: number | null;
}

export function MoodChart({ points, height }: MoodChartProps) {
  const { colors } = useTheme();
  const data: ChartDatum[] = points.map((p, index) => ({
    index,
    mood: p.mood,
  }));

  return (
    <View style={[styles.container, { height }]}>
      <CartesianChart<ChartDatum, 'index', 'mood'>
        data={data}
        xKey="index"
        yKeys={['mood']}
        domain={{ y: [-2, 2] }}
        domainPadding={{ left: 12, right: 12, top: 8, bottom: 8 }}
        axisOptions={{
          tickCount: { x: Math.min(data.length, 6), y: 5 },
          labelOffset: { x: 4, y: 4 },
          labelColor: colors.textSecondary,
          lineColor: colors.chartGrid,
          formatYLabel: (v) => `${v}`,
          formatXLabel: () => '',
        }}
      >
        {({ points: cp }) => (
          <>
            <Line points={cp.mood} color={colors.chartMood} strokeWidth={2} />
            <Scatter points={cp.mood} shape="circle" radius={3} color={colors.chartMood} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

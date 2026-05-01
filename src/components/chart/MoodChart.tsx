import { Platform, StyleSheet, View } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';
import { CartesianChart, Line, Scatter } from 'victory-native';

import { type ChartPeriod, type ChartPoint } from '@/domain/chart-aggregation';
import { useTheme } from '@/theme/useTheme';

import { computeXTickIndices } from './chart-x-ticks';

const axisFont = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 11,
});

interface MoodChartProps {
  points: readonly ChartPoint[];
  height: number;
  period: ChartPeriod;
}

interface ChartDatum extends Record<string, unknown> {
  index: number;
  mood: number | null;
}

export function MoodChart({ points, height, period }: MoodChartProps) {
  const { colors } = useTheme();
  const data: ChartDatum[] = points.map((p, index) => ({
    index,
    mood: p.mood,
  }));
  const xTicks = computeXTickIndices(points.length, period);

  return (
    <View style={[styles.container, { height }]}>
      <CartesianChart<ChartDatum, 'index', 'mood'>
        data={data}
        xKey="index"
        yKeys={['mood']}
        domain={{ y: [-2, 2] }}
        domainPadding={{ left: 12, right: 12, top: 8, bottom: 8 }}
        axisOptions={{
          font: axisFont,
          tickValues: { x: xTicks, y: [-2, -1, 0, 1, 2] },
          labelOffset: { x: 4, y: 6 },
          labelColor: colors.textPrimary,
          lineColor: { grid: { x: 'transparent', y: colors.chartGrid }, frame: colors.chartGrid },
          lineWidth: { grid: { x: 0, y: 0.5 }, frame: 1 },
          formatYLabel: (v) => `${v}`,
          formatXLabel: (v) => points[v]?.label ?? '',
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

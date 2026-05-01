import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

import { type ChartPoint } from '@/domain/chart-aggregation';
import { useTheme } from '@/theme/useTheme';

interface SleepDurationChartProps {
  points: readonly ChartPoint[];
  height: number;
}

interface ChartDatum extends Record<string, unknown> {
  index: number;
  sleepHours: number | null;
}

export function SleepDurationChart({ points, height }: SleepDurationChartProps) {
  const { colors } = useTheme();
  const data: ChartDatum[] = points.map((p, index) => ({
    index,
    sleepHours: p.sleepMinutes !== null ? p.sleepMinutes / 60 : null,
  }));

  const valid = data.map((d) => d.sleepHours).filter((v): v is number => v !== null);
  const min = Math.max(0, Math.floor((valid.length > 0 ? Math.min(...valid, 5) : 5) - 0.5));
  const max = Math.ceil((valid.length > 0 ? Math.max(...valid, 9) : 9) + 0.5);

  return (
    <View style={[styles.container, { height }]}>
      <CartesianChart<ChartDatum, 'index', 'sleepHours'>
        data={data}
        xKey="index"
        yKeys={['sleepHours']}
        domain={{ y: [min, max] }}
        domainPadding={{ left: 12, right: 12, top: 8, bottom: 8 }}
        axisOptions={{
          tickCount: { x: Math.min(data.length, 6), y: 4 },
          labelOffset: { x: 4, y: 4 },
          labelColor: colors.textSecondary,
          lineColor: colors.chartGrid,
          formatYLabel: (v) => `${v}h`,
          formatXLabel: () => '',
        }}
      >
        {({ points: cp }) => (
          <>
            <Line points={cp.sleepHours} color={colors.chartSleep} strokeWidth={2} />
            <Scatter points={cp.sleepHours} shape="circle" radius={3} color={colors.chartSleep} />
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

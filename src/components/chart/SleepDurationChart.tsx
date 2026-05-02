import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

import { type ChartPeriod, type ChartPoint } from '@/domain/chart-aggregation';
import { useTheme } from '@/theme/useTheme';

import { chartAxisFont } from './chart-fonts';
import { computeXTickIndices } from './chart-x-ticks';

interface SleepDurationChartProps {
  points: readonly ChartPoint[];
  height: number;
  period: ChartPeriod;
}

interface ChartDatum extends Record<string, unknown> {
  index: number;
  sleepHours: number | null;
}

export function SleepDurationChart({ points, height, period }: SleepDurationChartProps) {
  const { colors } = useTheme();
  const data: ChartDatum[] = points.map((p, index) => ({
    index,
    sleepHours: p.sleepMinutes !== null ? p.sleepMinutes / 60 : null,
  }));

  const valid = data.map((d) => d.sleepHours).filter((v): v is number => v !== null);
  const min = Math.max(0, Math.floor((valid.length > 0 ? Math.min(...valid, 5) : 5) - 0.5));
  const max = Math.ceil((valid.length > 0 ? Math.max(...valid, 9) : 9) + 0.5);
  const yTicks = makeIntegerTicks(min, max);
  const xTicks = computeXTickIndices(points.length, period);

  return (
    <View style={[styles.container, { height }]}>
      <CartesianChart<ChartDatum, 'index', 'sleepHours'>
        data={data}
        xKey="index"
        yKeys={['sleepHours']}
        domain={{ y: [min, max] }}
        domainPadding={{ left: 12, right: 12, top: 8, bottom: 8 }}
        axisOptions={{
          font: chartAxisFont,
          tickValues: { x: xTicks, y: yTicks },
          labelOffset: { x: 4, y: 6 },
          labelColor: colors.textPrimary,
          lineColor: { grid: { x: 'transparent', y: colors.chartGrid }, frame: colors.chartGrid },
          lineWidth: { grid: { x: 0, y: 0.5 }, frame: 1 },
          formatYLabel: (v) => `${v}h`,
          formatXLabel: (v) => points[v]?.label ?? '',
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

/** [min, max] の範囲で 1h 刻みの整数値ティックを返す（最大 6 個まで間引き）。 */
function makeIntegerTicks(min: number, max: number): number[] {
  const range = Math.max(0, max - min);
  if (range === 0) return [min];
  const step = Math.max(1, Math.ceil(range / 5));
  const ticks: number[] = [];
  for (let v = Math.ceil(min); v <= max; v += step) ticks.push(v);
  return ticks;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

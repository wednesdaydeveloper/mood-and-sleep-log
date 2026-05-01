import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

import { type ChartPoint } from '@/domain/chart-aggregation';

interface MoodChartProps {
  points: readonly ChartPoint[];
  height: number;
}

interface ChartDatum extends Record<string, unknown> {
  index: number;
  mood: number | null;
}

const COLOR = '#4CAF50';

export function MoodChart({ points, height }: MoodChartProps) {
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
          labelColor: '#888',
          lineColor: '#E0E0E0',
          formatYLabel: (v) => `${v}`,
          formatXLabel: () => '',
        }}
      >
        {({ points: cp }) => (
          <>
            <Line points={cp.mood} color={COLOR} strokeWidth={2} />
            <Scatter points={cp.mood} shape="circle" radius={3} color={COLOR} />
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

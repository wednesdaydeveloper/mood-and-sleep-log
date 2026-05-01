import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, Line, Rect, vec } from '@shopify/react-native-skia';

import { type ChartPoint } from '@/domain/chart-aggregation';
import { TIMELINE_TOTAL_MINUTES, formatTimelineMinute } from '@/domain/sleep';
import { useTheme } from '@/theme/useTheme';

interface SleepTimeRangeChartProps {
  points: readonly ChartPoint[];
  height: number;
}

/** Y 軸目盛り（21:00 起点の分）。2 時間ごと: 21,23,01,03,05,07,09,11 */
const Y_TICKS = [0, 120, 240, 360, 480, 600, 720, 840];

/** 折れ線グラフの domainPadding と揃えるための左右マージン (px) */
const PLOT_PADDING_X = 12;
/** 上下のパディング */
const PLOT_PADDING_TOP = 8;
const PLOT_PADDING_BOTTOM = 8;
/** Y軸ラベル領域の幅 */
const Y_LABEL_WIDTH = 28;

/**
 * 睡眠時間帯（縦帯グラフ）。
 * 各日付の列に、21:00 起点の経過分を Y 座標として帯を描画。
 * 分割睡眠は同じ列に複数の帯が縦方向に分かれて表示される。
 */
export function SleepTimeRangeChart({ points, height }: SleepTimeRangeChartProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const plotWidth = Math.max(0, containerWidth - Y_LABEL_WIDTH - PLOT_PADDING_X * 2);
  const plotHeight = height - PLOT_PADDING_TOP - PLOT_PADDING_BOTTOM;
  const count = points.length;

  // 列の中心 X 座標と帯の幅
  const columnSpacing = count > 1 ? plotWidth / (count - 1) : 0;
  const barWidth = computeBarWidth(count, columnSpacing);

  const minToY = (min: number): number =>
    PLOT_PADDING_TOP + (min / TIMELINE_TOTAL_MINUTES) * plotHeight;

  return (
    <View
      onLayout={onLayout}
      style={[styles.container, { height, backgroundColor: colors.bgSecondary }]}
    >
      {/* Y 軸ラベル */}
      <View style={[styles.yLabelColumn, { height }]}>
        {Y_TICKS.map((tick) => (
          <Text
            key={tick}
            style={[
              styles.yLabel,
              { top: minToY(tick) - 6, color: colors.textSecondary },
            ]}
          >
            {formatTimelineMinute(tick).slice(0, 2)}
          </Text>
        ))}
      </View>

      {/* プロットエリア */}
      <View style={styles.plot}>
        {plotWidth > 0 && (
          <Canvas style={{ width: plotWidth + PLOT_PADDING_X * 2, height }}>
            {/* 横方向のグリッド (Y軸目盛り) */}
            {Y_TICKS.map((tick) => {
              const y = minToY(tick);
              return (
                <Line
                  key={`grid-${tick}`}
                  p1={vec(PLOT_PADDING_X, y)}
                  p2={vec(PLOT_PADDING_X + plotWidth, y)}
                  color={colors.chartGrid}
                  strokeWidth={1}
                />
              );
            })}

            {/* 各列の帯 */}
            {points.flatMap((p, colIdx) =>
              p.intervals.map((iv, i) => {
                const cx = PLOT_PADDING_X + colIdx * columnSpacing;
                const x = cx - barWidth / 2;
                const y = minToY(iv.startMin);
                const h = ((iv.endMin - iv.startMin) / TIMELINE_TOTAL_MINUTES) * plotHeight;
                return (
                  <Rect
                    key={`${p.dateIso}-${i}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(h, 2)}
                    color={colors.chartSleepRange}
                    opacity={0.85}
                  />
                );
              }),
            )}
          </Canvas>
        )}
      </View>
    </View>
  );
}

/**
 * 列数に応じた帯の幅を決める。
 * 隣接帯の間に最低 1px の隙間を確保する。
 */
function computeBarWidth(count: number, columnSpacing: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 16;
  // 列間隔の 70%、ただし最小 2px、最大 16px
  return Math.max(2, Math.min(16, columnSpacing * 0.7));
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  yLabelColumn: {
    width: Y_LABEL_WIDTH,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: Y_LABEL_WIDTH - 4,
    textAlign: 'right',
    fontSize: 10,
  },
  plot: {
    flex: 1,
  },
});

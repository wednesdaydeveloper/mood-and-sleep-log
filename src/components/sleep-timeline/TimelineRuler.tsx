import { StyleSheet, Text, View } from 'react-native';

import { TIMELINE_TOTAL_MINUTES, formatTimelineMinute, minToPx } from '@/domain/sleep';
import { useTheme } from '@/theme/useTheme';

interface TimelineRulerProps {
  /** 描画領域の幅 (px)。 */
  usableWidth: number;
}

/** 2 時間ごとの目盛り (21, 23, 01, 03, 05, 07, 09, 11)。 */
const TICK_INTERVAL_MIN = 120;

const TICKS = Array.from(
  { length: Math.floor(TIMELINE_TOTAL_MINUTES / TICK_INTERVAL_MIN) + 1 },
  (_, i) => i * TICK_INTERVAL_MIN,
);

export function TimelineRuler({ usableWidth }: TimelineRulerProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { width: usableWidth }]} pointerEvents="none">
      {TICKS.map((min) => {
        const left = minToPx(min, usableWidth);
        const label = formatTimelineMinute(min).slice(0, 2); // "21:00" → "21"
        return (
          <View key={min} style={[styles.tick, { left }]}>
            <Text style={[styles.tickLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={[styles.tickLine, { backgroundColor: colors.border }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -10 }], // ラベル中央寄せ
    width: 20,
  },
  tickLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  tickLine: {
    width: 1,
    height: 6,
  },
});

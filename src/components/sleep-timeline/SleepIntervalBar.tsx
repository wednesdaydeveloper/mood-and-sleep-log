import { StyleSheet, View } from 'react-native';

import { type SleepInterval, minToPx } from '@/domain/sleep';

interface SleepIntervalBarProps {
  interval: SleepInterval;
  usableWidth: number;
}

/**
 * 1区間を表す帯。M3.2 では描画のみ（ジェスチャーは M3.3 で追加）。
 */
export function SleepIntervalBar({ interval, usableWidth }: SleepIntervalBarProps) {
  const left = minToPx(interval.startMin, usableWidth);
  const width = Math.max(minToPx(interval.endMin - interval.startMin, usableWidth), 4);
  return <View style={[styles.bar, { left, width }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: '#5B7FFF',
    borderRadius: 6,
    opacity: 0.85,
  },
});

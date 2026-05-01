import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  TIMELINE_TOTAL_MINUTES,
  clampLeftHandle,
  clampRightHandle,
  formatTimelineMinute,
  minToPx,
  type SleepInterval,
} from '@/domain/sleep';

import { useTheme } from '@/theme/useTheme';

import { DragHandle } from './DragHandle';

interface SleepIntervalBarProps {
  interval: SleepInterval;
  allIntervals: readonly SleepInterval[];
  usableWidth: number;
  /** ドラッグ完了時に区間更新を親へ通知。 */
  onUpdate: (next: SleepInterval) => void;
  /** 削除時のコールバック。 */
  onDelete: (id: string) => void;
}

export function SleepIntervalBar({
  interval,
  allIntervals,
  usableWidth,
  onUpdate,
  onDelete,
}: SleepIntervalBarProps) {
  const { colors } = useTheme();
  const left = minToPx(interval.startMin, usableWidth);
  const width = Math.max(minToPx(interval.endMin - interval.startMin, usableWidth), 4);

  const leftMinBound = computeLeftMinBound(allIntervals, interval.id);
  const leftMaxBound = interval.endMin - 10;
  const rightMinBound = interval.startMin + 10;
  const rightMaxBound = computeRightMaxBound(allIntervals, interval.id);

  const handleLeftCommit = (newMin: number) => {
    const clamped = clampLeftHandle(allIntervals, interval.id, newMin);
    if (clamped !== interval.startMin) {
      onUpdate({ ...interval, startMin: clamped });
    }
  };

  const handleRightCommit = (newMin: number) => {
    const clamped = clampRightHandle(allIntervals, interval.id, newMin);
    if (clamped !== interval.endMin) {
      onUpdate({ ...interval, endMin: clamped });
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      '区間を削除',
      `${formatTimelineMinute(interval.startMin)} 〜 ${formatTimelineMinute(interval.endMin)} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => onDelete(interval.id) },
      ],
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`睡眠区間: ${formatTimelineMinute(interval.startMin)} 〜 ${formatTimelineMinute(interval.endMin)}（長押しで削除）`}
        style={[styles.bar, { left, width, backgroundColor: colors.accent }]}
      />

      <DragHandle
        usableWidth={usableWidth}
        valueMin={interval.startMin}
        minMin={leftMinBound}
        maxMin={leftMaxBound}
        onCommit={handleLeftCommit}
        accessibilityLabel={`開始時刻: ${formatTimelineMinute(interval.startMin)}`}
      />
      <DragHandle
        usableWidth={usableWidth}
        valueMin={interval.endMin}
        minMin={rightMinBound}
        maxMin={rightMaxBound}
        onCommit={handleRightCommit}
        accessibilityLabel={`終了時刻: ${formatTimelineMinute(interval.endMin)}`}
      />
    </View>
  );
}

function computeLeftMinBound(intervals: readonly SleepInterval[], currentId: string): number {
  const current = intervals.find((i) => i.id === currentId);
  if (!current) return 0;
  const leftNeighbor = intervals
    .filter((i) => i.id !== currentId && i.endMin <= current.startMin)
    .sort((a, b) => b.endMin - a.endMin)[0];
  return leftNeighbor ? leftNeighbor.endMin : 0;
}

function computeRightMaxBound(intervals: readonly SleepInterval[], currentId: string): number {
  const current = intervals.find((i) => i.id === currentId);
  if (!current) return TIMELINE_TOTAL_MINUTES;
  const rightNeighbor = intervals
    .filter((i) => i.id !== currentId && i.startMin >= current.endMin)
    .sort((a, b) => a.startMin - b.startMin)[0];
  return rightNeighbor ? rightNeighbor.startMin : TIMELINE_TOTAL_MINUTES;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  bar: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 6,
    opacity: 0.85,
  },
});

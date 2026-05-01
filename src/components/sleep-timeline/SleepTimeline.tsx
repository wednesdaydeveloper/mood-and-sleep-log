import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import {
  MAX_INTERVALS_PER_DAY,
  canAddInterval,
  findInsertSlot,
  pxToMin,
  totalSleepMinutes,
  type SleepInterval,
} from '@/domain/sleep';
import { newId } from '@/lib/id';

import { SleepIntervalBar } from './SleepIntervalBar';
import { TimelineRuler } from './TimelineRuler';

interface SleepTimelineProps {
  intervals: readonly SleepInterval[];
  onChange: (next: SleepInterval[]) => void;
}

/**
 * 睡眠タイムライン。21:00 〜 翌 11:00 の横軸に区間を描画し、
 * タップで区間追加、ドラッグで開始/終了時刻を変更、長押しで削除。
 */
export function SleepTimeline({ intervals, onChange }: SleepTimelineProps) {
  const [usableWidth, setUsableWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setUsableWidth(e.nativeEvent.layout.width);
  };

  const handleCanvasPress = (e: GestureResponderEvent) => {
    if (usableWidth <= 0) return;
    if (!canAddInterval(intervals)) {
      Alert.alert('区間の上限', `最大 ${MAX_INTERVALS_PER_DAY} 区間まで登録できます`);
      return;
    }
    const tappedMin = pxToMin(e.nativeEvent.locationX, usableWidth);
    const slot = findInsertSlot(intervals, tappedMin);
    if (!slot) {
      Alert.alert('追加できませんでした', '空きが不足しています');
      return;
    }
    onChange([...intervals, { id: newId(), ...slot }]);
  };

  const handleUpdate = (next: SleepInterval) => {
    onChange(intervals.map((iv) => (iv.id === next.id ? next : iv)));
  };

  const handleDelete = (id: string) => {
    onChange(intervals.filter((iv) => iv.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>睡眠時間帯</Text>
        <Text style={styles.total}>{formatDuration(totalSleepMinutes(intervals))}</Text>
      </View>

      <View style={styles.timelineArea} onLayout={onLayout}>
        <TimelineRuler usableWidth={usableWidth} />
        <Pressable
          onPress={handleCanvasPress}
          accessibilityLabel="タップして睡眠区間を追加"
          accessibilityRole="button"
          style={styles.canvasFrame}
        >
          {usableWidth > 0 &&
            intervals.map((iv) => (
              <SleepIntervalBar
                key={iv.id}
                interval={iv}
                allIntervals={intervals}
                usableWidth={usableWidth}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
        </Pressable>
      </View>

      <Text style={styles.hint}>
        タップで区間追加、ハンドルで時刻調整、長押しで削除。
      </Text>
    </View>
  );
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '合計 0時間 0分';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `合計 ${h}時間 ${m}分`;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  total: {
    fontSize: 13,
    color: '#666',
  },
  timelineArea: {
    paddingTop: 4,
  },
  canvasFrame: {
    height: 56,
    position: 'relative',
    backgroundColor: '#D6DAE0',
    borderRadius: 8,
  },
  hint: {
    fontSize: 11,
    color: '#999',
  },
});

import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { type SleepInterval, totalSleepMinutes } from '@/domain/sleep';

import { SleepIntervalBar } from './SleepIntervalBar';
import { TimelineRuler } from './TimelineRuler';

interface SleepTimelineProps {
  intervals: readonly SleepInterval[];
}

/**
 * 睡眠タイムラインのルート。21:00 〜 翌 11:00 の横軸に区間を描画する。
 * M3.2: 描画のみ（タップ/ドラッグなし）。M3.3 でジェスチャーを追加予定。
 */
export function SleepTimeline({ intervals }: SleepTimelineProps) {
  const [usableWidth, setUsableWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setUsableWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>睡眠時間帯</Text>
        <Text style={styles.total}>{formatDuration(totalSleepMinutes(intervals))}</Text>
      </View>

      <View style={styles.timelineArea} onLayout={onLayout}>
        <TimelineRuler usableWidth={usableWidth} />
        <View style={styles.canvasFrame}>
          {usableWidth > 0 &&
            intervals.map((iv) => (
              <SleepIntervalBar key={iv.id} interval={iv} usableWidth={usableWidth} />
            ))}
        </View>
      </View>
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
    backgroundColor: '#F2F4F8',
    borderRadius: 8,
  },
});

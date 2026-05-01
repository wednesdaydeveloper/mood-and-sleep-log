import { StyleSheet, Text, View } from 'react-native';

import { type ChartPoint } from '@/domain/chart-aggregation';
import { MOOD_EMOJI } from '@/domain/mood';
import { formatTimelineMinute } from '@/domain/sleep';

interface DataPointPopupProps {
  point: ChartPoint;
  /** 親エリア幅に対する相対位置 (0..1)。中央寄せに使う。 */
  ratio: number;
  /** 親エリア幅 (px)。 */
  containerWidth: number;
}

const POPUP_WIDTH = 200;

/**
 * グラフ上のタップ位置を起点に表示する詳細ポップアップ。
 * 上の段（折れ線）の上にフロート表示する想定。
 */
export function DataPointPopup({ point, ratio, containerWidth }: DataPointPopupProps) {
  const center = ratio * containerWidth;
  let left = center - POPUP_WIDTH / 2;
  if (left < 0) left = 0;
  if (left + POPUP_WIDTH > containerWidth) left = containerWidth - POPUP_WIDTH;

  return (
    <View style={[styles.popup, { left, width: POPUP_WIDTH }]} pointerEvents="none">
      <Text style={styles.title}>{formatTitle(point.dateIso)}</Text>
      <Text style={styles.line}>
        気分: {point.mood !== null ? `${moodIcon(point.mood)} ${formatMood(point.mood)}` : '—'}
      </Text>
      <Text style={styles.line}>睡眠: {formatSleep(point.sleepMinutes)}</Text>
      {point.intervals.length > 0 && (
        <Text style={styles.line} numberOfLines={2}>
          時間帯:{' '}
          {point.intervals
            .map((iv) => `${formatTimelineMinute(iv.startMin)}-${formatTimelineMinute(iv.endMin)}`)
            .join(', ')}
        </Text>
      )}
    </View>
  );
}

function moodIcon(value: number): string {
  // year ビューは平均値で小数になるため、四捨五入で絵文字を選ぶ
  const rounded = Math.round(value);
  const clamped = Math.max(-2, Math.min(2, rounded));
  return MOOD_EMOJI[clamped as -2 | -1 | 0 | 1 | 2];
}

function formatMood(value: number): string {
  if (Number.isInteger(value)) return value > 0 ? `+${value}` : `${value}`;
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function formatSleep(minutes: number | null): string {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  if (h > 0 && m > 0) return `${h}時間 ${m}分`;
  if (h > 0) return `${h}時間`;
  return `${m}分`;
}

function formatTitle(iso: string): string {
  if (iso.length === 7) {
    const [, mm] = iso.split('-');
    return `${parseInt(mm ?? '0', 10)}月`;
  }
  // yyyy-MM-dd
  const [, mm, dd] = iso.split('-');
  return `${parseInt(mm ?? '0', 10)}/${parseInt(dd ?? '0', 10)}`;
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  title: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  line: { color: '#FFF', fontSize: 12 },
});

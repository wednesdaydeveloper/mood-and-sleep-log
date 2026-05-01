import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SNAP_MINUTES, TIMELINE_TOTAL_MINUTES } from '@/domain/sleep';

interface DragHandleProps {
  /** タイムラインの描画幅 (px)。 */
  usableWidth: number;
  /** 現在の値 (分)。controlled。 */
  valueMin: number;
  /** ドラッグ可能下限 (分)。 */
  minMin: number;
  /** ドラッグ可能上限 (分)。 */
  maxMin: number;
  /** ドラッグ終了時に新しい値 (分) を通知。 */
  onCommit: (newMin: number) => void;
  /** 識別用ラベル。 */
  accessibilityLabel?: string;
}

/**
 * ドラッグハンドル。Reanimated worklet で 60fps の追従を実現。
 * - 最小ヒット領域: 44pt × 44pt (Apple HIG 準拠、§02 §13)
 * - ドラッグ中は 10 分粒度にスナップしながら表示
 * - 制約は親が計算した [minMin, maxMin] を渡す（隣接区間考慮済み）
 *
 * 注: worklet 内ではモジュール境界を越える関数呼び出しを避け、
 *     px↔min 変換のロジックをインラインで行う。
 */
export function DragHandle({
  usableWidth,
  valueMin,
  minMin,
  maxMin,
  onCommit,
  accessibilityLabel,
}: DragHandleProps) {
  const minToPxLocal = (m: number): number => (m / TIMELINE_TOTAL_MINUTES) * usableWidth;
  const translateX = useSharedValue(minToPxLocal(valueMin));

  // 親による value 変更（ドラッグ以外の経路）に追従
  useEffect(() => {
    translateX.value = (valueMin / TIMELINE_TOTAL_MINUTES) * usableWidth;
  }, [valueMin, usableWidth, translateX]);

  // worklet で参照する固定値（gesture 中は変化しない想定）
  const minPx = (minMin / TIMELINE_TOTAL_MINUTES) * usableWidth;
  const maxPx = (maxMin / TIMELINE_TOTAL_MINUTES) * usableWidth;
  const totalMin = TIMELINE_TOTAL_MINUTES;
  const snap = SNAP_MINUTES;
  const width = usableWidth;

  const pan = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .onChange((e) => {
      'worklet';
      const next = translateX.value + e.changeX;
      let clamped = next;
      if (clamped < minPx) clamped = minPx;
      if (clamped > maxPx) clamped = maxPx;
      // 10 分粒度にスナップ
      const minutes = (clamped / width) * totalMin;
      const snapped = Math.round(minutes / snap) * snap;
      const safeSnapped = snapped < 0 ? 0 : snapped > totalMin ? totalMin : snapped;
      translateX.value = (safeSnapped / totalMin) * width;
    })
    .onEnd(() => {
      'worklet';
      const finalMin = (translateX.value / width) * totalMin;
      scheduleOnRN(onCommit, Math.round(finalMin / snap) * snap);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.hitbox, animatedStyle]}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={styles.visual} pointerEvents="none" />
      </Animated.View>
    </GestureDetector>
  );
}

const HIT_SIZE = 44;
const VISUAL_SIZE = 16;

const styles = StyleSheet.create({
  hitbox: {
    position: 'absolute',
    top: -((HIT_SIZE - 44) / 2),
    width: HIT_SIZE,
    height: HIT_SIZE,
    marginLeft: -HIT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    borderRadius: VISUAL_SIZE / 2,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#3B5BDB',
  },
});

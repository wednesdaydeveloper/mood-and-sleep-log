import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ChartPeriod } from '@/domain/chart-aggregation';
import { formatPeriodRange } from '@/domain/chart-period-format';
import { todayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

interface PeriodNavigatorProps {
  period: ChartPeriod;
  endIso: string;
  startIso: string;
  onPrev: () => void;
  onNext: () => void;
}

export function PeriodNavigator({
  period,
  endIso,
  startIso,
  onPrev,
  onNext,
}: PeriodNavigatorProps) {
  const { colors } = useTheme();
  const isAtToday = endIso >= todayIso();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border },
      ]}
    >
      <ArrowButton label="◀" accessibilityLabel="前の期間" onPress={onPrev} />
      <Text style={[styles.label, { color: colors.textPrimary }]}>
        {formatPeriodRange(period, startIso, endIso)}
      </Text>
      <ArrowButton
        label="▶"
        accessibilityLabel="次の期間"
        onPress={onNext}
        disabled={isAtToday}
      />
    </View>
  );
}

interface ArrowButtonProps {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
}

function ArrowButton({ label, accessibilityLabel, onPress, disabled }: ArrowButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, disabled && styles.btnDisabled]}
    >
      <Text
        style={[
          styles.btnText,
          { color: disabled ? colors.textDisabled : colors.accent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.5 },
  btnDisabled: { opacity: 0.25 },
  btnText: { fontSize: 18 },
});

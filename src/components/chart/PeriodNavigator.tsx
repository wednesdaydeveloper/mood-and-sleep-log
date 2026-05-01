import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ChartPeriod } from '@/domain/chart-aggregation';
import { fromIsoDate, todayIso } from '@/lib/date';

interface PeriodNavigatorProps {
  period: ChartPeriod;
  endIso: string;
  startIso: string;
  onPrev: () => void;
  onNext: () => void;
}

const days = ['日', '月', '火', '水', '木', '金', '土'];

export function PeriodNavigator({
  period,
  endIso,
  startIso,
  onPrev,
  onNext,
}: PeriodNavigatorProps) {
  const isAtToday = endIso >= todayIso();
  return (
    <View style={styles.row}>
      <ArrowButton label="◀" accessibilityLabel="前の期間" onPress={onPrev} />
      <Text style={styles.label}>{formatRange(period, startIso, endIso)}</Text>
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, disabled && styles.btnDisabled]}
    >
      <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function formatRange(period: ChartPeriod, startIso: string, endIso: string): string {
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  if (period === 'year') {
    return `${start.getFullYear()}/${start.getMonth() + 1} 〜 ${end.getFullYear()}/${end.getMonth() + 1}`;
  }
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}(${days[start.getDay()]})`;
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}(${days[end.getDay()]})`;
  return `${startLabel} 〜 ${endLabel}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 13,
    color: '#333',
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
  btnText: { fontSize: 18, color: '#5B7FFF' },
  btnTextDisabled: { color: '#AAA' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ChartPeriod } from '@/domain/chart-aggregation';

interface PeriodTabsProps {
  value: ChartPeriod;
  onChange: (next: ChartPeriod) => void;
  /** year は M6 で実装するため、M5 では disabled として表示。 */
  disabledPeriods?: readonly ChartPeriod[];
}

const ALL_PERIODS: { period: ChartPeriod; label: string }[] = [
  { period: 'week', label: 'week' },
  { period: 'month', label: 'month' },
  { period: 'year', label: 'year' },
];

export function PeriodTabs({ value, onChange, disabledPeriods = [] }: PeriodTabsProps) {
  return (
    <View style={styles.row}>
      {ALL_PERIODS.map(({ period, label }) => {
        const active = value === period;
        const disabled = disabledPeriods.includes(period);
        return (
          <Pressable
            key={period}
            onPress={() => !disabled && onChange(period)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled }}
            style={[styles.tab, active && styles.tabActive, disabled && styles.tabDisabled]}
          >
            <Text
              style={[
                styles.tabText,
                active && styles.tabTextActive,
                disabled && styles.tabTextDisabled,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#5B7FFF' },
  tabDisabled: { opacity: 0.4 },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#5B7FFF', fontWeight: '600' },
  tabTextDisabled: { color: '#AAA' },
});

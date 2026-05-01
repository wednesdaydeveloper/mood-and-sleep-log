import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ChartPeriod } from '@/domain/chart-aggregation';
import { useTheme } from '@/theme/useTheme';

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
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border },
      ]}
    >
      {ALL_PERIODS.map(({ period, label }) => {
        const active = value === period;
        const disabled = disabledPeriods.includes(period);
        return (
          <Pressable
            key={period}
            onPress={() => !disabled && onChange(period)}
            accessibilityRole="tab"
            accessibilityLabel={`${label} 期間`}
            accessibilityState={{ selected: active, disabled }}
            style={[
              styles.tab,
              active && { borderBottomColor: colors.tabBarActive },
              disabled && styles.tabDisabled,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: disabled
                    ? colors.textDisabled
                    : active
                      ? colors.tabBarActive
                      : colors.textSecondary,
                },
                active && styles.tabTextActive,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabDisabled: { opacity: 0.4 },
  tabText: { fontSize: 14 },
  tabTextActive: { fontWeight: '600' },
});

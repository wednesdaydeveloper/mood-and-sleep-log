import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { HomeCalendarView } from '@/components/home/HomeCalendarView';
import { HomeListView } from '@/components/home/HomeListView';
import { list, type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { todayIso, yesterdayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

type ViewMode = 'list' | 'calendar';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<DailyRecordWithIntervals[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      const fromIso = isoOf(past);
      const toIso = todayIso();
      const fetched = await list(fromIso, toIso);
      setRecords(fetched);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.tabsRow,
          { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border },
        ]}
      >
        <ViewModeTab label="リスト" active={viewMode === 'list'} onPress={() => setViewMode('list')} />
        <ViewModeTab
          label="カレンダー"
          active={viewMode === 'calendar'}
          onPress={() => setViewMode('calendar')}
        />
      </View>

      <View style={styles.content}>
        {viewMode === 'list' ? (
          <HomeListView records={records} loading={loading} />
        ) : (
          <HomeCalendarView records={records} />
        )}
      </View>

      <Link
        href={{ pathname: '/record/[date]', params: { date: yesterdayIso() } }}
        asChild
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="昨日の記録を追加"
          style={[styles.fab, { backgroundColor: colors.fab }]}
        >
          <Text style={[styles.fabText, { color: colors.textOnAccent }]}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}

interface ViewModeTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function ViewModeTab({ label, active, onPress }: ViewModeTabProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[
        styles.tab,
        active && { borderBottomColor: colors.tabBarActive },
      ]}
    >
      <Text
        style={[
          styles.tabText,
          { color: active ? colors.tabBarActive : colors.textSecondary },
          active && styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function isoOf(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsRow: {
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
  tabText: { fontSize: 14 },
  tabTextActive: { fontWeight: '600' },
  content: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { fontSize: 28, fontWeight: '600', lineHeight: 30 },
});

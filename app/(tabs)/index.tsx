import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { HomeCalendarView } from '@/components/home/HomeCalendarView';
import { HomeListView } from '@/components/home/HomeListView';
import { list, type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { todayIso, yesterdayIso } from '@/lib/date';

type ViewMode = 'list' | 'calendar';

export default function HomeScreen() {
  const [records, setRecords] = useState<DailyRecordWithIntervals[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // 直近 1 年分（カレンダー表示で過去月もスクロール可能）
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
    <View style={styles.container}>
      <View style={styles.tabsRow}>
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
          style={styles.fab}
        >
          <Text style={styles.fabText}>＋</Text>
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function isoOf(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  tabsRow: {
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
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#5B7FFF', fontWeight: '600' },
  content: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B7FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '600', lineHeight: 30 },
});

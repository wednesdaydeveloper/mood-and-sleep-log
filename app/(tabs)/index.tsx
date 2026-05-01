import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { HomeCalendarView } from '@/components/home/HomeCalendarView';
import { HomeListView } from '@/components/home/HomeListView';
import { SearchBar } from '@/components/home/SearchBar';
import { TagFilterChips } from '@/components/home/TagFilterChips';
import { list, type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { filterRecords } from '@/domain/record-filter';
import { todayIso, yesterdayIso } from '@/lib/date';
import { logger } from '@/lib/logger';
import { useTheme } from '@/theme/useTheme';

type ViewMode = 'list' | 'calendar';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<DailyRecordWithIntervals[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredRecords = useMemo(
    () => filterRecords(records, { keyword, selectedTags }),
    [records, keyword, selectedTags],
  );

  const isFiltering = keyword.trim() !== '' || selectedTags.length > 0;

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      const fromIso = isoOf(past);
      const toIso = todayIso();
      const fetched = await list(fromIso, toIso);
      setRecords(fetched);
    } catch (e: unknown) {
      logger.error('home-screen', 'list reload failed', { error: String(e) });
      setLoadError('記録一覧の読み込みに失敗しました');
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

      {viewMode === 'list' && !loadError && (
        <View
          style={[
            styles.searchArea,
            { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border },
          ]}
        >
          <SearchBar value={keyword} onChange={setKeyword} />
          <TagFilterChips value={selectedTags} onChange={setSelectedTags} />
        </View>
      )}

      <View style={styles.content}>
        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{loadError}</Text>
          </View>
        ) : viewMode === 'list' ? (
          <HomeListView
            records={filteredRecords}
            loading={loading}
            isFiltering={isFiltering}
          />
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
  searchArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center' },
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

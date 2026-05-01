import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { MOOD_EMOJI } from '@/domain/mood';
import { fromIsoDate, todayIso, yesterdayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

interface HomeListViewProps {
  records: readonly DailyRecordWithIntervals[];
  loading: boolean;
}

export function HomeListView({ records, loading }: HomeListViewProps) {
  const { colors } = useTheme();
  if (records.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          まだ記録がありません
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {loading ? '読み込み中...' : '右下のボタンから昨日の記録を追加しましょう'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <RecordRow record={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function RecordRow({ record }: { record: DailyRecordWithIntervals }) {
  const { colors } = useTheme();
  const tagsPreview = record.moodTags.slice(0, 3).join('、');
  const moreTags = record.moodTags.length > 3 ? ` +${record.moodTags.length - 3}` : '';
  const dateLabel = formatRowDate(record.date);

  return (
    <Link
      href={{ pathname: '/record/[date]', params: { date: record.date } }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${dateLabel} の記録を編集`}
        style={[styles.row, { backgroundColor: colors.bgSecondary }]}
      >
        <Text style={[styles.rowDate, { color: colors.textPrimary }]}>{dateLabel}</Text>
        <Text style={styles.rowEmoji}>{MOOD_EMOJI[record.moodScore]}</Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowTags, { color: colors.textPrimary }]} numberOfLines={1}>
            {record.moodTags.length > 0 ? `${tagsPreview}${moreTags}` : '-'}
          </Text>
          {record.memo && (
            <Text style={[styles.rowMemo, { color: colors.textSecondary }]} numberOfLines={1}>
              {record.memo}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

function formatRowDate(iso: string): string {
  const d = fromIsoDate(iso);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = todayIso();
  const yesterday = yesterdayIso();
  const dayLabel = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
  if (iso === today) return `今日 ${dayLabel}`;
  if (iso === yesterday) return `昨日 ${dayLabel}`;
  return dayLabel;
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  listContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  rowDate: { fontSize: 14, fontWeight: '600', minWidth: 92 },
  rowEmoji: { fontSize: 24 },
  rowMeta: { flex: 1, gap: 2 },
  rowTags: { fontSize: 13 },
  rowMemo: { fontSize: 12 },
  separator: { height: 8 },
});

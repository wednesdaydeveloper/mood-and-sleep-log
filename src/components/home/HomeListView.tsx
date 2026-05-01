import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { MOOD_EMOJI } from '@/domain/mood';
import { fromIsoDate, todayIso, yesterdayIso } from '@/lib/date';

interface HomeListViewProps {
  records: readonly DailyRecordWithIntervals[];
  loading: boolean;
}

export function HomeListView({ records, loading }: HomeListViewProps) {
  if (records.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>まだ記録がありません</Text>
        <Text style={styles.emptySubtitle}>
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
  const tagsPreview = record.moodTags.slice(0, 3).join('、');
  const moreTags = record.moodTags.length > 3 ? ` +${record.moodTags.length - 3}` : '';

  return (
    <Link
      href={{ pathname: '/record/[date]', params: { date: record.date } }}
      asChild
    >
      <Pressable accessibilityRole="button" style={styles.row}>
        <Text style={styles.rowDate}>{formatRowDate(record.date)}</Text>
        <Text style={styles.rowEmoji}>{MOOD_EMOJI[record.moodScore]}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowTags} numberOfLines={1}>
            {record.moodTags.length > 0 ? `${tagsPreview}${moreTags}` : '-'}
          </Text>
          {record.memo && (
            <Text style={styles.rowMemo} numberOfLines={1}>
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
  emptySubtitle: { fontSize: 13, color: '#666', textAlign: 'center' },
  listContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  rowDate: { fontSize: 14, fontWeight: '600', minWidth: 92 },
  rowEmoji: { fontSize: 24 },
  rowMeta: { flex: 1, gap: 2 },
  rowTags: { fontSize: 13, color: '#333' },
  rowMemo: { fontSize: 12, color: '#888' },
  separator: { height: 8 },
});

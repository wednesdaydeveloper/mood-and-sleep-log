import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { MOOD_EMOJI } from '@/domain/mood';
import { fromIsoDate, todayIso, yesterdayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

interface HomeListViewProps {
  records: readonly DailyRecordWithIntervals[];
  loading: boolean;
  /** 検索/絞り込みを適用中。空状態メッセージを切替えるのに使う。 */
  isFiltering?: boolean;
}

export function HomeListView({ records, loading, isFiltering }: HomeListViewProps) {
  const { colors } = useTheme();
  if (records.length === 0) {
    const title = isFiltering ? '該当する記録がありません' : 'まだ記録がありません';
    const subtitle = isFiltering
      ? '検索条件を変更してみてください'
      : loading
        ? '読み込み中...'
        : '右下のボタンから昨日の記録を追加しましょう';
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
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
        style={[styles.pressable, { backgroundColor: colors.bgSecondary }]}
      >
        <View style={styles.row}>
          <Text style={[styles.rowDate, { color: colors.textPrimary }]}>{dateLabel}</Text>
          <Text style={styles.rowEmoji}>{MOOD_EMOJI[record.moodScore]}</Text>
          <Text style={[styles.rowMoodScore, { color: colors.textSecondary }]}>
            {formatMoodScore(record.moodScore)}
          </Text>
          <Text
            style={[styles.rowMeta, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatMeta(record.moodTags.length > 0 ? `${tagsPreview}${moreTags}` : '', record.memo)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function formatMoodScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function formatMeta(tagsText: string, memo: string | null): string {
  const parts: string[] = [];
  if (tagsText) parts.push(tagsText);
  if (memo) parts.push(memo);
  if (parts.length === 0) return '-';
  return parts.join(' ・ ');
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
  pressable: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  rowDate: { fontSize: 14, fontWeight: '600', minWidth: 92 },
  rowEmoji: { fontSize: 24 },
  rowMoodScore: { fontSize: 12, minWidth: 22, textAlign: 'left' },
  rowMeta: { flex: 1, fontSize: 13 },
  separator: { height: 8 },
});

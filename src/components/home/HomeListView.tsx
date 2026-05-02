import { Fragment } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { MOOD_EMOJI } from '@/domain/mood';
import { fromIsoDate, todayIso, yesterdayIso } from '@/lib/date';
import { splitWithHighlight } from '@/lib/highlight';
import { useTheme } from '@/theme/useTheme';

interface HomeListViewProps {
  records: readonly DailyRecordWithIntervals[];
  loading: boolean;
  /** 検索/絞り込みを適用中。空状態メッセージを切替えるのに使う。 */
  isFiltering?: boolean;
  /** メモ本文中のキーワードハイライトに使用。 */
  keyword?: string;
  /** タグの絞り込みで選択中のタグ。リスト中で赤太字ハイライト。 */
  selectedTags?: readonly string[];
}

export function HomeListView({
  records,
  loading,
  isFiltering,
  keyword = '',
  selectedTags = [],
}: HomeListViewProps) {
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
      renderItem={({ item }) => (
        <RecordRow record={item} keyword={keyword} selectedTags={selectedTags} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

interface RecordRowProps {
  record: DailyRecordWithIntervals;
  keyword: string;
  selectedTags: readonly string[];
}

function RecordRow({ record, keyword, selectedTags }: RecordRowProps) {
  const { colors } = useTheme();
  const dateLabel = formatRowDate(record.date);
  const visibleTags = record.moodTags.slice(0, 3);
  const moreTags = record.moodTags.length > 3 ? ` +${record.moodTags.length - 3}` : '';

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
        <View style={styles.cell}>
          <View style={styles.headerLine}>
            <Text style={[styles.rowDate, { color: colors.textPrimary }]}>{dateLabel}</Text>
            <Text style={styles.rowEmoji}>{MOOD_EMOJI[record.moodScore]}</Text>
            <Text style={[styles.rowMoodScore, { color: colors.textSecondary }]}>
              {formatMoodScore(record.moodScore)}
            </Text>
          </View>
          {record.moodTags.length > 0 && (
            <Text
              style={[styles.tagsLine, { color: colors.textPrimary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {visibleTags.map((tag, idx) => {
                const selected = selectedTags.includes(tag);
                return (
                  <Fragment key={`${tag}-${idx}`}>
                    {idx > 0 && <Text>、</Text>}
                    <Text style={selected ? styles.tagHighlight : undefined}>{tag}</Text>
                  </Fragment>
                );
              })}
              {moreTags}
            </Text>
          )}
          {record.memo && (
            <Text
              style={[styles.memoLine, { color: colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {splitWithHighlight(record.memo, keyword).map((seg, idx) => (
                <Text key={idx} style={seg.match ? styles.memoHighlight : undefined}>
                  {seg.text}
                </Text>
              ))}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

function formatMoodScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
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

/** ハイライト色（赤）。テーマトークン外の固有値として定義。 */
const HIGHLIGHT_COLOR = '#E53935';

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  listContent: { padding: 16 },
  pressable: {
    borderRadius: 8,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDate: { fontSize: 14, fontWeight: '600', minWidth: 92, lineHeight: 18 },
  rowEmoji: { fontSize: 22, lineHeight: 26 },
  rowMoodScore: { fontSize: 12, minWidth: 22, textAlign: 'left', lineHeight: 18 },
  tagsLine: { fontSize: 13, lineHeight: 16 },
  memoLine: { fontSize: 12, lineHeight: 15 },
  tagHighlight: { color: HIGHLIGHT_COLOR, fontWeight: '700' },
  memoHighlight: { color: HIGHLIGHT_COLOR, fontWeight: '700' },
  separator: { height: 1 },
});

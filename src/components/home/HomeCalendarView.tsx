import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, type DateData, LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';

import { type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import { MOOD_EMOJI } from '@/domain/mood';
import { todayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

LocaleConfig.locales.ja = {
  monthNames: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  monthNamesShort: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

interface HomeCalendarViewProps {
  records: readonly DailyRecordWithIntervals[];
}

export function HomeCalendarView({ records }: HomeCalendarViewProps) {
  const { colors, scheme } = useTheme();
  const recordMap = useMemo(() => {
    const map = new Map<string, DailyRecordWithIntervals>();
    for (const r of records) map.set(r.date, r);
    return map;
  }, [records]);

  const handleDayPress = (day: DateData) => {
    router.push({ pathname: '/record/[date]', params: { date: day.dateString } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <Calendar
        key={scheme}
        current={todayIso()}
        maxDate={todayIso()}
        onDayPress={handleDayPress}
        firstDay={0}
        dayComponent={({ date, state }) => {
          if (!date) return <View style={styles.cell} />;
          const record = recordMap.get(date.dateString);
          const isDisabled = state === 'disabled';
          return (
            <Cell
              dateString={date.dateString}
              dayNum={date.day}
              record={record}
              disabled={isDisabled}
              onPress={() => handleDayPress(date)}
            />
          );
        }}
        theme={{
          calendarBackground: colors.bgSecondary,
          monthTextColor: colors.textPrimary,
          dayTextColor: colors.textPrimary,
          textSectionTitleColor: colors.textSecondary,
          arrowColor: colors.accent,
          textDayFontSize: 12,
          textMonthFontSize: 16,
          textMonthFontWeight: '600',
        }}
      />
    </View>
  );
}

interface CellProps {
  dateString: string;
  dayNum: number;
  record: DailyRecordWithIntervals | undefined;
  disabled: boolean;
  onPress: () => void;
}

function Cell({ dayNum, record, disabled, onPress }: CellProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.cell, disabled && styles.cellDisabled]}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <Text
        style={[
          styles.dayNum,
          { color: disabled ? colors.textDisabled : colors.textPrimary },
        ]}
      >
        {dayNum}
      </Text>
      {record ? (
        <>
          <View style={styles.moodRow}>
            <Text style={styles.emoji}>{MOOD_EMOJI[record.moodScore]}</Text>
            <Text style={[styles.moodScore, { color: colors.textSecondary }]}>
              {formatMoodScore(record.moodScore)}
            </Text>
          </View>
          <Text style={[styles.duration, { color: colors.textSecondary }]}>
            {formatHours(totalMinutes(record))}
          </Text>
        </>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

function totalMinutes(record: DailyRecordWithIntervals): number {
  return record.intervals.reduce(
    (sum, iv) => sum + (iv.endAt.getTime() - iv.startAt.getTime()) / 60000,
    0,
  );
}

function formatMoodScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function formatHours(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cell: {
    width: 44,
    minHeight: 64,
    alignItems: 'center',
    paddingVertical: 4,
  },
  cellDisabled: { opacity: 0.35 },
  dayNum: { fontSize: 12 },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 2,
  },
  emoji: { fontSize: 16 },
  moodScore: { fontSize: 9 },
  duration: { fontSize: 9 },
  placeholder: { height: 36 },
});

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ChartXAxis } from '@/components/chart/ChartXAxis';
import { DataPointPopup } from '@/components/chart/DataPointPopup';
import { MoodChart } from '@/components/chart/MoodChart';
import { PeriodNavigator } from '@/components/chart/PeriodNavigator';
import { PeriodTabs } from '@/components/chart/PeriodTabs';
import { SleepDurationChart } from '@/components/chart/SleepDurationChart';
import { SleepTimeRangeChart } from '@/components/chart/SleepTimeRangeChart';
import { list, type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import {
  aggregateForMonth,
  aggregateForWeek,
  aggregateForYear,
  type ChartPeriod,
  type ChartPoint,
} from '@/domain/chart-aggregation';
import { fromIsoDate, toIsoDate, todayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

export default function ChartScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<ChartPeriod>('week');
  const [endIso, setEndIso] = useState(todayIso());
  const [records, setRecords] = useState<DailyRecordWithIntervals[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      const fetched = await list(toIsoDate(past), todayIso());
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

  const points: ChartPoint[] = useMemo(
    () =>
      period === 'week'
        ? aggregateForWeek(records, endIso)
        : period === 'month'
          ? aggregateForMonth(records, endIso)
          : aggregateForYear(records, endIso),
    [records, period, endIso],
  );

  const startIso = points[0]?.dateIso ?? endIso;

  // 期間切替で endIso をリセット（year は yyyy-MM-15 のように月途中の日付を保つ必要なし）
  const handlePeriodChange = (next: ChartPeriod) => {
    setPeriod(next);
    setEndIso(todayIso());
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    const date = fromIsoDate(endIso);
    if (period === 'week') date.setDate(date.getDate() - 7);
    else if (period === 'month') date.setDate(date.getDate() - 30);
    else date.setFullYear(date.getFullYear() - 1);
    setEndIso(toIsoDate(date));
    setSelectedIndex(null);
  };

  const handleNext = () => {
    const date = fromIsoDate(endIso);
    if (period === 'week') date.setDate(date.getDate() + 7);
    else if (period === 'month') date.setDate(date.getDate() + 30);
    else date.setFullYear(date.getFullYear() + 1);
    const next = toIsoDate(date);
    // 今日を超えない
    setEndIso(next > todayIso() ? todayIso() : next);
    setSelectedIndex(null);
  };

  const handleAreaLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleAreaPress = (e: GestureResponderEvent) => {
    if (containerWidth <= 0 || points.length === 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / containerWidth));
    const index = Math.round(ratio * (points.length - 1));
    // 同じ点を再タップで閉じる
    setSelectedIndex((cur) => (cur === index ? null : index));
  };

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;
  const selectedRatio =
    selectedIndex !== null && points.length > 1 ? selectedIndex / (points.length - 1) : 0.5;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <PeriodTabs value={period} onChange={handlePeriodChange} />
      <PeriodNavigator
        period={period}
        startIso={startIso}
        endIso={endIso}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={styles.chartArea}
            onLayout={handleAreaLayout}
          >
            {selectedPoint && containerWidth > 0 && (
              <DataPointPopup
                point={selectedPoint}
                ratio={selectedRatio}
                containerWidth={containerWidth}
              />
            )}

            <Section title="気分">
              <MoodChart points={points} height={120} />
            </Section>

            <Section title="睡眠時間">
              <SleepDurationChart points={points} height={120} />
            </Section>

            <Section title="睡眠時間帯">
              <SleepTimeRangeChart points={points} height={200} />
            </Section>

            <ChartXAxis points={points} period={period} />

            {/* タップ捕捉用の透明オーバーレイ */}
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleAreaPress}
              accessibilityLabel="グラフをタップして詳細を表示"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 12 },
  chartArea: {
    position: 'relative',
    gap: 12,
  },
  section: {
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});

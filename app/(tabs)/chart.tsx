import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ChartXAxis } from '@/components/chart/ChartXAxis';
import { MoodChart } from '@/components/chart/MoodChart';
import { PeriodTabs } from '@/components/chart/PeriodTabs';
import { SleepDurationChart } from '@/components/chart/SleepDurationChart';
import { SleepTimeRangeChart } from '@/components/chart/SleepTimeRangeChart';
import { list, type DailyRecordWithIntervals } from '@/db/repositories/daily-record';
import {
  aggregateForMonth,
  aggregateForWeek,
  type ChartPeriod,
  type ChartPoint,
} from '@/domain/chart-aggregation';
import { todayIso } from '@/lib/date';

export default function ChartScreen() {
  const [period, setPeriod] = useState<ChartPeriod>('week');
  const [records, setRecords] = useState<DailyRecordWithIntervals[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      const fetched = await list(toIso(past), toIso(today));
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

  const points: ChartPoint[] =
    period === 'week'
      ? aggregateForWeek(records, todayIso())
      : period === 'month'
        ? aggregateForMonth(records, todayIso())
        : [];

  return (
    <View style={styles.container}>
      <PeriodTabs value={period} onChange={setPeriod} disabledPeriods={['year']} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
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
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function toIso(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 12, gap: 12 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
});

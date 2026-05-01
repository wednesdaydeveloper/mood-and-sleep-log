import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { MoodPicker } from '@/components/mood/MoodPicker';
import { SleepTimeline } from '@/components/sleep-timeline/SleepTimeline';
import { TagSelector } from '@/components/tags/TagSelector';
import { findByDate, upsert } from '@/db/repositories/daily-record';
import { DEFAULT_FORM_VALUES, type RecordFormValues, recordFormSchema } from '@/domain/record-form';
import { type SleepInterval } from '@/domain/sleep';
import { toTimelineInterval } from '@/domain/sleep-mapping';
import { fromIsoDate } from '@/lib/date';

export default function RecordScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const isoDate = typeof date === 'string' ? date : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intervals, setIntervals] = useState<SleepInterval[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!isoDate) {
      setLoading(false);
      return;
    }
    findByDate(isoDate)
      .then((existing) => {
        if (existing) {
          reset({
            moodScore: existing.moodScore,
            moodTags: existing.moodTags,
            memo: existing.memo,
          });
          setIntervals(existing.intervals.map((iv) => toTimelineInterval(isoDate, iv)));
        }
      })
      .finally(() => setLoading(false));
  }, [isoDate, reset]);

  const onSubmit = async (values: RecordFormValues) => {
    const parsed = recordFormSchema.safeParse(values);
    if (!parsed.success) {
      Alert.alert('入力エラー', parsed.error.issues.map((i) => i.message).join('\n'));
      return;
    }
    setSaving(true);
    try {
      await upsert({
        date: isoDate,
        moodScore: parsed.data.moodScore,
        moodTags: parsed.data.moodTags,
        memo: parsed.data.memo,
        intervals: [], // M3 で実装
      });
      router.back();
    } catch (e: unknown) {
      Alert.alert('保存に失敗しました', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: formatTitle(isoDate),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, saving && styles.disabled]}>
                {saving ? '保存中...' : '保存'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="😊 気分">
          <Controller
            control={control}
            name="moodScore"
            render={({ field }) => (
              <MoodPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </Section>

        <SleepTimeline intervals={intervals} />

        <Section title="🏷 感情タグ">
          <Controller
            control={control}
            name="moodTags"
            render={({ field }) => (
              <TagSelector value={field.value} onChange={field.onChange} />
            )}
          />
        </Section>

        <Section title="📝 メモ（任意）">
          <Controller
            control={control}
            name="memo"
            render={({ field }) => (
              <TextInput
                style={styles.memoInput}
                multiline
                placeholder="今日の気持ちや出来事..."
                placeholderTextColor="#999"
                value={field.value ?? ''}
                onChangeText={(text) => field.onChange(text === '' ? null : text)}
                textAlignVertical="top"
              />
            )}
          />
          {errors.memo && <Text style={styles.errorText}>{errors.memo.message}</Text>}
        </Section>
      </ScrollView>
    </>
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

function formatTitle(iso: string): string {
  if (!iso) return '記録';
  const d = fromIsoDate(iso);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 24, paddingBottom: 48 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  memoInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  errorText: { color: '#D32F2F', fontSize: 12 },
  headerButton: { paddingHorizontal: 12, paddingVertical: 6 },
  headerButtonText: { color: '#5B7FFF', fontSize: 16, fontWeight: '600' },
  disabled: { color: '#AAA' },
});

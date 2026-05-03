import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useHeaderHeight } from '@react-navigation/elements';

import { MedicationRadio } from '@/components/medication/MedicationRadio';
import { MoodPicker } from '@/components/mood/MoodPicker';
import { SleepTimeline } from '@/components/sleep-timeline/SleepTimeline';
import { TagSelector } from '@/components/tags/TagSelector';
import { findByDate, upsert } from '@/db/repositories/daily-record';
import {
  PRN_MEDICATION_OPTIONS,
  SLEEP_AID_OPTIONS,
} from '@/domain/medication';
import { DEFAULT_FORM_VALUES, type RecordFormValues, recordFormSchema } from '@/domain/record-form';
import { type SleepInterval } from '@/domain/sleep';
import { toDbInterval, toTimelineInterval } from '@/domain/sleep-mapping';
import { fromIsoDate } from '@/lib/date';
import { logger } from '@/lib/logger';
import { useTheme } from '@/theme/useTheme';

export default function RecordScreen() {
  const { colors } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const isoDate = typeof date === 'string' ? date : '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [intervals, setIntervals] = useState<SleepInterval[]>([]);
  const headerHeight = useHeaderHeight();

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
    let cancelled = false;
    void (async () => {
      try {
        setLoadError(null);
        const existing = await findByDate(isoDate);
        if (cancelled) return;
        if (existing) {
          reset({
            moodScore: existing.moodScore,
            moodTags: existing.moodTags,
            memo: existing.memo,
            sleepAid: existing.sleepAid,
            prnMedication: existing.prnMedication,
            event: existing.event,
          });
          setIntervals(existing.intervals.map((iv) => toTimelineInterval(isoDate, iv)));
        }
      } catch (e: unknown) {
        if (cancelled) return;
        logger.error('record-screen', 'initial load failed', {
          date: isoDate,
          error: String(e),
        });
        setLoadError('記録の読み込みに失敗しました');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
        sleepAid: parsed.data.sleepAid,
        prnMedication: parsed.data.prnMedication,
        event: parsed.data.event,
        intervals: intervals.map((iv) => toDbInterval(isoDate, iv)),
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
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <Text style={{ color: colors.textPrimary }}>読み込み中...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{loadError}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, { color: colors.accent }]}>戻る</Text>
        </Pressable>
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
              accessibilityLabel="保存"
              accessibilityState={{ disabled: saving }}
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
              style={styles.headerButton}
            >
              <Text
                style={[
                  styles.headerButtonText,
                  { color: saving ? colors.textDisabled : colors.accent },
                ]}
              >
                {saving ? '保存中...' : '保存'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.bgPrimary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Section title="😊 気分">
            <Controller
              control={control}
              name="moodScore"
              render={({ field }) => (
                <MoodPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </Section>

          <SleepTimeline intervals={intervals} onChange={setIntervals} />

          <Section title="🏷 感情タグ">
            <Controller
              control={control}
              name="moodTags"
              render={({ field }) => (
                <TagSelector value={field.value} onChange={field.onChange} />
              )}
            />
          </Section>

          <Section title="📅 イベント（任意）">
            <Controller
              control={control}
              name="event"
              render={({ field }) => (
                <TextInput
                  style={[
                    styles.eventInput,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="梅田でショッピング"
                  placeholderTextColor={colors.textDisabled}
                  maxLength={200}
                  value={field.value ?? ''}
                  onChangeText={(text) => field.onChange(text === '' ? null : text)}
                />
              )}
            />
            {errors.event && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.event.message}
              </Text>
            )}
          </Section>

          <Section title="📝 メモ（任意）">
            <Controller
              control={control}
              name="memo"
              render={({ field }) => (
                <TextInput
                  style={[
                    styles.memoInput,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  multiline
                  placeholder="今日の気持ちや出来事..."
                  placeholderTextColor={colors.textDisabled}
                  value={field.value ?? ''}
                  onChangeText={(text) => field.onChange(text === '' ? null : text)}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.memo && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.memo.message}
              </Text>
            )}
          </Section>

          <Section title="💊 睡眠導入剤">
            <Controller
              control={control}
              name="sleepAid"
              render={({ field }) => (
                <MedicationRadio
                  groupLabel="睡眠導入剤"
                  options={SLEEP_AID_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>

          <Section title="💊 頓服薬">
            <Controller
              control={control}
              name="prnMedication"
              render={({ field }) => (
                <MedicationRadio
                  groupLabel="頓服薬"
                  options={PRN_MEDICATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
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
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 24, paddingBottom: 48 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  memoInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  eventInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  errorText: { fontSize: 14 },
  headerButton: { paddingHorizontal: 12, paddingVertical: 6 },
  headerButtonText: { fontSize: 16, fontWeight: '600' },
});

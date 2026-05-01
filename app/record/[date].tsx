import { useEffect, useRef, useState } from 'react';
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
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useHeaderHeight } from '@react-navigation/elements';

import { MoodPicker } from '@/components/mood/MoodPicker';
import { SleepTimeline } from '@/components/sleep-timeline/SleepTimeline';
import { TagSelector } from '@/components/tags/TagSelector';
import { findByDate, upsert } from '@/db/repositories/daily-record';
import { getDraft, removeDraft, saveDraft } from '@/db/repositories/draft';
import { DEFAULT_FORM_VALUES, type RecordFormValues, recordFormSchema } from '@/domain/record-form';
import { type SleepInterval } from '@/domain/sleep';
import { toDbInterval, toTimelineInterval } from '@/domain/sleep-mapping';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';
import { fromIsoDate } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

const DRAFT_DEBOUNCE_MS = 500;

export default function RecordScreen() {
  const { colors } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const isoDate = typeof date === 'string' ? date : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intervals, setIntervals] = useState<SleepInterval[]>([]);
  const headerHeight = useHeaderHeight();
  /** マウント時の読み込み（DB or 下書き）が終わるまで draft 自動保存を抑制する。 */
  const initialLoadComplete = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (!isoDate) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [existing, draft] = await Promise.all([findByDate(isoDate), getDraft(isoDate)]);
        if (cancelled) return;

        const applyExisting = () => {
          if (existing) {
            reset({
              moodScore: existing.moodScore,
              moodTags: existing.moodTags,
              memo: existing.memo,
            });
            setIntervals(existing.intervals.map((iv) => toTimelineInterval(isoDate, iv)));
          }
        };

        const applyDraft = () => {
          if (!draft) return;
          reset({
            moodScore: draft.payload.moodScore,
            moodTags: draft.payload.moodTags,
            memo: draft.payload.memo,
          });
          setIntervals(draft.payload.intervals);
        };

        if (draft) {
          // 既存記録を先に反映してから、下書き復元するか確認
          applyExisting();
          Alert.alert('下書きを復元しますか？', '未保存の入力があります。', [
            {
              text: '破棄',
              style: 'destructive',
              onPress: () => void removeDraft(isoDate),
            },
            { text: '復元', onPress: applyDraft },
          ]);
        } else {
          applyExisting();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          initialLoadComplete.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isoDate, reset]);

  // 値変更ごとに 500ms debounce で下書き保存
  useDebouncedEffect(
    () => {
      if (!initialLoadComplete.current || !isoDate || saving) return;
      const moodScore = watchedValues.moodScore ?? DEFAULT_FORM_VALUES.moodScore;
      void saveDraft(isoDate, {
        moodScore,
        moodTags: watchedValues.moodTags ?? [],
        memo: watchedValues.memo ?? null,
        intervals,
      });
    },
    [isoDate, watchedValues.moodScore, watchedValues.moodTags, watchedValues.memo, intervals, saving],
    DRAFT_DEBOUNCE_MS,
  );

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
        intervals: intervals.map((iv) => toDbInterval(isoDate, iv)),
      });
      // 保存完了で下書き破棄
      await removeDraft(isoDate);
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
            {errors.memo && <Text style={styles.errorText}>{errors.memo.message}</Text>}
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
  errorText: { color: '#D32F2F', fontSize: 12 },
  headerButton: { paddingHorizontal: 12, paddingVertical: 6 },
  headerButtonText: { fontSize: 16, fontWeight: '600' },
});

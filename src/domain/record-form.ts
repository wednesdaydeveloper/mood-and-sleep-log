import { z } from 'zod';

import { MOOD_SCORES } from './mood';
import { isValidTagName } from './tags';

export const recordFormSchema = z.object({
  moodScore: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
  ]),
  moodTags: z
    .array(z.string())
    .refine((tags) => tags.every(isValidTagName), {
      message: '未定義のタグが含まれています',
    }),
  memo: z.string().max(2000, 'メモは 2000 文字以内で入力してください').nullable(),
});

export type RecordFormValues = z.infer<typeof recordFormSchema>;

export const DEFAULT_FORM_VALUES: RecordFormValues = {
  moodScore: 0,
  moodTags: [],
  memo: null,
};

// 念のため: MoodScore 型と zod スキーマの整合を型レベルで担保
const _moodScoresExhaustive: readonly RecordFormValues['moodScore'][] = MOOD_SCORES;
void _moodScoresExhaustive;

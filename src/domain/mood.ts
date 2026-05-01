// 気分スケール（要件 §FR-1.2 / §3 用語定義）
// −2（とても悪い）〜 +2（とても良い）の5段階

export const MOOD_SCORES = [-2, -1, 0, 1, 2] as const;

export type MoodScore = (typeof MOOD_SCORES)[number];

export const MOOD_EMOJI: Record<MoodScore, string> = {
  [-2]: '😢',
  [-1]: '🙁',
  [0]: '😐',
  [1]: '🙂',
  [2]: '😄',
};

export const MOOD_LABEL: Record<MoodScore, string> = {
  [-2]: 'とても悪い',
  [-1]: '悪い',
  [0]: '普通',
  [1]: '良い',
  [2]: 'とても良い',
};

export function isMoodScore(value: unknown): value is MoodScore {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    (MOOD_SCORES as readonly number[]).includes(value)
  );
}

// 服薬記録のドメイン定義（要件 §FR-1.6 / 設計 §17）。
// 内部値は安定キー（英数字）で持ち、表示ラベルは MEDICATION_LABEL で別管理。

/** 睡眠導入剤の選択肢（null = なし）。 */
export const SLEEP_AID_OPTIONS = [
  'lunesta-0.25',
  'lunesta-0.5',
  'lunesta-0.75',
  'lunesta-1.0',
  'lunesta-1.5',
  'lunesta-2.0',
  'lunesta-2.5',
  'lunesta-3.0',
] as const;

export type SleepAidValue = (typeof SLEEP_AID_OPTIONS)[number];
export type SleepAid = SleepAidValue | null;

/** 頓服薬の選択肢（null = なし）。 */
export const PRN_MEDICATION_OPTIONS = [
  'lunesta-1.0',
  'lunesta-2.0',
  'lunesta-3.0',
] as const;

export type PrnMedicationValue = (typeof PRN_MEDICATION_OPTIONS)[number];
export type PrnMedication = PrnMedicationValue | null;

/** 安定キー → 表示ラベル。睡眠導入剤・頓服薬の双方で共有可能なラベル。 */
export const MEDICATION_LABEL: Record<SleepAidValue, string> = {
  'lunesta-0.25': 'ルネスタ 0.25mg',
  'lunesta-0.5': 'ルネスタ 0.5mg',
  'lunesta-0.75': 'ルネスタ 0.75mg',
  'lunesta-1.0': 'ルネスタ 1.0mg',
  'lunesta-1.5': 'ルネスタ 1.5mg',
  'lunesta-2.0': 'ルネスタ 2.0mg',
  'lunesta-2.5': 'ルネスタ 2.5mg',
  'lunesta-3.0': 'ルネスタ 3.0mg',
};

/** 「なし」表示用ラベル。UI とテストで使用。 */
export const NONE_LABEL = 'なし';

/** 値の表示ラベルを返す。null は「なし」。 */
export function medicationLabel(value: SleepAid | PrnMedication): string {
  if (value === null) return NONE_LABEL;
  return MEDICATION_LABEL[value] ?? value;
}

export function isSleepAid(value: unknown): value is SleepAid {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  return (SLEEP_AID_OPTIONS as readonly string[]).includes(value);
}

export function isPrnMedication(value: unknown): value is PrnMedication {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  return (PRN_MEDICATION_OPTIONS as readonly string[]).includes(value);
}

/**
 * 永続層から読んだ任意の値を `SleepAid` に正規化する。不正値は null（なし）扱い。
 * 空文字列も null と等価に扱う（CSV インポート時の互換性）。
 */
export function coerceSleepAid(value: unknown): SleepAid {
  if (value === '' || value === undefined) return null;
  return isSleepAid(value) ? value : null;
}

export function coercePrnMedication(value: unknown): PrnMedication {
  if (value === '' || value === undefined) return null;
  return isPrnMedication(value) ? value : null;
}

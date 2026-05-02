import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  NONE_LABEL,
  medicationLabel,
  type SleepAidValue,
} from '@/domain/medication';
import { useTheme } from '@/theme/useTheme';

interface MedicationRadioProps<TValue extends SleepAidValue> {
  /** 「なし」以外の選択肢の安定キー一覧。 */
  options: readonly TValue[];
  /** 現在の選択値。null = 「なし」。 */
  value: TValue | null;
  /** 選択変更時のコールバック。null = 「なし」。 */
  onChange: (next: TValue | null) => void;
  /** スクリーンリーダー用のグループ名（例: 「睡眠導入剤」）。 */
  groupLabel: string;
}

/**
 * 服薬記録用の単一選択ラジオ。
 * 先頭に「なし」（null）を固定で表示し、続けて options をそのまま表示する。
 *
 * TValue は MEDICATION_LABEL のキーと整合させるため SleepAidValue に制約。
 * PrnMedicationValue は SleepAidValue の部分集合なので両方で利用可能。
 */
export function MedicationRadio<TValue extends SleepAidValue>({
  options,
  value,
  onChange,
  groupLabel,
}: MedicationRadioProps<TValue>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={groupLabel}
      style={styles.container}
    >
      <Row
        label={NONE_LABEL}
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {options.map((option) => (
        <Row
          key={option}
          label={medicationLabel(option)}
          selected={value === option}
          onPress={() => onChange(option)}
        />
      ))}
    </View>
  );
}

interface RowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Row({ label, selected, onPress }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.bgSubtle : colors.bgSecondary,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.circleOuter,
          { borderColor: selected ? colors.accent : colors.border },
        ]}
      >
        {selected && (
          <View style={[styles.circleInner, { backgroundColor: colors.accent }]} />
        )}
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  circleOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: { fontSize: 14 },
});

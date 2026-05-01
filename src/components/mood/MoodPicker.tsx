import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_EMOJI, MOOD_LABEL, MOOD_SCORES, type MoodScore } from '@/domain/mood';
import { useTheme } from '@/theme/useTheme';

interface MoodPickerProps {
  value: MoodScore;
  onChange: (value: MoodScore) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {MOOD_SCORES.map((score) => {
        const selected = score === value;
        return (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`気分: ${MOOD_LABEL[score]}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(score)}
            style={[
              styles.item,
              { borderColor: colors.border, backgroundColor: colors.bgSecondary },
              selected && {
                borderColor: colors.accent,
                backgroundColor: colors.bgSubtle,
              },
            ]}
          >
            <Text style={styles.emoji}>{MOOD_EMOJI[score]}</Text>
            <Text style={[styles.score, { color: colors.textSecondary }]}>
              {score > 0 ? `+${score}` : `${score}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  emoji: { fontSize: 28 },
  score: { fontSize: 12, marginTop: 2 },
});

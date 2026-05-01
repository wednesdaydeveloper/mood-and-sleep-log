import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_EMOJI, MOOD_LABEL, MOOD_SCORES, type MoodScore } from '@/domain/mood';

interface MoodPickerProps {
  value: MoodScore;
  onChange: (value: MoodScore) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
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
            style={[styles.item, selected && styles.itemSelected]}
          >
            <Text style={styles.emoji}>{MOOD_EMOJI[score]}</Text>
            <Text style={styles.score}>
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
    borderColor: '#E0E0E0',
  },
  itemSelected: {
    borderColor: '#5B7FFF',
    backgroundColor: '#EEF2FF',
  },
  emoji: { fontSize: 28 },
  score: { fontSize: 12, color: '#666', marginTop: 2 },
});

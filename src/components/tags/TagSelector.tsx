import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  TAG_CATEGORY_LABEL,
  getTagsByCategory,
  type TagCategory,
} from '@/domain/tags';
import { useTheme } from '@/theme/useTheme';

interface TagSelectorProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
}

const CATEGORIES: TagCategory[] = ['negative', 'positive', 'state', 'thought'];

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const { colors } = useTheme();
  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((v) => v !== name));
    } else {
      onChange([...value, name]);
    }
  };

  return (
    <View style={styles.container}>
      {CATEGORIES.map((category) => (
        <View key={category} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {TAG_CATEGORY_LABEL[category]}
          </Text>
          <View style={styles.chipRow}>
            {getTagsByCategory(category).map((tag) => {
              const selected = value.includes(tag.name);
              return (
                <Pressable
                  key={tag.name}
                  accessibilityRole="button"
                  accessibilityLabel={`タグ: ${tag.name}`}
                  accessibilityState={{ selected }}
                  onPress={() => toggle(tag.name)}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accent : colors.bgSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? colors.textOnAccent : colors.textPrimary },
                    ]}
                  >
                    {tag.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
});

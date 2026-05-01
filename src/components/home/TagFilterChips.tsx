import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  TAG_CATEGORY_LABEL,
  getTagsByCategory,
  type TagCategory,
} from '@/domain/tags';
import { useTheme } from '@/theme/useTheme';

interface TagFilterChipsProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
}

const CATEGORIES: TagCategory[] = ['negative', 'positive', 'state', 'thought'];

/**
 * タグでの絞り込み UI（折りたたみ式）。選択中のタグ数をヘッダーに表示。
 */
export function TagFilterChips({ value, onChange }: TagFilterChipsProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((v) => v !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const headerText =
    value.length === 0 ? 'タグで絞り込み' : `タグで絞り込み (${value.length})`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'タグ絞り込みを閉じる' : 'タグ絞り込みを開く'}
          accessibilityState={{ expanded }}
          style={styles.header}
        >
          <Text style={[styles.headerText, { color: colors.textPrimary }]}>
            {headerText}
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            {expanded ? '▲' : '▼'}
          </Text>
        </Pressable>
        {value.length > 0 && (
          <Pressable
            onPress={() => onChange([])}
            accessibilityRole="button"
            accessibilityLabel="選択中のタグをすべてクリア"
            style={styles.clearBtn}
          >
            <Text style={[styles.clearText, { color: colors.accent }]}>クリア</Text>
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.body}>
          {CATEGORIES.map((category) => (
            <View key={category} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {TAG_CATEGORY_LABEL[category]}
              </Text>
              <View style={styles.chipRow}>
                {getTagsByCategory(category).map((tag) => {
                  const selected = value.includes(tag.name);
                  return (
                    <Pressable
                      key={tag.name}
                      onPress={() => toggle(tag.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`タグ: ${tag.name}`}
                      accessibilityState={{ selected }}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? colors.accent : 'transparent',
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  headerText: { fontSize: 13 },
  chevron: { fontSize: 10 },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  clearText: { fontSize: 12 },
  body: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: { fontSize: 12 },
});

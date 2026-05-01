import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgSubtle, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.icon, { color: colors.textSecondary }]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        placeholder="メモ・タグで検索"
        placeholderTextColor={colors.textDisabled}
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="検索キーワード"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="検索キーワードをクリア"
          style={styles.clearBtn}
        >
          <Text style={[styles.clearText, { color: colors.textSecondary }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 14,
  },
});

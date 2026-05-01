import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { list } from '@/db/repositories/daily-record';
import { shareRecordsAsCsv } from '@/lib/share';
import { todayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const records = await list('1970-01-01', todayIso());
      const result = await shareRecordsAsCsv(records);
      if (result.status === 'empty') {
        Alert.alert('CSV エクスポート', result.message ?? 'データがありません');
      } else if (result.status === 'unsupported') {
        Alert.alert('CSV エクスポート', result.message ?? 'この端末では共有できません');
      } else if (result.status === 'failed') {
        Alert.alert('エクスポートに失敗しました', result.message ?? '');
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <Section title="データ">
        <SettingRow
          label="📤 CSV エクスポート"
          description="全データを CSV ファイルとして共有します"
          onPress={handleExport}
          disabled={exporting}
          accessory={
            exporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            )
          }
        />
        <Text style={[styles.warning, { color: colors.textSecondary }]}>
          ⚠️ エクスポートしたデータには気分・メモ等が含まれます。共有先にご注意ください。
        </Text>
      </Section>

      <Section title="アプリについて">
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textPrimary }]}>バージョン</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>0.1.0</Text>
        </View>
      </Section>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.bgSecondary }]}>{children}</View>
    </View>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  accessory?: React.ReactNode;
}

function SettingRow({ label, description, onPress, disabled, accessory }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={description}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.bgSubtle },
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {description && (
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {accessory}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sectionBody: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowDisabled: { opacity: 0.5 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15 },
  rowDescription: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 18 },
  warning: { fontSize: 11, paddingHorizontal: 8, lineHeight: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15 },
});

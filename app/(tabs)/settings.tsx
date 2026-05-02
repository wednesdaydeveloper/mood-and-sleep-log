import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { list } from '@/db/repositories/daily-record';
import type { ParsedCsvRecord } from '@/domain/csv';
import { applyImport, loadAndParseCsv, pickCsvFile } from '@/lib/import';
import { shareRecordsAsCsv } from '@/lib/share';
import { todayIso } from '@/lib/date';
import { useTheme } from '@/theme/useTheme';

/** app.json の expo.version を起点とする表示用バージョン。 */
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const finalConfirmAndApply = (records: ParsedCsvRecord[]) => {
    Alert.alert('本当によろしいですか？', `${records.length} 件を CSV から取り込みます。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '実行',
        style: 'destructive',
        onPress: async () => {
          setImporting(true);
          try {
            const result = await applyImport(records);
            if (result.status === 'applied') {
              Alert.alert('完了', `${result.importedCount} 件をインポートしました`);
            } else {
              Alert.alert('インポートに失敗しました', result.message ?? '');
            }
          } finally {
            setImporting(false);
          }
        },
      },
    ]);
  };

  const handleImport = async () => {
    setImporting(true);
    let parsedRecords: ParsedCsvRecord[] = [];
    let errorCount = 0;
    try {
      const picked = await pickCsvFile();
      if (picked.status === 'cancelled') return;
      if (picked.status === 'failed' || !picked.uri) {
        Alert.alert('CSV インポート', picked.message ?? 'ファイルを取得できませんでした');
        return;
      }

      const parsed = await loadAndParseCsv(picked.uri);
      if (parsed.status === 'failed' || parsed.status === 'empty') {
        Alert.alert(
          parsed.status === 'empty' ? 'データなし' : 'CSV のパースに失敗',
          parsed.message ?? '形式を確認してください',
        );
        return;
      }
      parsedRecords = parsed.records;
      errorCount = parsed.errors.length;
    } finally {
      setImporting(false);
    }

    const importedCount = parsedRecords.length;
    const summary =
      errorCount > 0
        ? `${importedCount} 件のレコードが見つかりました\n（${errorCount} 件は形式不正でスキップされます）`
        : `${importedCount} 件のレコードが見つかりました`;

    // 1段階目: 警告
    Alert.alert(
      '⚠️ 既存データの全削除',
      `${summary}\n\nインポートを実行すると、現在のすべての記録が削除され、CSV の内容で置き換えられます。元に戻すことはできません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '次へ',
          style: 'destructive',
          onPress: () => finalConfirmAndApply(parsedRecords),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <Section title="データ">
        <SettingRow
          label="📤 CSV エクスポート"
          description="全データを CSV ファイルとして共有します"
          onPress={handleExport}
          disabled={exporting || importing}
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

        <SettingRow
          label="📥 CSV インポート"
          description="既存データを全削除し、CSV の内容で置き換えます"
          onPress={handleImport}
          disabled={exporting || importing}
          accessory={
            importing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            )
          }
        />
        <Text style={[styles.warning, { color: colors.danger }]}>
          ⚠️ インポートを実行すると、既存のすべての記録が削除されます。
        </Text>
      </Section>

      <Section title="アプリについて">
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textPrimary }]}>バージョン</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{APP_VERSION}</Text>
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

import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { list } from '@/db/repositories/daily-record';
import { shareRecordsAsCsv } from '@/lib/share';
import { todayIso } from '@/lib/date';

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // 全期間のレコードをエクスポート（適当な十分過去の日付から今日まで）
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
    <View style={styles.container}>
      <Section title="データ">
        <SettingRow
          label="📤 CSV エクスポート"
          description="全データを CSV ファイルとして共有します"
          onPress={handleExport}
          disabled={exporting}
          accessory={exporting ? <ActivityIndicator size="small" /> : <Text style={styles.chevron}>›</Text>}
        />
        <Text style={styles.warning}>
          ⚠️ エクスポートしたデータには気分・メモ等が含まれます。共有先にご注意ください。
        </Text>
      </Section>

      <Section title="アプリについて">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>バージョン</Text>
          <Text style={styles.infoValue}>0.1.0</Text>
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDescription}>{description}</Text>}
      </View>
      {accessory}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sectionBody: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: '#F0F2F8',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: '#333',
  },
  rowDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#999',
  },
  warning: {
    fontSize: 11,
    color: '#888',
    paddingHorizontal: 8,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoLabel: { fontSize: 15, color: '#333' },
  infoValue: { fontSize: 15, color: '#888' },
});

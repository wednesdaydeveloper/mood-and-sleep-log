import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { sql } from 'drizzle-orm';

import { db } from '@/db/client';

export default function HomeScreen() {
  const [tableCount, setTableCount] = useState<number | null>(null);

  useEffect(() => {
    // M1.2 動作確認用: DB が初期化されてテーブルが作成されたかを確認
    // Drizzle の内部テーブル (__drizzle_migrations) を除外し、要件で定義したテーブル数を表示
    const result = db.all<{ count: number }>(
      sql`SELECT COUNT(*) AS count FROM sqlite_master
          WHERE type='table'
            AND name NOT LIKE 'sqlite_%'
            AND name NOT LIKE '__drizzle_%'`,
    );
    setTableCount(result[0]?.count ?? 0);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      <Text style={styles.subtitle}>記録一覧（M2 で実装）</Text>
      <Text style={styles.dbStatus}>
        DB テーブル数: {tableCount === null ? '確認中...' : tableCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dbStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 16,
  },
});

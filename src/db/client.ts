import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';

import migrations from './migrations/migrations';
import * as schema from './schema';

const DB_NAME = 'mood-and-sleep-log.db';

const sqlite = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;
  await migrate(db, migrations);
  await cleanupOnStart();
  initialized = true;
}

async function cleanupOnStart(): Promise<void> {
  // 循環依存を避けるため動的 import
  const { cleanupExpiredDrafts } = await import('./repositories/draft');
  const { logger } = await import('@/lib/logger');
  try {
    await cleanupExpiredDrafts();
  } catch (e) {
    // 起動時クリーンアップの失敗はアプリ機能に影響しないが、
    // 沈黙させずにログには残す
    logger.warn('db-client', 'cleanupOnStart failed', { error: String(e) });
  }
}

// iOS のクラウドバックアップ除外 (NSURLIsExcludedFromBackupKey) は
// expo-file-system v19 で直接APIが提供されていないため、M7 で対応予定。
// Android は app.json の allowBackup=false で除外済み（§11 参照）。

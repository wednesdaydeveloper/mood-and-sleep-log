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
  initialized = true;
}

// iOS のクラウドバックアップ除外 (NSURLIsExcludedFromBackupKey) は
// expo-file-system v19 で直接APIが提供されていないため、M7 で対応予定。
// Android は app.json の allowBackup=false で除外済み（§11 参照）。

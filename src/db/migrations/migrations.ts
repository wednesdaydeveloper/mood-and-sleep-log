// Drizzle ORM のマイグレーション。babel-plugin-inline-import を使わず、
// SQL を直接文字列として埋め込む（Metro/babel の transform 問題を回避）。
//
// 新しいマイグレーションを drizzle-kit generate で生成したら、
// このファイルにエントリを追加すること。
//
// Source:
//   - ./0000_tense_carlie_cooper.sql / ./meta/_journal.json
//   - ./0001_melodic_screwball.sql (v1.2 服薬記録カラム追加)
//   - ./0002_eager_dragon_lord.sql (v1.3 イベントカラム追加)

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`daily_record\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`date\` text NOT NULL,
	\`mood_score\` integer NOT NULL,
	\`mood_tags\` text NOT NULL,
	\`memo\` text,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`idx_daily_record_date\` ON \`daily_record\` (\`date\`);--> statement-breakpoint
CREATE TABLE \`draft_record\` (
	\`date\` text PRIMARY KEY NOT NULL,
	\`payload\` text NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`sleep_interval\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`record_id\` text NOT NULL,
	\`start_at\` integer NOT NULL,
	\`end_at\` integer NOT NULL,
	FOREIGN KEY (\`record_id\`) REFERENCES \`daily_record\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`idx_sleep_interval_record\` ON \`sleep_interval\` (\`record_id\`);--> statement-breakpoint
CREATE INDEX \`idx_sleep_interval_start\` ON \`sleep_interval\` (\`start_at\`);`;

const m0001 = `ALTER TABLE \`daily_record\` ADD \`sleep_aid\` text;
--> statement-breakpoint
ALTER TABLE \`daily_record\` ADD \`prn_medication\` text;`;

const m0002 = `ALTER TABLE \`daily_record\` ADD \`event\` text;`;

const migrations = {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
  },
};

export default migrations;

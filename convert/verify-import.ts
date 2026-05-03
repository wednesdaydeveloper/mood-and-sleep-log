// 生成した CSV をアプリの parseCsv で実際にパースして検証する。
// 実行: npx tsx convert/verify-import.ts

// React Native のグローバル __DEV__ が必要なためポリフィル
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCsv } from '../src/domain/csv';

const csvPath = join(__dirname, 'converted.csv');
const content = readFileSync(csvPath, 'utf-8');

const result = parseCsv(content);

console.log(`総行数: ${result.records.length}`);
console.log(`エラー数: ${result.errors.length}`);

if (result.errors.length > 0) {
  console.log('\n--- エラー詳細（最大 20 件） ---');
  for (const e of result.errors.slice(0, 20)) {
    console.log(`  line ${e.line}: ${e.message}`);
  }
}

// 統計
const moodDist: Record<number, number> = {};
const sleepAidDist: Record<string, number> = {};
const prnDist: Record<string, number> = {};
let intervalCount = 0;
let memoCount = 0;

for (const r of result.records) {
  moodDist[r.moodScore] = (moodDist[r.moodScore] ?? 0) + 1;
  const sa = r.sleepAid ?? 'null';
  sleepAidDist[sa] = (sleepAidDist[sa] ?? 0) + 1;
  const pr = r.prnMedication ?? 'null';
  prnDist[pr] = (prnDist[pr] ?? 0) + 1;
  if (r.intervals.length > 0) intervalCount++;
  if (r.memo) memoCount++;
}

console.log('\n--- mood 分布 ---');
for (const [k, v] of Object.entries(moodDist).sort()) {
  console.log(`  ${k}: ${v}`);
}
console.log('\n--- sleepAid 分布 ---');
for (const [k, v] of Object.entries(sleepAidDist).sort()) {
  console.log(`  ${k}: ${v}`);
}
console.log('\n--- prnMedication 分布 ---');
for (const [k, v] of Object.entries(prnDist).sort()) {
  console.log(`  ${k}: ${v}`);
}
console.log(`\n睡眠区間ありの日数: ${intervalCount}`);
console.log(`メモありの日数: ${memoCount}`);
console.log(`日付範囲: ${result.records[0]?.date} 〜 ${result.records[result.records.length - 1]?.date}`);

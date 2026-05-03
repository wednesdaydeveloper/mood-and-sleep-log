import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { replaceAll } from '@/db/repositories/daily-record';
import { parseCsv, type CsvParseError, type ParsedCsvRecord } from '@/domain/csv';
import { toDbInterval } from '@/domain/sleep-mapping';

import { logger } from './logger';

export interface PickResult {
  status: 'picked' | 'cancelled' | 'failed';
  uri?: string;
  message?: string;
}

export interface ParseResult {
  status: 'parsed' | 'empty' | 'failed';
  records: ParsedCsvRecord[];
  errors: CsvParseError[];
  message?: string;
}

export interface ApplyResult {
  status: 'applied' | 'failed';
  importedCount?: number;
  message?: string;
}

/** CSV ファイルを選択させる。キャンセルや失敗時は status で表現。 */
export async function pickCsvFile(): Promise<PickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return { status: 'cancelled' };
    const asset = result.assets[0];
    if (!asset) return { status: 'failed', message: 'ファイルを取得できませんでした' };
    return { status: 'picked', uri: asset.uri };
  } catch (e: unknown) {
    logger.error('import', 'pickCsvFile failed', { error: String(e) });
    return {
      status: 'failed',
      message: e instanceof Error ? e.message : '不明なエラー',
    };
  }
}

/** 選択された CSV ファイルを読み込んでパースする。 */
export async function loadAndParseCsv(uri: string): Promise<ParseResult> {
  try {
    const file = new File(uri);
    const content = file.textSync();
    const parsed = parseCsv(content);
    if (parsed.records.length === 0 && parsed.errors.length > 0) {
      return {
        status: 'failed',
        records: [],
        errors: parsed.errors,
        message: parsed.errors[0]?.message ?? 'CSV のパースに失敗しました',
      };
    }
    if (parsed.records.length === 0) {
      return {
        status: 'empty',
        records: [],
        errors: parsed.errors,
        message: 'CSV にデータ行がありません',
      };
    }
    return { status: 'parsed', records: parsed.records, errors: parsed.errors };
  } catch (e: unknown) {
    logger.error('import', 'loadAndParseCsv failed', { error: String(e) });
    return {
      status: 'failed',
      records: [],
      errors: [],
      message: e instanceof Error ? e.message : '不明なエラー',
    };
  }
}

/** パース済みレコードで DB を置換する。失敗時はロールバック済み。 */
export async function applyImport(records: readonly ParsedCsvRecord[]): Promise<ApplyResult> {
  try {
    const inputs = records.map((r) => ({
      date: r.date,
      moodScore: r.moodScore,
      moodTags: r.moodTags,
      memo: r.memo,
      sleepAid: r.sleepAid,
      prnMedication: r.prnMedication,
      event: r.event,
      diary: r.diary,
      intervals: r.intervals.map((iv) =>
        toDbInterval(r.date, { id: '', startMin: iv.startMin, endMin: iv.endMin }),
      ),
    }));
    await replaceAll(inputs);
    return { status: 'applied', importedCount: inputs.length };
  } catch (e: unknown) {
    logger.error('import', 'applyImport failed', { error: String(e) });
    return {
      status: 'failed',
      message: e instanceof Error ? e.message : '不明なエラー',
    };
  }
}

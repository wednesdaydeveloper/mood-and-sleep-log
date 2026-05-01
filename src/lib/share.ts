import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { recordsToCsv } from '@/domain/csv';
import type { DailyRecordWithIntervals } from '@/db/repositories/daily-record';

import { todayIso } from './date';
import { logger } from './logger';

export interface ShareCsvResult {
  status: 'shared' | 'unsupported' | 'empty' | 'failed';
  message?: string;
}

/**
 * 全レコードを CSV にして OS のシェアシートで共有する。
 * - 空配列ならエクスポートしない
 * - シェアが不可なデバイスでは unsupported を返す
 */
export async function shareRecordsAsCsv(
  records: readonly DailyRecordWithIntervals[],
): Promise<ShareCsvResult> {
  if (records.length === 0) {
    return { status: 'empty', message: 'エクスポートできるデータがありません' };
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return { status: 'unsupported', message: 'この端末では共有機能が使用できません' };
  }

  const csv = recordsToCsv(records);
  const fileName = `mood-and-sleep-log-${todayIso()}.csv`;

  try {
    const file = new File(Paths.cache, fileName);
    if (file.exists) file.delete();
    file.create();
    file.write(csv);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'CSV をエクスポート',
    });
    return { status: 'shared' };
  } catch (e: unknown) {
    logger.error('share', 'shareRecordsAsCsv failed', { error: String(e) });
    return {
      status: 'failed',
      message: e instanceof Error ? e.message : '不明なエラー',
    };
  }
}

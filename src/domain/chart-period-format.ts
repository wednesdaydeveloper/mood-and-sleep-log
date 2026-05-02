// グラフ画面のヘッダーに出す「期間ラベル」のフォーマッタ。
// year モードでは集約点の dateIso が "yyyy-MM"（日なし）になるため、
// fromIsoDate（yyyy-MM-dd 必須）を経由せず文字列ベースでパースする。

import { fromIsoDate } from '@/lib/date';

import { type ChartPeriod } from './chart-aggregation';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})/;

/**
 * グラフ画面の期間ナビゲーターに表示するラベルを返す。
 *
 * - week / month: `M/D(曜) 〜 M/D(曜)`
 * - year: `yyyy/M 〜 yyyy/M`（dateIso が "yyyy-MM" でも "yyyy-MM-dd" でも受理）
 */
export function formatPeriodRange(
  period: ChartPeriod,
  startIso: string,
  endIso: string,
): string {
  if (period === 'year') {
    return `${formatYearMonth(startIso)} 〜 ${formatYearMonth(endIso)}`;
  }
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}(${DAY_LABELS[start.getDay()]})`;
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}(${DAY_LABELS[end.getDay()]})`;
  return `${startLabel} 〜 ${endLabel}`;
}

/** "yyyy-MM" または "yyyy-MM-dd" の先頭から `yyyy/M` を組み立てる。 */
function formatYearMonth(iso: string): string {
  const m = YEAR_MONTH_PATTERN.exec(iso);
  if (!m) {
    throw new Error(`Invalid year-month string: "${iso}"`);
  }
  return `${m[1]}/${parseInt(m[2]!, 10)}`;
}

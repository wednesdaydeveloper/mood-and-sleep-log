// 日付の入出力は ISO yyyy-MM-dd の文字列で統一する。
// 端末ローカルタイムゾーンで日付を扱う（記録日はユーザーの暮らしの単位）。

const PAD = (n: number): string => n.toString().padStart(2, '0');

/** Date を ISO yyyy-MM-dd 文字列にフォーマットする（端末ローカルタイムゾーン）。 */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
}

/** ISO yyyy-MM-dd を端末ローカルタイムゾーンの 0:00:00 の Date に変換する。 */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/** 今日の日付を ISO yyyy-MM-dd で返す。 */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** 昨日の日付を ISO yyyy-MM-dd で返す（記録のデフォルト記録日）。 */
export function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toIsoDate(d);
}

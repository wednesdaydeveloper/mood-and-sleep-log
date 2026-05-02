// 折れ線グラフ（MoodChart / SleepDurationChart）の軸ラベル用 Skia フォント定義。
// year ビューのラベル "M月" のような CJK 文字を含むため、Latin 専用の
// Helvetica ではなく日本語グリフを持つフォントを指定する。

import { Platform } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';

/**
 * iOS は Hiragino Sans（OS 標準同梱・日本語+ラテンの両方を含む）。
 * Android は sans-serif（端末の CJK フォールバックに任せる）。
 */
export const chartAxisFont = matchFont({
  fontFamily: Platform.select({
    ios: 'Hiragino Sans',
    default: 'sans-serif',
  }),
  fontSize: 11,
});

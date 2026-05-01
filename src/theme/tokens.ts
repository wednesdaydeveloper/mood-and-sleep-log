// 設計 §08 デザインシステムのトークン。ライト/ダークの 2 セットを提供。
// 数値（spacing/radius/typography）はモード共通で別ファイル。

export interface ColorTokens {
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  bgSubtle: string;

  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textOnAccent: string;

  border: string;

  accent: string;
  danger: string;

  // チャート系: ライト/ダークで微調整
  chartMood: string;
  chartSleep: string;
  chartSleepRange: string;
  chartGrid: string;

  // 個別 UI
  tabBarActive: string;
  fab: string;
  popupBg: string;
  popupText: string;
}

export const lightColors: ColorTokens = {
  bgPrimary: '#F8F9FB',
  bgSecondary: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgSubtle: '#F0F2F8',

  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textDisabled: '#AAAAAA',
  textOnAccent: '#FFFFFF',

  border: '#E0E0E0',

  accent: '#5B7FFF',
  danger: '#D32F2F',

  chartMood: '#4CAF50',
  chartSleep: '#1E88E5',
  chartSleepRange: '#E53935',
  chartGrid: '#E0E0E0',

  tabBarActive: '#5B7FFF',
  fab: '#5B7FFF',
  popupBg: '#1F2937',
  popupText: '#FFFFFF',
};

export const darkColors: ColorTokens = {
  bgPrimary: '#0F1115',
  bgSecondary: '#1A1D24',
  bgElevated: '#262B33',
  bgSubtle: '#2D3340',

  textPrimary: '#F5F5F7',
  textSecondary: '#B0B5BD',
  textDisabled: '#6B7280',
  textOnAccent: '#FFFFFF',

  border: '#3A3F4A',

  accent: '#7B9BFF',
  danger: '#FF6B6B',

  // ダークモードでは彩度を抑え、明度を上げる
  chartMood: '#66BB6A',
  chartSleep: '#42A5F5',
  chartSleepRange: '#EF5350',
  chartGrid: '#3A3F4A',

  tabBarActive: '#7B9BFF',
  fab: '#5B7FFF',
  popupBg: '#0B0F14',
  popupText: '#F5F5F7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

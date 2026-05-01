import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from './tokens';

/**
 * 端末の色モードに応じて色トークンを返すフック。
 * `useColorScheme` が undefined（環境依存）の場合はライトを既定とする。
 */
export function useTheme(): { colors: ColorTokens; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme();
  const resolved = scheme === 'dark' ? 'dark' : 'light';
  return {
    colors: resolved === 'dark' ? darkColors : lightColors,
    scheme: resolved,
  };
}

export type { ColorTokens };

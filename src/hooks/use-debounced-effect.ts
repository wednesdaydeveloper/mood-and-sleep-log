import { useEffect } from 'react';

/**
 * 値が変わるたびに `delayMs` 後に effect を実行する。
 * 連続変更があれば最後の変更から `delayMs` 後だけが走る（debounce）。
 */
export function useDebouncedEffect(
  effect: () => void,
  deps: readonly unknown[],
  delayMs: number,
): void {
  useEffect(() => {
    const handle = setTimeout(effect, delayMs);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs]);
}

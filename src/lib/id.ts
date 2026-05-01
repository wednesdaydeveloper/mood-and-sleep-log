import { randomUUID } from 'expo-crypto';

/** 主キー用の UUID v4 を生成する。 */
export function newId(): string {
  return randomUUID();
}

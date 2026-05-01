// アプリの軽量ロガー。設計書 §09。
// v1.0 ではローカル永続化は行わず、開発時 console 出力のみ。
// 将来は AsyncStorage / SQLite への保存を追加可能（同インターフェースのまま差し替え）。

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(module: string, message: string, context?: Record<string, unknown>): void;
  info(module: string, message: string, context?: Record<string, unknown>): void;
  warn(module: string, message: string, context?: Record<string, unknown>): void;
  error(module: string, message: string, context?: Record<string, unknown>): void;
}

function emit(
  level: LogLevel,
  module: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (!__DEV__ && level === 'debug') return;
  const tag = `[${level}][${module}]`;
  // メモ等の機微情報をログに含めないよう、context は呼び出し側でスクラビング済み前提
  if (level === 'error') console.error(tag, message, context ?? '');
  else if (level === 'warn') console.warn(tag, message, context ?? '');
  else console.log(tag, message, context ?? '');
}

export const logger: Logger = {
  debug: (m, msg, ctx) => emit('debug', m, msg, ctx),
  info: (m, msg, ctx) => emit('info', m, msg, ctx),
  warn: (m, msg, ctx) => emit('warn', m, msg, ctx),
  error: (m, msg, ctx) => emit('error', m, msg, ctx),
};

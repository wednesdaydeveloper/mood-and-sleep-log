// アプリ全体のエラー型。設計書 §09 に定義。

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('VALIDATION', message, context);
    this.name = 'ValidationError';
  }
}

export class DataError extends AppError {
  constructor(message: string, cause?: unknown, context?: Record<string, unknown>) {
    super('DATA', message, context, cause);
    this.name = 'DataError';
  }
}

/** 任意の値から安全にメッセージ文字列を抽出。 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

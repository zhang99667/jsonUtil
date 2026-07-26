import { readObjectPropertySafely } from './storage';

const readErrorMessage = (error: unknown): string | null => {
  const message = readObjectPropertySafely(error, 'message');
  return typeof message === 'string' ? message : null;
};

export const isAbortError = (error: unknown): boolean => {
  // 跨窗口错误无法可靠使用 instanceof，只读取标准错误名称。
  return readObjectPropertySafely(error, 'name') === 'AbortError';
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const errorMessage = readErrorMessage(error);
  if (errorMessage !== null) {
    const message = errorMessage.trim();
    if (message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
};

export const formatUnknownError = (error: unknown): string => {
  const errorMessage = readErrorMessage(error);
  if (errorMessage !== null) return errorMessage;

  try {
    return String(error);
  } catch {
    return '未知错误';
  }
};

export const getDetailedErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const detail = getErrorMessage(error, '');
  if (!detail) {
    return fallbackMessage;
  }

  if (detail === fallbackMessage || detail.startsWith(`${fallbackMessage}：`)) {
    return detail;
  }

  return `${fallbackMessage}：${detail}`;
};

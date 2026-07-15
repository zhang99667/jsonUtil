export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const parseJsonWithFallback = <T>(
  source: string | null,
  fallback: T,
  isValid?: (value: unknown) => value is T
): T => {
  if (!source) return fallback;

  try {
    const parsed: unknown = JSON.parse(source);
    if (isValid && !isValid(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
};

export interface SafeStorageReadResult {
  value: string | null;
  ok: boolean;
}

const resolveStorage = (storage?: Storage): Storage => storage ?? globalThis.localStorage;

export const safeReadStorageItem = (
  key: string,
  storage?: Storage
): SafeStorageReadResult => {
  try {
    return { value: resolveStorage(storage).getItem(key), ok: true };
  } catch (error) {
    console.warn(`读取本地存储失败: ${key}`, error);
    return { value: null, ok: false };
  }
};

export const safeGetStorageItem = (
  key: string,
  storage?: Storage
): string | null => {
  return safeReadStorageItem(key, storage).value;
};

export const safeSetStorageItem = (
  key: string,
  value: string,
  storage?: Storage
): boolean => {
  try {
    resolveStorage(storage).setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`写入本地存储失败: ${key}`, error);
    return false;
  }
};

export const safeRemoveStorageItem = (
  key: string,
  storage?: Storage
): boolean => {
  try {
    resolveStorage(storage).removeItem(key);
    return true;
  } catch (error) {
    console.warn(`删除本地存储失败: ${key}`, error);
    return false;
  }
};

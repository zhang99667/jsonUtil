export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const parseJsonWithFallback = <T>(
  stored: string | null,
  fallback: T,
  isValid?: (value: unknown) => value is T
): T => {
  if (!stored) return fallback;

  try {
    const parsed: unknown = JSON.parse(stored);
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

export const safeReadStorageItem = (
  key: string,
  storage: Storage = localStorage
): SafeStorageReadResult => {
  try {
    return { value: storage.getItem(key), ok: true };
  } catch (error) {
    console.warn(`读取本地存储失败: ${key}`, error);
    return { value: null, ok: false };
  }
};

export const safeGetStorageItem = (
  key: string,
  storage: Storage = localStorage
): string | null => {
  return safeReadStorageItem(key, storage).value;
};

export const safeSetStorageItem = (
  key: string,
  value: string,
  storage: Storage = localStorage
): boolean => {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`写入本地存储失败: ${key}`, error);
    return false;
  }
};

export const safeRemoveStorageItem = (
  key: string,
  storage: Storage = localStorage
): boolean => {
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`删除本地存储失败: ${key}`, error);
    return false;
  }
};

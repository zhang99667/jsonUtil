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

export interface UnwrappedLogFieldValue {
  value: string;
  quote?: '"' | "'";
}

export const unwrapLogFieldValue = (value: string): UnwrappedLogFieldValue => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    const inner = trimmed.slice(1, -1);
    if (quote === '"') {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          return { value: parsed, quote };
        }
      } catch {
        return { value: inner, quote };
      }
    }

    return { value: inner.replace(/\\'/g, "'"), quote };
  }

  return { value: trimmed };
};

export const unwrapLogFieldKey = (
  rawKey: string,
  decodeKey: (rawKey: string) => string
): string | null => {
  const trimmed = rawKey.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    if (quote === '"') {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        return typeof parsed === 'string' ? parsed : null;
      } catch {
        return trimmed.slice(1, -1);
      }
    }

    return trimmed.slice(1, -1).replace(/\\'/g, "'");
  }

  return decodeKey(trimmed);
};

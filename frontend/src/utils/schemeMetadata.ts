export interface Base64MetaEntry {
  key: string;
  displayValue: string;
}

export interface Base64MetaInfo {
  prefix: string;
  suffix: string;
  suffixDecodePrefix: string;
  suffixLength: number;
  suffixDecodedCount: number;
  suffixDecodedEntries: Base64MetaEntry[];
}

const DEFAULT_DISPLAY_LIMIT = 64;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

export const formatBase64MetaDisplayValue = (
  value: unknown,
  maxLength = DEFAULT_DISPLAY_LIMIT
): string => {
  let text: string;

  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    text = String(value);
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const extractBase64MetaInfo = (
  decoded: string,
  isJson: boolean
): Base64MetaInfo | null => {
  if (!isJson) return null;

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!isPlainObject(parsed)) return null;

    const prefix = typeof parsed._base64_prefix === 'string' ? parsed._base64_prefix : '';
    const suffix = typeof parsed._base64_suffix === 'string' ? parsed._base64_suffix : '';
    const suffixDecodePrefix = typeof parsed._base64_suffix_decode_prefix === 'string'
      ? parsed._base64_suffix_decode_prefix
      : '';
    const suffixDecodedObject = isPlainObject(parsed._base64_suffix_decoded)
      ? parsed._base64_suffix_decoded
      : null;
    const suffixDecodedEntries = suffixDecodedObject
      ? Object.entries(suffixDecodedObject).map(([key, value]) => ({
        key,
        displayValue: formatBase64MetaDisplayValue(value),
      }))
      : [];

    if (!prefix && !suffix && !suffixDecodePrefix && suffixDecodedEntries.length === 0) {
      return null;
    }

    return {
      prefix,
      suffix,
      suffixDecodePrefix,
      suffixLength: suffix.length,
      suffixDecodedCount: suffixDecodedEntries.length,
      suffixDecodedEntries,
    };
  } catch {
    return null;
  }
};

export type LooksLikeStructuredPayload = (value: string) => boolean;

export const normalizeJsonEscapedSlashes = (source: string): string => (
  source.replace(/\\\//g, '/')
);

export const normalizeJsonUnicodeAsciiEscapes = (source: string): string => (
  source.replace(/\\u00([2-7][0-9a-f])/gi, (match, hex: string) => {
    const code = Number.parseInt(hex, 16);
    return code >= 0x20 && code <= 0x7e ? String.fromCharCode(code) : match;
  })
);

export const tryNormalizeJsonEscapedSlashPayload = (
  value: string,
  looksLikeStructuredPayload: LooksLikeStructuredPayload
): string | null => {
  const trimmed = value.trim();
  const normalized = normalizeJsonEscapedSlashes(trimmed);
  if (normalized === trimmed) return null;

  return looksLikeStructuredPayload(normalized) ? normalized : null;
};

export const tryNormalizeJsonUnicodeAsciiPayload = (
  value: string,
  looksLikeStructuredPayload: LooksLikeStructuredPayload
): string | null => {
  const trimmed = value.trim();
  const normalized = normalizeJsonUnicodeAsciiEscapes(trimmed);
  if (normalized === trimmed) return null;

  return looksLikeStructuredPayload(normalized) ? normalized : null;
};

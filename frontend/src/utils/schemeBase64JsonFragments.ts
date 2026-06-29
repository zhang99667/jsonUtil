import type { SchemeBase64DecodeOptions } from './schemeBase64Types';

export const normalizeBase64JsonFragment = (
  decoded: string,
  options: SchemeBase64DecodeOptions
): string | null => {
  const { isJsonString } = options;
  if (!isJsonString) return null;

  const trimmed = decoded.trim();
  const candidates = [
    trimmed,
    trimmed.startsWith('"') ? `{${trimmed}` : '',
    /^[A-Za-z_$][\w$]*":/.test(trimmed) ? `{"${trimmed}` : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!isJsonString(candidate)) continue;
    return candidate;
  }

  return null;
};

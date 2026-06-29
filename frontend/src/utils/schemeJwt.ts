import {
  decodeNormalizedBase64,
  normalizeBase64Input,
} from './schemeBase64Codec';

export interface SchemeJwtDecodeResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const decodeJwtJsonPart = (part: string): Record<string, unknown> | null => {
  const normalized = normalizeBase64Input(part);
  if (!normalized) return null;

  const decoded = decodeNormalizedBase64(normalized);
  if (decoded === null) return null;

  const parsed: unknown = JSON.parse(decoded);
  return isRecord(parsed) ? parsed : null;
};

export const decodeJwt = (token: string): SchemeJwtDecodeResult | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = decodeJwtJsonPart(parts[0]);
    const payload = decodeJwtJsonPart(parts[1]);
    if (!header || !payload) return null;

    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
};

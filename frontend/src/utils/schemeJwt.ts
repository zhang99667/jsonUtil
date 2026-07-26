import {
  decodeNormalizedBase64,
  normalizeBase64Input,
} from './schemeBase64Codec';
import { parseJsonValue } from './jsonValueGuards';
import { isRecord } from './storage';

export interface SchemeJwtDecodeResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

const decodeJwtJsonPart = (part: string): Record<string, unknown> | null => {
  const normalized = normalizeBase64Input(part);
  if (!normalized) return null;

  const decoded = decodeNormalizedBase64(normalized);
  if (decoded === null) return null;

  const parsed = parseJsonValue(decoded);
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

export const isJwt = (value: string): boolean => {
  const trimmed = value.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  if (!parts.every(part => part && /^[A-Za-z0-9_-]+$/.test(part))) return false;

  return decodeJwt(trimmed) !== null;
};

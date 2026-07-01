import type { JsonValue } from '../types';
import {
  isStructuredCmdField,
  looksLikeRawCmdSource,
  normalizeRawSourceString,
  QUERY_PAIR_RE,
  safeDecodeURIComponent,
  URL_LIKE_RE,
} from './cmdStructureRawSourceGuards';
import {
  toCmdStructureJsonValue,
  tryParseRawCmdJsonString,
} from './cmdStructureRawJsonValue';
import { parseCmdStructureRawQueryParams } from './cmdStructureRawQueryParams';

interface JsonObject {
  [key: string]: JsonValue;
}

export interface NormalizedCmdStructure {
  cmdSchema?: string;
  cmdParams: JsonValue;
  source?: string;
}

const RAW_CMD_DECODE_MAX_DEPTH = 10;

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const getUrlCmdSchema = (source: string): string | undefined => {
  if (!URL_LIKE_RE.test(source)) return undefined;

  try {
    const url = new URL(source);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return source.split(/[?#]/)[0] || undefined;
  }
};

const parseFastCmdValue = (value: string, key: string, depth: number): JsonValue => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return value;

  const normalized = normalizeRawSourceString(value);
  const parsedJson = tryParseRawCmdJsonString(normalized);
  if (parsedJson !== undefined) {
    return parseFastStructuredValue(parsedJson, key, depth + 1);
  }

  const decoded = URL_LIKE_RE.test(normalized) ? normalized : safeDecodeURIComponent(normalized);
  if (decoded !== normalized) {
    const decodedJson = tryParseRawCmdJsonString(decoded);
    if (decodedJson !== undefined) {
      return parseFastStructuredValue(decodedJson, key, depth + 1);
    }

    if (looksLikeRawCmdSource(decoded) && isStructuredCmdField(key)) {
      const decodedStructure = parseFastCmdSource(decoded, depth + 1);
      if (decodedStructure) return toCmdStructureJsonValue(decodedStructure);
    }
  }

  if (looksLikeRawCmdSource(normalized) && isStructuredCmdField(key)) {
    const structure = parseFastCmdSource(normalized, depth + 1);
    if (structure) return toCmdStructureJsonValue(structure);
  }

  return value;
};

const parseFastStructuredValue = (value: JsonValue, key: string, depth: number): JsonValue => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return value;

  if (typeof value === 'string') return parseFastCmdValue(value, key, depth);

  if (Array.isArray(value)) {
    return value.map(item => parseFastStructuredValue(item, key, depth + 1));
  }

  if (!isRecord(value)) return value;

  const result: JsonObject = {};
  Object.entries(value).forEach(([childKey, item]) => {
    result[childKey] = parseFastStructuredValue(item, childKey, depth + 1);
  });
  return result;
};

const parseFastCmdSource = (source: string, depth = 0): NormalizedCmdStructure | null => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return null;

  const normalized = normalizeRawSourceString(source);
  const decoded = URL_LIKE_RE.test(normalized) ? normalized : safeDecodeURIComponent(normalized);
  const schema = getUrlCmdSchema(decoded);
  if (!schema) {
    if (QUERY_PAIR_RE.test(decoded)) {
      return {
        cmdParams: parseCmdStructureRawQueryParams(decoded, depth + 1, parseFastCmdValue),
        source: decoded,
      };
    }
    return null;
  }

  let query = '';
  try {
    const url = new URL(decoded);
    query = url.search;
  } catch {
    const queryIndex = decoded.indexOf('?');
    const hashIndex = decoded.indexOf('#');
    const endIndex = hashIndex >= 0 ? hashIndex : decoded.length;
    query = queryIndex >= 0 ? decoded.slice(queryIndex + 1, endIndex) : '';
  }

  return {
    cmdSchema: schema,
    cmdParams: query ? parseCmdStructureRawQueryParams(query, depth + 1, parseFastCmdValue) : {},
    source: decoded,
  };
};

export const decodeRawCmdCandidate = (source: string): NormalizedCmdStructure | null => {
  return parseFastCmdSource(source);
};

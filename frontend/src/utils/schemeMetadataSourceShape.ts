import type { JsonValue } from '../types';
import { findSchemePrefixedQueryString } from './schemePrefixedQuery';
import { decodeQueryComponentOrOriginal as decodeQueryComponent } from './schemeQueryDecoding';
import {
  iterateDecodedQueryPairs,
  normalizeQueryString,
  QUERY_PAIR_START_RE,
  stripQueryPrefix,
} from './schemeQuerySyntax';
import {
  matchLogFieldParamString,
  unwrapLogFieldKey,
} from './schemeLogFieldSyntax';
import { unwrapLogFieldValue } from './schemeLogFieldQuotes';
import { tryParseJsonStringLiteral } from './schemeJsonPayloads';
import { tryParseJsonValue } from './jsonValueGuards';
import { normalizeSchemeMetadataSourceString } from './schemeCommandSource';
import type { SchemeMetadataSourceContext, SchemeMetadataSourceShape } from './schemeMetadataSourceTypes';
import { base64Decode, detectSchemeType, parseUrl } from './schemeUtils';
import { isRecord } from './storage';

export {
  getSchemeCommandSchemaFromSource,
  getSchemeCommandSchemaFromUrl,
  getSchemeCommandSourceInfo,
  normalizeSchemeMetadataSourceString,
} from './schemeCommandSource';
export type {
  SchemeCommandSourceInfo,
  SchemeMetadataSourceContext,
  SchemeMetadataSourceShape,
} from './schemeMetadataSourceTypes';

const mergeSourceValue = (
  existing: SchemeMetadataSourceShape | undefined,
  value: SchemeMetadataSourceShape
): SchemeMetadataSourceShape => {
  if (existing === undefined) return value;
  if (Array.isArray(existing)) return [...existing, value];
  return [existing, value];
};

const normalizeSourceShape = (value: unknown): SchemeMetadataSourceShape => {
  let result: SchemeMetadataSourceShape = null;
  const tasks: Array<[unknown, (normalized: SchemeMetadataSourceShape) => void]> = [[value, normalized => { result = normalized; }]];
  while (tasks.length > 0) {
    const [current, writeResult] = tasks.pop()!;
    if (typeof current === 'string') { writeResult(parseSourceValue(current)); continue; }
    if (Array.isArray(current)) {
      const normalizedItems: SchemeMetadataSourceShape[] = new Array(current.length);
      writeResult(normalizedItems);
      for (let index = current.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(current, index)) continue;
        tasks.push([current[index], normalized => { normalizedItems[index] = normalized; }]);
      }
      continue;
    }
    if (isRecord(current)) {
      const normalizedObject: { [key: string]: SchemeMetadataSourceShape } = {};
      writeResult(normalizedObject);
      for (const [key, item] of Object.entries(current).reverse()) {
        tasks.push([item, normalized => {
          Object.defineProperty(normalizedObject, key, { value: normalized, enumerable: true, configurable: true, writable: true });
        }]);
      }
      continue;
    }
    if (typeof current === 'number' || typeof current === 'boolean') { writeResult(current); continue; }
    writeResult(current === null ? null : String(current));
  }
  return result;
};

const tryParseRawJsonSource = (value: string): JsonValue | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  return tryParseJsonValue(trimmed) ?? null;
};

const tryParseJsonSource = (value: string): SchemeMetadataSourceShape | null => {
  const parsed = tryParseRawJsonSource(value);
  return parsed === null ? null : normalizeSourceShape(parsed);
};

const parseSourceValue = (value: string): SchemeMetadataSourceShape => {
  const jsonStringPayload = tryParseJsonStringLiteral(value);
  if (jsonStringPayload !== null) return parseSourceValue(jsonStringPayload);

  const directJsonValue = tryParseJsonSource(value);
  if (directJsonValue !== null) return directJsonValue;

  const normalized = normalizeSchemeMetadataSourceString(value);
  if (detectSchemeType(normalized) === 'base64') {
    const decoded = base64Decode(normalized);
    if (decoded && decoded !== normalized) return parseSourceValue(decoded);
  }

  return tryParseJsonSource(normalized) ?? normalized;
};

const getQuerySourceString = (source: string): string | null => {
  const normalized = normalizeQueryString(stripQueryPrefix(source));
  if (QUERY_PAIR_START_RE.test(normalized)) return normalized;

  const prefixedQuery = findSchemePrefixedQueryString(normalized);
  if (!prefixedQuery) return null;

  const queryString = normalizeQueryString(stripQueryPrefix(prefixedQuery.queryString));
  return QUERY_PAIR_START_RE.test(queryString) ? queryString : null;
};

const parseLogFieldSourceShape = (source: string): SchemeMetadataSourceShape | null => {
  const trimmed = source.trim();
  if (/[\r\n]/.test(trimmed)) return null;

  const match = matchLogFieldParamString(trimmed);
  if (!match) return null;

  const key = unwrapLogFieldKey(match.rawKey, decodeQueryComponent);
  if (!key) return null;

  const rawValue = match.rawValue.trim();
  const valueWithoutComma = rawValue.endsWith(',')
    ? rawValue.slice(0, -1).trim()
    : rawValue;
  return {
    [key]: parseSourceValue(unwrapLogFieldValue(valueWithoutComma).value),
  };
};

const parseQuerySourceShape = (source: string): SchemeMetadataSourceShape | null => {
  const queryString = getQuerySourceString(source);
  if (!queryString) return parseLogFieldSourceShape(source);

  const result: { [key: string]: SchemeMetadataSourceShape } = {};
  for (const pair of iterateDecodedQueryPairs(
    queryString,
    decodeQueryComponent,
    decodeQueryComponent
  )) {
    const value = parseSourceValue(pair.value);
    result[pair.key] = mergeSourceValue(result[pair.key], value);
  }

  return Object.keys(result).length > 0 ? result : null;
};

export const parseSchemeMetadataSourceContext = (
  source?: string,
): SchemeMetadataSourceContext => {
  const trimmed = source?.trim();
  if (!trimmed) {
    return {
      sourceShape: null,
      rawJsonSource: null,
    };
  }

  // 原始 JSON 可能包含 URL 编码内容，必须先解析并复用语法树，避免类型探测重复解析。
  const rawJsonSource = tryParseRawJsonSource(trimmed);
  if (rawJsonSource !== null) {
    return {
      sourceShape: normalizeSourceShape(rawJsonSource),
      rawJsonSource,
    };
  }

  const normalized = normalizeSchemeMetadataSourceString(trimmed);
  const sourceType = detectSchemeType(normalized);
  if (sourceType === 'url') {
    const schemeInfo = parseUrl(normalized);
    const queryShape = schemeInfo?.params ? normalizeSourceShape(schemeInfo.params) : null;
    const hashShape = schemeInfo?.hashParams ? normalizeSourceShape(schemeInfo.hashParams) : null;

    if (queryShape && hashShape && isRecord(queryShape)) {
      return {
        sourceShape: {
          ...queryShape,
          _hash: hashShape,
        },
        rawJsonSource: null,
      };
    }

    return {
      sourceShape: queryShape || hashShape,
      rawJsonSource: null,
    };
  }

  if (sourceType === 'query-string') {
    return {
      sourceShape: parseQuerySourceShape(normalized),
      rawJsonSource: null,
    };
  }

  return {
    sourceShape: null,
    rawJsonSource: null,
  };
};

export const parseSchemeMetadataSourceShape = (
  source?: string
): SchemeMetadataSourceShape | null => {
  return parseSchemeMetadataSourceContext(source).sourceShape;
};

export const getSchemeMetadataSourceObjectChild = (
  sourceShape: SchemeMetadataSourceShape | null,
  key: string
): SchemeMetadataSourceShape | undefined => (
  isRecord(sourceShape) ? sourceShape[key] : undefined
);

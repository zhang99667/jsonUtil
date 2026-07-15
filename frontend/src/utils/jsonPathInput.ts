import { decodeJsonPointerSegment } from './jsonPointer';
import { isJsonPathIdentifier } from './jsonPathSegments';
import { isRecord } from './storage';

export interface JsonPathQueryNormalization {
  query: string;
  isFieldNameShortcut: boolean;
}

const FIELD_NAME_SHORTCUT_RE = /^[\p{L}\p{N}_$-][\p{L}\p{N}_$.-]*$/u;

const isJsonPointerArrayIndex = (segment: string): boolean => (
  /^(0|[1-9]\d*)$/.test(segment)
);

const getJsonPointerSegments = (pointer: string): string[] => (
  pointer
    .split('/')
    .slice(1)
    .map(decodeJsonPointerSegment)
);

export const formatJsonPathRecursiveFieldQuery = (fieldName: string): string => (
  isJsonPathIdentifier(fieldName)
    ? `$..${fieldName}`
    : /['"]/.test(fieldName)
      ? `$..[?(@property == ${JSON.stringify(fieldName)})]`
    : `$..[${JSON.stringify(fieldName)}]`
);

export const getJsonPointerLastFieldName = (pointer: string, rootValue?: unknown): string | null => {
  if (!pointer) return null;

  const segments = getJsonPointerSegments(pointer).filter(Boolean);

  if (rootValue !== undefined) {
    let current: unknown = rootValue;
    let lastFieldName: string | null = null;

    for (const segment of segments) {
      if (Array.isArray(current)) {
        current = isJsonPointerArrayIndex(segment) ? current[Number(segment)] : undefined;
        continue;
      }

      if (isRecord(current)) {
        lastFieldName = segment;
        current = current[segment];
        continue;
      }

      if (!isJsonPointerArrayIndex(segment)) {
        lastFieldName = segment;
      }
      current = undefined;
    }

    return lastFieldName;
  }

  for (let index = segments.length - 1; index >= 0; index--) {
    const segment = segments[index];
    if (!isJsonPointerArrayIndex(segment)) {
      return segment;
    }
  }

  return null;
};

export const normalizeJsonPathQueryInput = (input: string): JsonPathQueryNormalization => {
  const query = input.trim();
  if (!query) return { query: '', isFieldNameShortcut: false };
  if (query.startsWith('$') || query.startsWith('@') || query.startsWith('[')) {
    return { query, isFieldNameShortcut: false };
  }
  if (!FIELD_NAME_SHORTCUT_RE.test(query)) {
    return { query, isFieldNameShortcut: false };
  }

  return {
    query: formatJsonPathRecursiveFieldQuery(query),
    isFieldNameShortcut: true,
  };
};

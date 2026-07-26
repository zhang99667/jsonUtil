import type { JsonObject, JsonValue, TransformContext } from '../types';
import { isJsonObject } from './jsonValueGuards';
import { decodeJsonPointerSegment } from './jsonPointer';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { normalizeJsonEscapedSlashes } from './schemeEscapedPayloads';
import {
  createSchemeUrlContext,
  type SchemeUrlContext,
} from './schemeUrlShapes';
import {
  getUrlResourceSchemaFromContext,
  getUrlResourceSchemaFromUrl,
} from './schemeUrlResourceSchema';

export type SchemeDisplayHeaderKind = 'url' | 'scheme';

export interface SchemeDisplayHeaderMarker {
  path: string;
  kind: SchemeDisplayHeaderKind;
  header: string;
  source: string;
}

export interface SchemeDisplayValue {
  headerKey: string;
  value: JsonObject;
}

const HEADER_KEY_CONFIG = {
  url: {
    primary: '__url__',
    fallback: '__url_header__',
    numbered: (suffix: number) => `__url_header_${suffix}__`,
  },
  scheme: {
    primary: '__scheme__',
    fallback: '__scheme_header__',
    numbered: (suffix: number) => `__scheme_header_${suffix}__`,
  },
} as const;

const DISPLAY_HEADER_KEY_PATTERN = /^__(url|scheme)(?:_header(?:_(?:[2-9]|[1-9]\d+))?)?__$/;

export interface SchemeEncodingValue {
  source: string;
  value: JsonValue;
}

const normalizeSchemeHeader = (value: string): string => (
  normalizeJsonEscapedSlashes(value.trim())
);

const getSchemeDisplayHeaderKind = (source: string): SchemeDisplayHeaderKind | null => {
  const protocol = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(
    normalizeSchemeHeader(source),
  )?.[1].toLowerCase();
  if (!protocol) return null;
  return protocol === 'http' || protocol === 'https' ? 'url' : 'scheme';
};

const getSchemeDisplayHeaderKindFromKey = (
  value: unknown,
): SchemeDisplayHeaderKind | null => {
  if (typeof value !== 'string') return null;
  const match = DISPLAY_HEADER_KEY_PATTERN.exec(value);
  return match?.[1] === 'url' || match?.[1] === 'scheme' ? match[1] : null;
};

export const isSchemeDisplayHeaderKey = (value: unknown): value is string => (
  getSchemeDisplayHeaderKindFromKey(value) !== null
);

export const getSchemeDisplayHeaderKey = (
  value: JsonObject,
  reservedKeys: ReadonlySet<string> | undefined,
  source?: string,
): string => {
  const kind = source ? getSchemeDisplayHeaderKind(source) : 'scheme';
  const config = HEADER_KEY_CONFIG[kind || 'scheme'];
  let suffix = 0;
  reservedKeys?.forEach(key => {
    if (key === config.primary) {
      suffix = Math.max(suffix, 1);
      return;
    }
    if (key === config.fallback) {
      suffix = Math.max(suffix, 2);
      return;
    }
    const match = new RegExp(`^__${kind || 'scheme'}_header_([2-9]|[1-9]\\d+)__$`).exec(key);
    if (match) suffix = Math.max(suffix, Number(match[1]) + 1);
  });
  while (true) {
    const key = suffix === 0
      ? config.primary
      : suffix === 1
        ? config.fallback
        : config.numbered(suffix);
    if (!Object.hasOwn(value, key) && !reservedKeys?.has(key)) return key;
    suffix += 1;
  }
};

export const getSchemeDisplayHeader = (
  source: string,
  parsedContext?: SchemeUrlContext,
): string | null => {
  try {
    const context = parsedContext ?? createSchemeUrlContext(source);
    return getUrlResourceSchemaFromContext(context) || null;
  } catch {
    return null;
  }
};

export const addSchemeDisplayHeader = (
  value: JsonValue,
  source: string,
): SchemeDisplayValue | null => {
  if (!isJsonObject(value)) return null;

  const header = getSchemeDisplayHeader(source);
  const kind = getSchemeDisplayHeaderKind(source);
  if (!header || !kind) return null;

  const config = HEADER_KEY_CONFIG[kind];
  const headerKey = [config.primary, config.fallback].find(
    key => !Object.hasOwn(value, key),
  );
  if (!headerKey) return null;

  return {
    headerKey,
    value: {
      [headerKey]: header,
      ...value,
    },
  };
};

const getEditedSchemeSource = (
  source: string,
  editedHeader: unknown,
): string => {
  if (typeof editedHeader !== 'string') return source;

  const normalizedHeader = normalizeSchemeHeader(editedHeader);
  if (getUrlResourceSchemaFromUrl(normalizedHeader) !== normalizedHeader) return source;

  const suffixIndex = source.search(/[?#]/);
  return suffixIndex < 0
    ? normalizedHeader
    : `${normalizedHeader}${source.slice(suffixIndex)}`;
};

export const removeSchemeDisplayHeader = (
  value: JsonValue,
  source: string,
  headerKey?: string,
): SchemeEncodingValue => {
  if (!headerKey || !isJsonObject(value) || !Object.hasOwn(value, headerKey)) {
    return { source, value };
  }

  const editedHeader = value[headerKey];
  const params = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== headerKey)
  ) as JsonObject;

  return {
    source: getEditedSchemeSource(source, editedHeader),
    value: params,
  };
};

const appendJsonPointerToJsonPath = (path: string, pointer: string): string => {
  if (!pointer) return path;
  return pointer.slice(1).split('/').map(decodeJsonPointerSegment).reduce(
    (currentPath, segment) => /^\d+$/.test(segment)
      ? appendJsonPathIndex(currentPath, Number(segment))
      : appendJsonPathKey(currentPath, segment),
    path,
  );
};

export const collectSchemeDisplayHeaderMarkers = (
  context: TransformContext | null | undefined,
): SchemeDisplayHeaderMarker[] => {
  if (!context) return [];

  const markers = new Map<string, SchemeDisplayHeaderMarker>();
  context.records.forEach(record => {
    record.steps.forEach(step => {
      if (step.type !== 'scheme_decode') return;

      step.schemeDisplayHeaders?.forEach(header => {
        const kind = getSchemeDisplayHeaderKindFromKey(header.headerKey);
        if (!kind) return;
        const objectPath = appendJsonPointerToJsonPath(record.path, header.path);
        markers.set(objectPath, {
          path: objectPath,
          kind,
          header: header.header,
          source: header.source,
        });
      });

      if (step.schemeDisplayHeaders?.length || !step.schemeHeaderDisplayKey) return;
      const kind = getSchemeDisplayHeaderKindFromKey(step.schemeHeaderDisplayKey);
      if (!kind || !step.originalScheme) return;
      const header = getSchemeDisplayHeader(step.originalScheme);
      if (!header) return;
      markers.set(record.path, {
        path: record.path,
        kind,
        header,
        source: step.originalScheme,
      });
    });
  });

  return [...markers.values()];
};

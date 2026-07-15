import type { JsonObject, JsonValue } from '../types';
import { isJsonObject } from './jsonValueGuards';
import { getUrlResourceSchemaFromUrl } from './schemeMetadata';

const SCHEME_HEADER_KEYS = ['__scheme__', '__scheme_header__'] as const;

export interface SchemeDisplayValue {
  headerKey: string;
  value: JsonObject;
}

export interface SchemeEncodingValue {
  source: string;
  value: JsonValue;
}

const normalizeSchemeHeader = (value: string): string => (
  value.trim().replace(/\\\//g, '/')
);

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

export const addSchemeDisplayHeader = (
  value: JsonValue,
  source: string,
): SchemeDisplayValue | null => {
  if (!isJsonObject(value)) return null;

  const header = getUrlResourceSchemaFromUrl(source);
  const headerKey = SCHEME_HEADER_KEYS.find(key => !Object.hasOwn(value, key));
  if (!header || !headerKey) return null;

  return {
    headerKey,
    value: {
      [headerKey]: header,
      ...value,
    },
  };
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

import { isKnownDecodableParamName } from './structuredParamNames';
import {
  matchLogFieldParamString,
  normalizeLogFieldDelimiter,
  unwrapDecodableLogFieldValue,
  unwrapLogFieldKey,
} from './schemeLogFieldSyntax';
import type {
  SchemeLogFieldParam,
  SchemeLogFieldParseOptions,
} from './schemeLogFieldTypes';

export type {
  SchemeLogFieldParam,
  SchemeLogFieldParseOptions,
} from './schemeLogFieldTypes';

export const parseSchemeLogFieldParamString = (
  source: string,
  options: SchemeLogFieldParseOptions
): SchemeLogFieldParam | null => {
  const trimmed = source.trim();
  if (/[\r\n]/.test(trimmed)) return null;

  const match = matchLogFieldParamString(trimmed);
  if (!match) return null;

  const rawKey = match.rawKey;
  const key = unwrapLogFieldKey(rawKey, options.decodeKey);
  if (!key || !isKnownDecodableParamName(key)) return null;

  const unwrappedValue = unwrapDecodableLogFieldValue(match.rawValue, options.isDecodableValue);
  if (!unwrappedValue) return null;

  return {
    prefix: match.prefix,
    rawKey,
    key,
    delimiter: normalizeLogFieldDelimiter(match.separator),
    value: unwrappedValue.value,
    quote: unwrappedValue.quote,
    trailingComma: unwrappedValue.trailingComma,
  };
};

export const isDecodableSchemeLogFieldParamString = (
  source: string,
  options: SchemeLogFieldParseOptions
): boolean => (
  parseSchemeLogFieldParamString(source, options) !== null
);

export const wrapSchemeLogFieldValue = (value: string, quote?: '"' | "'"): string => {
  if (quote === '"') return JSON.stringify(value);
  if (quote === "'") return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return value;
};

export const formatSchemeLogFieldSeparator = (delimiter: SchemeLogFieldParam['delimiter']): string => (
  delimiter === '=' || delimiter === '=>' || delimiter === '->' ? ` ${delimiter} ` : `${delimiter} `
);

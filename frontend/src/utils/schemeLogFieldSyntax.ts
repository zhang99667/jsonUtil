import { QUERY_KEY_PATTERN } from './schemeQuerySyntax';
import type { SchemeLogFieldParam } from './schemeLogFieldTypes';
import {
  unwrapLogFieldKey,
  unwrapLogFieldValue,
} from './schemeLogFieldQuotes';

export interface SchemeLogFieldMatch {
  prefix?: string;
  rawKey: string;
  separator: string;
  rawValue: string;
}

const LOG_FIELD_KEY_PATTERN = `(?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|${QUERY_KEY_PATTERN})`;
const LOG_FIELD_SEPARATOR_PATTERN = '(?:\\s*(?:=>|->)\\s*|\\s*[:：]\\s*|\\s+=\\s*|=\\s+)';
const LOG_FIELD_RE = new RegExp(`^\\s*(${LOG_FIELD_KEY_PATTERN})(${LOG_FIELD_SEPARATOR_PATTERN})(.+?)\\s*$`);
const LOG_FIELD_WITH_PREFIX_RE = new RegExp(`^(.*?[\\s[{,(|])(${LOG_FIELD_KEY_PATTERN})(${LOG_FIELD_SEPARATOR_PATTERN})(.+?)\\s*$`);

export const matchLogFieldParamString = (source: string): SchemeLogFieldMatch | null => {
  const directMatch = source.match(LOG_FIELD_RE);
  if (directMatch) {
    return {
      rawKey: directMatch[1],
      separator: directMatch[2],
      rawValue: directMatch[3],
    };
  }

  const prefixedMatch = source.match(LOG_FIELD_WITH_PREFIX_RE);
  if (!prefixedMatch) return null;

  return {
    prefix: prefixedMatch[1],
    rawKey: prefixedMatch[2],
    separator: prefixedMatch[3],
    rawValue: prefixedMatch[4],
  };
};

export { unwrapLogFieldKey } from './schemeLogFieldQuotes';

export const unwrapDecodableLogFieldValue = (
  rawValue: string,
  isDecodableValue: (value: string) => boolean
): { value: string; quote?: '"' | "'"; trailingComma?: boolean } | null => {
  const trimmed = rawValue.trim();
  if (trimmed.endsWith(',')) {
    const withoutCommaSource = trimmed.slice(0, -1).trim();
    const quote = withoutCommaSource[0];
    const shouldPreferTrailingComma = (quote === '"' || quote === "'") && withoutCommaSource.endsWith(quote);
    const withoutTrailingComma = unwrapLogFieldValue(withoutCommaSource);
    if (shouldPreferTrailingComma && isDecodableValue(withoutTrailingComma.value)) {
      return { ...withoutTrailingComma, trailingComma: true };
    }
  }

  const unwrappedValue = unwrapLogFieldValue(rawValue);
  if (isDecodableValue(unwrappedValue.value)) return unwrappedValue;

  if (!trimmed.endsWith(',')) return null;

  const withoutTrailingComma = unwrapLogFieldValue(trimmed.slice(0, -1));
  return isDecodableValue(withoutTrailingComma.value)
    ? { ...withoutTrailingComma, trailingComma: true }
    : null;
};

export const normalizeLogFieldDelimiter = (separator: string): SchemeLogFieldParam['delimiter'] => {
  if (separator.includes('=>')) return '=>';
  if (separator.includes('->')) return '->';
  if (separator.includes('=')) return '=';
  return separator.includes('：') ? '：' : ':';
};

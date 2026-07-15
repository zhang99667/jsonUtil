import { isJsonValue } from './jsonValueGuards';
import { getIntegerValue } from './jsonSchemaExampleNumbers';

export type JsonSchemaNode = boolean | Record<string, unknown>;

const COMMON_STRING_PATTERN_CANDIDATES = [
  'string',
  'key',
  'value',
  'abc',
  'ABC',
  'A1',
  'id-1',
  'ORD-1',
  '2026-01-01',
  'user@example.com',
];
const COMMON_SHORT_STRING_CANDIDATES = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
];
const UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export const cloneJsonValue = (value: unknown): unknown => (
  isJsonValue(value) ? structuredClone(value) : undefined
);

const stripRegexAnchors = (pattern: string): string => (
  pattern.replace(/^\^/, '').replace(/\$$/, '')
);

const repeatToken = (token: string, countText?: string): string => (
  token.repeat(Math.max(Number(countText) || 1, 1))
);

const inferTextFromPattern = (pattern: string): string => {
  let text = stripRegexAnchors(pattern);
  text = text.replace(/\(([^|()]+)\|[^()]+\)/g, '$1');
  text = text.replace(/\\d\{(\d+)\}/g, (_match, count: string) => repeatToken('1', count));
  text = text.replace(/\[0-9]\{(\d+)\}/g, (_match, count: string) => repeatToken('1', count));
  text = text.replace(/\[A-Z]\{(\d+)\}/g, (_match, count: string) => repeatToken('A', count));
  text = text.replace(/\[a-z]\{(\d+)\}/g, (_match, count: string) => repeatToken('a', count));
  text = text.replace(/\[A-Za-z]\{(\d+)\}/g, (_match, count: string) => repeatToken('a', count));
  text = text.replace(/\[A-Za-z0-9]\{(\d+)\}/g, (_match, count: string) => repeatToken('a', count));
  text = text.replace(/\\w\{(\d+)\}/g, (_match, count: string) => repeatToken('a', count));
  text = text.replace(/\[a-z]\+/gi, 'key');
  text = text.replace(/\[a-z_]\+/gi, 'key');
  text = text.replace(/\[a-z-]\+/gi, 'key');
  text = text.replace(/\[A-Z]\+/g, 'KEY');
  text = text.replace(/\[0-9]\+/g, '1');
  text = text.replace(/\[A-Za-z]\+/g, 'key');
  text = text.replace(/\[A-Za-z0-9]\+/g, 'key1');
  text = text.replace(/\\d\+/g, '1');
  text = text.replace(/\\w\+/g, 'key');
  text = text.replace(/\\S\+/g, 'key');
  text = text.replace(/\.\+/g, 'key');
  text = text.replace(/\\d/g, '1');
  text = text.replace(/\\w/g, 'a');
  text = text.replace(/\[0-9]/g, '1');
  text = text.replace(/\[A-Z]/g, 'A');
  text = text.replace(/\[a-z]/gi, 'a');
  text = text.replace(/\[A-Za-z]/g, 'a');
  text = text.replace(/\[A-Za-z0-9]/g, 'a');
  text = text.replace(/[?*+]/g, '');
  text = text.replace(/\{(\d+)\}/g, '');
  text = text.replace(/\{(\d+),\d*}/g, '');
  text = text.replace(/\\([.^$*+?()[\]{}|/-])/g, '$1');

  return text || 'string';
};

export const inferKeyFromPattern = (pattern: string): string => {
  const key = inferTextFromPattern(pattern).replace(/[^A-Za-z0-9_-]/g, '');
  return key || 'key';
};

export const getPatternMatcher = (pattern: string): ((value: string) => boolean) => {
  try {
    const regex = new RegExp(pattern);
    return value => regex.test(value);
  } catch {
    return () => false;
  }
};

export const serializeExampleValue = (value: unknown): string => JSON.stringify(value);

export const getEnumValueAt = (
  schema: Record<string, unknown>,
  index: number,
): unknown => {
  const enumValues = schema.enum;
  if (!Array.isArray(enumValues) || index >= enumValues.length) return undefined;

  return cloneJsonValue(enumValues[index]);
};

const isStringExampleAllowed = (
  value: string,
  schema: Record<string, unknown>,
): boolean => {
  const minLength = getIntegerValue(schema, 'minLength');
  if (typeof minLength === 'number' && value.length < minLength) return false;

  const maxLength = getIntegerValue(schema, 'maxLength');
  if (typeof maxLength === 'number' && value.length > maxLength) return false;

  if (typeof schema.pattern === 'string' && !getPatternMatcher(schema.pattern)(value)) return false;

  return true;
};

const getShiftedCharacter = (
  characters: string,
  currentCharacter: string,
  index: number,
): string => {
  const currentIndex = characters.indexOf(currentCharacter);
  const nextIndex = currentIndex >= 0
    ? (currentIndex + index) % characters.length
    : (index - 1) % characters.length;
  const shiftedCharacter = characters[nextIndex];

  return shiftedCharacter === currentCharacter
    ? characters[(nextIndex + 1) % characters.length]
    : shiftedCharacter;
};

const getAlphabeticStringVariant = (value: string, index: number): string | undefined => {
  if (!value) return undefined;
  const lastCharacter = value[value.length - 1];

  if (/^[A-Z]+$/.test(value)) {
    return `${value.slice(0, -1)}${getShiftedCharacter(UPPERCASE_LETTERS, lastCharacter, index)}`;
  }

  if (/^[a-z]+$/.test(value)) {
    return `${value.slice(0, -1)}${getShiftedCharacter(LOWERCASE_LETTERS, lastCharacter, index)}`;
  }

  return undefined;
};

export const getUniqueStringExample = (
  value: string,
  schema: Record<string, unknown>,
  index: number,
): string | undefined => {
  const maxLength = getIntegerValue(schema, 'maxLength');
  const hasPatternConstraint = typeof schema.pattern === 'string';
  const shouldTryConstrainedVariants = hasPatternConstraint
    || value.length <= 1
    || (typeof maxLength === 'number' && `${value}${index + 1}`.length > maxLength);
  const numericSuffixMatch = value.match(/^(.*?)(\d+)$/);
  const incrementedNumericSuffix = numericSuffixMatch
    ? `${numericSuffixMatch[1]}${Number(numericSuffixMatch[2]) + index}`
    : '';
  const constrainedCandidates = shouldTryConstrainedVariants
    ? [
      getAlphabeticStringVariant(value, index),
      ...COMMON_SHORT_STRING_CANDIDATES,
    ]
    : [];
  const candidates = [
    incrementedNumericSuffix,
    ...constrainedCandidates,
    `${value}${index + 1}`,
    `${value}-${index + 1}`,
    `value${index + 1}`,
    `key${index + 1}`,
    String(index + 1),
  ].filter((candidate): candidate is string => Boolean(candidate) && candidate !== value);

  return candidates.find(candidate => isStringExampleAllowed(candidate, schema));
};

export const generateStringExample = (schema: Record<string, unknown>): string => {
  const format = typeof schema.format === 'string' ? schema.format : '';
  const base = (() => {
    if (format === 'email') return 'user@example.com';
    if (['uri', 'url', 'iri'].includes(format)) return 'https://example.com';
    if (format === 'date-time') return '2026-01-01T00:00:00.000Z';
    if (format === 'date') return '2026-01-01';
    if (format === 'time') return '12:00:00';
    if (format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
    if (format === 'ipv4') return '127.0.0.1';
    if (format === 'ipv6') return '2001:db8::1';
    return 'string';
  })();

  const minLength = Math.max(getIntegerValue(schema, 'minLength') || 0, 0);
  const maxLength = getIntegerValue(schema, 'maxLength');
  let value = base.length >= minLength ? base : `${base}${'x'.repeat(minLength - base.length)}`;

  if (typeof maxLength === 'number' && maxLength >= 0 && value.length > maxLength) {
    const fallbackLength = Math.max(Math.min(maxLength, Math.max(minLength, 1)), 0);
    value = 'x'.repeat(fallbackLength);
  }

  if (typeof schema.pattern === 'string') {
    const patternCandidate = inferTextFromPattern(schema.pattern);
    const matchedCandidate = [
      patternCandidate,
      value,
      ...COMMON_STRING_PATTERN_CANDIDATES,
    ].find(candidate => isStringExampleAllowed(candidate, schema));
    if (matchedCandidate) return matchedCandidate;
  }

  return value;
};

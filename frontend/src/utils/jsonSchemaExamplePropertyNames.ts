import { getIntegerValue } from './jsonSchemaExampleNumbers';
import {
  getPatternMatcher,
  inferKeyFromPattern,
  type JsonSchemaNode,
} from './jsonSchemaExamplePrimitives';
import { isRecord } from './storage';

const COMMON_DYNAMIC_PROPERTY_KEYS = [
  'key',
  'name',
  'value',
  'extra',
  'meta_key',
  'x-key',
  'field',
  'a',
  'A',
  '1',
];

const getStringEnumValues = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

export const isPropertyNameAllowed = (
  key: string,
  schema: JsonSchemaNode | undefined,
): boolean => {
  if (schema === undefined || schema === true) return true;
  if (schema === false || !isRecord(schema)) return false;

  const type = schema.type;
  if (
    (typeof type === 'string' && type !== 'string')
    || (Array.isArray(type) && !type.includes('string'))
  ) {
    return false;
  }

  if (typeof schema.const === 'string' && key !== schema.const) return false;

  const enumValues = getStringEnumValues(schema.enum);
  if (enumValues.length > 0 && !enumValues.includes(key)) return false;

  const minLength = getIntegerValue(schema, 'minLength');
  if (typeof minLength === 'number' && key.length < minLength) return false;

  const maxLength = getIntegerValue(schema, 'maxLength');
  if (typeof maxLength === 'number' && key.length > maxLength) return false;

  if (typeof schema.pattern === 'string' && !getPatternMatcher(schema.pattern)(key)) return false;

  return true;
};

export const getPropertyNameCandidates = (
  propertyNamesSchema: JsonSchemaNode | undefined,
): string[] => {
  if (!isRecord(propertyNamesSchema)) return COMMON_DYNAMIC_PROPERTY_KEYS;

  if (typeof propertyNamesSchema.const === 'string') return [propertyNamesSchema.const];

  const enumValues = getStringEnumValues(propertyNamesSchema.enum);
  if (enumValues.length > 0) return enumValues;

  if (typeof propertyNamesSchema.pattern === 'string') {
    return [
      inferKeyFromPattern(propertyNamesSchema.pattern),
      ...COMMON_DYNAMIC_PROPERTY_KEYS,
    ];
  }

  return COMMON_DYNAMIC_PROPERTY_KEYS;
};

export const getPatternPropertyKeyCandidates = (
  pattern: string,
  propertyNamesSchema: JsonSchemaNode | undefined,
): string[] => ([
  inferKeyFromPattern(pattern),
  ...getPropertyNameCandidates(propertyNamesSchema),
  ...COMMON_DYNAMIC_PROPERTY_KEYS,
]);

export const findAvailablePropertyKey = (
  candidates: string[],
  usedKeys: Set<string>,
  isAllowed: (key: string) => boolean,
): string | undefined => (
  [...new Set(candidates)].find(key => !usedKeys.has(key) && isAllowed(key))
);

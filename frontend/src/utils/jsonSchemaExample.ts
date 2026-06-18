import { validateJsonAgainstSchema, type JsonSchemaValidationResult } from './jsonSchemaValidation';

export interface JsonSchemaExampleResult {
  exampleText?: string;
  error?: string;
}

type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';
type JsonSchemaNode = boolean | Record<string, unknown>;

interface ExampleContext {
  rootSchema: unknown;
  seenRefs: Set<string>;
  depth: number;
}

const MAX_EXAMPLE_DEPTH = 8;
const DEFAULT_ARRAY_EXAMPLE_ITEMS = 3;
const MAX_ARRAY_CONSTRAINT_EXAMPLE_ITEMS = 8;
const MAX_OBJECT_EXAMPLE_PROPERTIES = 80;
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

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isJsonSerializableValue = (value: unknown): boolean => {
  if (value === null) return true;
  if (['string', 'number', 'boolean'].includes(typeof value)) return Number.isFinite(value as number) || typeof value !== 'number';
  if (Array.isArray(value)) return value.every(isJsonSerializableValue);
  if (isRecord(value)) return Object.values(value).every(isJsonSerializableValue);
  return false;
};

const cloneJsonValue = (value: unknown): unknown => (
  isJsonSerializableValue(value) ? JSON.parse(JSON.stringify(value)) : undefined
);

const getNumberValue = (schema: Record<string, unknown>, key: string): number | undefined => {
  const value = schema[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const getIntegerValue = (schema: Record<string, unknown>, key: string): number | undefined => {
  const value = getNumberValue(schema, key);
  return typeof value === 'number' ? Math.trunc(value) : undefined;
};

const decodeJsonPointerSegment = (segment: string): string => (
  segment.replace(/~1/g, '/').replace(/~0/g, '~')
);

const resolveLocalRef = (rootSchema: unknown, ref: string): unknown => {
  if (ref === '#') return rootSchema;
  if (!ref.startsWith('#/')) return undefined;

  return ref
    .slice(2)
    .split('/')
    .map(decodeJsonPointerSegment)
    .reduce<unknown>((current, segment) => {
      if (current === undefined) return undefined;
      if (Array.isArray(current)) {
        const index = Number(segment);
        return Number.isInteger(index) ? current[index] : undefined;
      }
      if (isRecord(current)) return current[segment];
      return undefined;
    }, rootSchema);
};

const getPrimaryType = (schema: Record<string, unknown>): JsonSchemaType | undefined => {
  const type = schema.type;
  if (typeof type === 'string') return type as JsonSchemaType;
  if (Array.isArray(type)) {
    return type.find((item): item is JsonSchemaType => (
      typeof item === 'string' && item !== 'null'
    ));
  }

  if (isRecord(schema.properties) || Array.isArray(schema.required)) return 'object';
  if (isRecord(schema.items) || schema.items === false || Array.isArray(schema.prefixItems)) return 'array';
  if (typeof schema.format === 'string' || typeof schema.minLength === 'number' || typeof schema.pattern === 'string') return 'string';
  if (typeof schema.minimum === 'number' || typeof schema.maximum === 'number' || typeof schema.multipleOf === 'number') return 'number';
  return undefined;
};

const getPreferredLiteral = (schema: Record<string, unknown>): unknown => {
  const defaultValue = cloneJsonValue(schema.default);
  if (defaultValue !== undefined) return defaultValue;

  const examples = schema.examples;
  if (Array.isArray(examples) && examples.length > 0) {
    const exampleValue = cloneJsonValue(examples[0]);
    if (exampleValue !== undefined) return exampleValue;
  }

  const constValue = cloneJsonValue(schema.const);
  if (constValue !== undefined) return constValue;

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const enumValue = cloneJsonValue(enumValues.find(value => value !== null) ?? enumValues[0]);
    if (enumValue !== undefined) return enumValue;
  }

  return undefined;
};

const getRequiredKeys = (schema: Record<string, unknown>): string[] => {
  const required = schema.required;
  return Array.isArray(required)
    ? required.filter((key): key is string => typeof key === 'string')
    : [];
};

const getStringArrayValues = (value: unknown): string[] => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
);

const getDependentRequiredKeys = (
  schema: Record<string, unknown>,
  presentKeys: Set<string>
): string[] => {
  const keys: string[] = [];
  const dependentRequired = isRecord(schema.dependentRequired) ? schema.dependentRequired : {};
  Object.entries(dependentRequired).forEach(([key, value]) => {
    if (presentKeys.has(key)) keys.push(...getStringArrayValues(value));
  });

  const dependencies = isRecord(schema.dependencies) ? schema.dependencies : {};
  Object.entries(dependencies).forEach(([key, value]) => {
    if (presentKeys.has(key)) keys.push(...getStringArrayValues(value));
  });

  return uniqueKeys(keys);
};

const getDependentSchemaNodes = (
  schema: Record<string, unknown>,
  presentKeys: Set<string>
): JsonSchemaNode[] => {
  const schemas: JsonSchemaNode[] = [];
  const dependentSchemas = isRecord(schema.dependentSchemas) ? schema.dependentSchemas : {};
  Object.entries(dependentSchemas).forEach(([key, value]) => {
    if (presentKeys.has(key) && (isRecord(value) || typeof value === 'boolean')) schemas.push(value);
  });

  const dependencies = isRecord(schema.dependencies) ? schema.dependencies : {};
  Object.entries(dependencies).forEach(([key, value]) => {
    if (presentKeys.has(key) && (isRecord(value) || typeof value === 'boolean')) schemas.push(value);
  });

  return schemas.slice(0, MAX_OBJECT_EXAMPLE_PROPERTIES);
};

const getSchemaProperties = (schema: Record<string, unknown>): Record<string, JsonSchemaNode> => {
  if (!isRecord(schema.properties)) return {};

  return Object.fromEntries(
    Object.entries(schema.properties).filter((entry): entry is [string, JsonSchemaNode] => (
      isRecord(entry[1]) || typeof entry[1] === 'boolean'
    ))
  );
};

const getPatternProperties = (schema: Record<string, unknown>): Array<[string, JsonSchemaNode]> => {
  if (!isRecord(schema.patternProperties)) return [];

  return Object.entries(schema.patternProperties).filter((entry): entry is [string, JsonSchemaNode] => (
    isRecord(entry[1]) || typeof entry[1] === 'boolean'
  ));
};

const getAdditionalPropertiesSchema = (schema: Record<string, unknown>): JsonSchemaNode | false | undefined => {
  if (schema.additionalProperties === false) return false;
  if (schema.additionalProperties === true) return true;
  if (isRecord(schema.additionalProperties)) return schema.additionalProperties;
  return undefined;
};

const getPropertyNamesSchema = (schema: Record<string, unknown>): JsonSchemaNode | undefined => {
  if (schema.propertyNames === true || schema.propertyNames === false || isRecord(schema.propertyNames)) {
    return schema.propertyNames;
  }

  return undefined;
};

const uniqueKeys = (keys: string[]): string[] => [...new Set(keys)].slice(0, MAX_OBJECT_EXAMPLE_PROPERTIES);

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

const inferKeyFromPattern = (pattern: string): string => {
  const key = inferTextFromPattern(pattern).replace(/[^A-Za-z0-9_-]/g, '');
  return key || 'key';
};

const getPatternMatcher = (pattern: string): ((value: string) => boolean) => {
  try {
    const regex = new RegExp(pattern);
    return value => regex.test(value);
  } catch {
    return () => false;
  }
};

const getStringEnumValues = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

const isPropertyNameAllowed = (key: string, schema: JsonSchemaNode | undefined): boolean => {
  if (schema === undefined || schema === true) return true;
  if (schema === false || !isRecord(schema)) return false;

  const type = schema.type;
  if (
    (typeof type === 'string' && type !== 'string') ||
    (Array.isArray(type) && !type.includes('string'))
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

const getPropertyNameCandidates = (propertyNamesSchema: JsonSchemaNode | undefined): string[] => {
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

const getPatternPropertyKeyCandidates = (
  pattern: string,
  propertyNamesSchema: JsonSchemaNode | undefined
): string[] => ([
  inferKeyFromPattern(pattern),
  ...getPropertyNameCandidates(propertyNamesSchema),
  ...COMMON_DYNAMIC_PROPERTY_KEYS,
]);

const findAvailablePropertyKey = (
  candidates: string[],
  usedKeys: Set<string>,
  isAllowed: (key: string) => boolean
): string | undefined => (
  [...new Set(candidates)].find(key => !usedKeys.has(key) && isAllowed(key))
);

const serializeExampleValue = (value: unknown): string => JSON.stringify(value);

const getEnumValueAt = (schema: Record<string, unknown>, index: number): unknown => {
  const enumValues = schema.enum;
  if (!Array.isArray(enumValues) || index >= enumValues.length) return undefined;

  return cloneJsonValue(enumValues[index]);
};

const isStringExampleAllowed = (value: string, schema: Record<string, unknown>): boolean => {
  const minLength = getIntegerValue(schema, 'minLength');
  if (typeof minLength === 'number' && value.length < minLength) return false;

  const maxLength = getIntegerValue(schema, 'maxLength');
  if (typeof maxLength === 'number' && value.length > maxLength) return false;

  if (typeof schema.pattern === 'string' && !getPatternMatcher(schema.pattern)(value)) return false;

  return true;
};

const getShiftedCharacter = (characters: string, currentCharacter: string, index: number): string => {
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

const getUniqueStringExample = (
  value: string,
  schema: Record<string, unknown>,
  index: number
): string | undefined => {
  const maxLength = getIntegerValue(schema, 'maxLength');
  const hasPatternConstraint = typeof schema.pattern === 'string';
  const shouldTryConstrainedVariants = hasPatternConstraint ||
    value.length <= 1 ||
    (typeof maxLength === 'number' && `${value}${index + 1}`.length > maxLength);
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

const generateStringExample = (schema: Record<string, unknown>): string => {
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

const isNumberExampleAllowed = (
  value: number,
  schema: Record<string, unknown>,
  integerOnly: boolean
): boolean => {
  if (!Number.isFinite(value)) return false;
  if (integerOnly && !Number.isInteger(value)) return false;

  const minimum = getNumberValue(schema, 'minimum');
  if (typeof minimum === 'number' && value < minimum) return false;

  const exclusiveMinimum = getNumberValue(schema, 'exclusiveMinimum');
  if (typeof exclusiveMinimum === 'number' && value <= exclusiveMinimum) return false;

  const maximum = getNumberValue(schema, 'maximum');
  if (typeof maximum === 'number' && value > maximum) return false;

  const exclusiveMaximum = getNumberValue(schema, 'exclusiveMaximum');
  if (typeof exclusiveMaximum === 'number' && value >= exclusiveMaximum) return false;

  const multipleOf = getNumberValue(schema, 'multipleOf');
  if (typeof multipleOf === 'number' && multipleOf > 0) {
    const quotient = value / multipleOf;
    if (Math.abs(quotient - Math.round(quotient)) > Number.EPSILON * 100) return false;
  }

  return true;
};

const generateNumberExample = (schema: Record<string, unknown>, integerOnly: boolean): number => {
  const minimum = getNumberValue(schema, 'minimum');
  const exclusiveMinimum = getNumberValue(schema, 'exclusiveMinimum');
  const maximum = getNumberValue(schema, 'maximum');
  const exclusiveMaximum = getNumberValue(schema, 'exclusiveMaximum');
  const multipleOf = getNumberValue(schema, 'multipleOf');

  let value = typeof minimum === 'number' ? minimum : 1;
  if (typeof exclusiveMinimum === 'number') value = exclusiveMinimum + (integerOnly ? 1 : 0.1);
  if (integerOnly) value = Math.ceil(value);

  if (typeof multipleOf === 'number' && multipleOf > 0) {
    value = Math.ceil(value / multipleOf) * multipleOf;
    if (integerOnly) value = Math.ceil(value);
  }

  if (typeof maximum === 'number' && value > maximum) value = integerOnly ? Math.floor(maximum) : maximum;
  if (typeof exclusiveMaximum === 'number' && value >= exclusiveMaximum) {
    value = integerOnly ? Math.floor(exclusiveMaximum - 1) : exclusiveMaximum - 0.1;
  }

  return integerOnly ? Math.trunc(value) : Number(value.toFixed(4));
};

const getUniqueNumberExample = (
  value: number,
  schema: Record<string, unknown>,
  index: number,
  integerOnly: boolean
): number | undefined => {
  const multipleOf = getNumberValue(schema, 'multipleOf');
  const step = typeof multipleOf === 'number' && multipleOf > 0
    ? multipleOf
    : integerOnly
      ? 1
      : 0.1;
  const candidates = [
    value + step * index,
    value + step * (index + 1),
    value - step * index,
  ].map(candidate => (integerOnly ? Math.trunc(candidate) : Number(candidate.toFixed(4))));

  return candidates.find(candidate => isNumberExampleAllowed(candidate, schema, integerOnly));
};

const mergeAllOfExamples = (examples: unknown[]): unknown => {
  const objectExamples = examples.filter(isRecord);
  if (objectExamples.length === examples.length) return Object.assign({}, ...objectExamples);
  return examples.find(value => value !== undefined) ?? {};
};

const isExampleValidForSchemaNode = (example: unknown, schemaNode: JsonSchemaNode): boolean => {
  const exampleText = JSON.stringify(example);
  const schemaText = JSON.stringify(schemaNode);
  if (typeof exampleText !== 'string' || typeof schemaText !== 'string') return false;

  return validateJsonAgainstSchema(exampleText, schemaText).status === 'valid';
};

const pickFirstBranchExample = (
  branches: unknown,
  context: ExampleContext,
  schemaNode: Record<string, unknown>
): unknown | undefined => {
  if (!Array.isArray(branches)) return undefined;

  let firstExample: unknown;
  for (const branch of branches) {
    const example = generateExampleValue(branch, { ...context, depth: context.depth + 1 });
    if (example === undefined) continue;
    if (isExampleValidForSchemaNode(example, schemaNode)) return example;
    if (firstExample === undefined) firstExample = example;
  }

  return firstExample;
};

const getObjectSchemaProperties = (schema: Record<string, unknown>): Record<string, JsonSchemaNode> => (
  getSchemaProperties(schema)
);

const getUniqueObjectExample = (
  value: Record<string, unknown>,
  schema: Record<string, unknown>,
  context: ExampleContext,
  index: number
): Record<string, unknown> | undefined => {
  const properties = getObjectSchemaProperties(schema);

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!(key in value)) continue;

    const nextChildValue = getUniqueExampleValue(
      value[key],
      childSchema,
      context,
      index
    );
    if (serializeExampleValue(nextChildValue) !== serializeExampleValue(value[key])) {
      return {
        ...value,
        [key]: nextChildValue,
      };
    }
  }

  if (schema.additionalProperties === false) return undefined;

  return {
    ...value,
    _exampleIndex: index + 1,
  };
};

const getUniqueExampleValue = (
  value: unknown,
  schemaNode: unknown,
  context: ExampleContext,
  index: number
): unknown => {
  if (index <= 0 || schemaNode === false || !isRecord(schemaNode)) return value;
  if ('const' in schemaNode) return value;

  const enumValue = getEnumValueAt(schemaNode, index);
  if (enumValue !== undefined) return enumValue;

  if (typeof value === 'string') {
    return getUniqueStringExample(value, schemaNode, index) ?? value;
  }

  if (typeof value === 'number') {
    const type = getPrimaryType(schemaNode);
    return getUniqueNumberExample(value, schemaNode, index, type === 'integer') ?? value;
  }

  if (typeof value === 'boolean') {
    return index === 1 ? !value : value;
  }

  if (isRecord(value)) {
    return getUniqueObjectExample(value, schemaNode, context, index) ?? value;
  }

  return value;
};

const getArrayItemSchema = (schema: Record<string, unknown>): JsonSchemaNode => {
  const items = schema.items;
  return isRecord(items) || typeof items === 'boolean' ? items : {};
};

const getContainsSchema = (schema: Record<string, unknown>): JsonSchemaNode | undefined => {
  const contains = schema.contains;
  return isRecord(contains) || typeof contains === 'boolean' ? contains : undefined;
};

const getArrayExampleLimit = (
  schema: Record<string, unknown>,
  requiredCount: number
): number => {
  const maxItems = getIntegerValue(schema, 'maxItems');
  const safeLimit = Math.max(
    DEFAULT_ARRAY_EXAMPLE_ITEMS,
    Math.min(requiredCount, MAX_ARRAY_CONSTRAINT_EXAMPLE_ITEMS)
  );
  return typeof maxItems === 'number' && maxItems >= 0
    ? Math.min(maxItems, safeLimit)
    : safeLimit;
};

const ensureUniqueArrayValues = (
  values: unknown[],
  valueSchemas: unknown[],
  context: ExampleContext
): unknown[] => {
  const seenValues = new Set<string>();

  return values.map((value, index) => {
    const serializedValue = serializeExampleValue(value);
    if (!seenValues.has(serializedValue)) {
      seenValues.add(serializedValue);
      return value;
    }

    for (let attemptIndex = index; attemptIndex < index + MAX_ARRAY_CONSTRAINT_EXAMPLE_ITEMS + 1; attemptIndex++) {
      const uniqueValue = getUniqueExampleValue(value, valueSchemas[index], context, attemptIndex);
      const serializedUniqueValue = serializeExampleValue(uniqueValue);
      if (!seenValues.has(serializedUniqueValue)) {
        seenValues.add(serializedUniqueValue);
        return uniqueValue;
      }
    }

    seenValues.add(serializedValue);
    return value;
  });
};

const generateArrayExample = (schema: Record<string, unknown>, context: ExampleContext): unknown[] => {
  const prefixItems = Array.isArray(schema.prefixItems)
    ? schema.prefixItems.filter((item): item is JsonSchemaNode => isRecord(item) || typeof item === 'boolean')
    : [];
  const minItems = Math.max(getIntegerValue(schema, 'minItems') || 0, 0);
  const items = schema.items;

  if (prefixItems.length > 0) {
    const arrayLimit = getArrayExampleLimit(schema, minItems);
    const exampleCount = Math.min(
      Math.max(minItems, Math.min(prefixItems.length, DEFAULT_ARRAY_EXAMPLE_ITEMS)),
      arrayLimit
    );
    const itemSchema = getArrayItemSchema(schema);
    const itemContext = { ...context, depth: context.depth + 1 };
    const values = prefixItems
      .slice(0, Math.min(prefixItems.length, exampleCount))
      .map(item => generateExampleValue(item, itemContext));

    while (values.length < exampleCount && items !== false) {
      values.push(generateExampleValue(itemSchema, itemContext));
    }

    return schema.uniqueItems === true
      ? ensureUniqueArrayValues(values, values.map((_, index) => prefixItems[index] || itemSchema), itemContext)
      : values;
  }

  if (items === false) return [];

  const containsSchema = getContainsSchema(schema);
  const minContains = containsSchema === undefined
    ? 0
    : Math.max(getIntegerValue(schema, 'minContains') ?? 1, 0);
  const requiredCount = Math.max(
    minItems,
    minContains,
    isRecord(items) || typeof items === 'boolean' || containsSchema ? 1 : 0
  );
  const arrayLimit = getArrayExampleLimit(schema, requiredCount);
  const exampleCount = Math.min(
    requiredCount,
    arrayLimit
  );
  if (exampleCount === 0) return [];

  const itemSchema = getArrayItemSchema(schema);
  const itemContext = { ...context, depth: context.depth + 1 };
  const values: unknown[] = [];
  const valueSchemas: unknown[] = [];

  if (containsSchema !== undefined && containsSchema !== false) {
    const containsCount = Math.min(minContains, exampleCount);
    for (let index = 0; index < containsCount; index++) {
      values.push(generateExampleValue(containsSchema, itemContext));
      valueSchemas.push(containsSchema);
    }
  }

  while (values.length < exampleCount) {
    values.push(generateExampleValue(itemSchema, itemContext));
    valueSchemas.push(itemSchema);
  }

  if (schema.uniqueItems !== true) return values;

  return ensureUniqueArrayValues(values, valueSchemas, itemContext);
};

const isObjectDependencyKeyAllowed = (
  key: string,
  properties: Record<string, JsonSchemaNode>,
  propertyNamesSchema: JsonSchemaNode | undefined,
  additionalPropertiesSchema: JsonSchemaNode | false | undefined
): boolean => (
  isPropertyNameAllowed(key, propertyNamesSchema) &&
  (key in properties || additionalPropertiesSchema !== false)
);

const addGeneratedObjectEntries = (
  entries: Map<string, unknown>,
  example: Record<string, unknown>,
  properties: Record<string, JsonSchemaNode>,
  propertyNamesSchema: JsonSchemaNode | undefined,
  additionalPropertiesSchema: JsonSchemaNode | false | undefined
): boolean => {
  let hasAddedEntry = false;
  for (const [key, value] of Object.entries(example)) {
    if (entries.has(key) || entries.size >= MAX_OBJECT_EXAMPLE_PROPERTIES) continue;
    if (!isObjectDependencyKeyAllowed(key, properties, propertyNamesSchema, additionalPropertiesSchema)) continue;

    entries.set(key, value);
    hasAddedEntry = true;
  }

  return hasAddedEntry;
};

const addObjectDependencyEntries = (
  entries: Map<string, unknown>,
  schema: Record<string, unknown>,
  properties: Record<string, JsonSchemaNode>,
  propertyNamesSchema: JsonSchemaNode | undefined,
  additionalPropertiesSchema: JsonSchemaNode | false | undefined,
  context: ExampleContext
) => {
  let hasAddedEntry = true;
  while (hasAddedEntry && entries.size < MAX_OBJECT_EXAMPLE_PROPERTIES) {
    hasAddedEntry = false;
    const presentKeys = new Set(entries.keys());
    const keys = getDependentRequiredKeys(schema, presentKeys);
    for (const key of keys) {
      if (entries.has(key) || entries.size >= MAX_OBJECT_EXAMPLE_PROPERTIES) continue;
      if (!isObjectDependencyKeyAllowed(key, properties, propertyNamesSchema, additionalPropertiesSchema)) continue;

      const valueSchema = properties[key] || (
        additionalPropertiesSchema === false ? undefined : additionalPropertiesSchema || {}
      );
      if (valueSchema === undefined) continue;

      const value = generateExampleValue(valueSchema, { ...context, depth: context.depth + 1 });
      entries.set(key, value === undefined ? null : value);
      hasAddedEntry = true;
    }

    const dependentSchemaExamples = getDependentSchemaNodes(schema, presentKeys)
      .map(dependentSchema => generateExampleValue(dependentSchema, { ...context, depth: context.depth + 1 }))
      .filter(isRecord);
    for (const example of dependentSchemaExamples) {
      hasAddedEntry = addGeneratedObjectEntries(
        entries,
        example,
        properties,
        propertyNamesSchema,
        additionalPropertiesSchema
      ) || hasAddedEntry;
    }
  }
};

const getConditionalBranchSchema = (
  schema: Record<string, unknown>,
  example: Record<string, unknown>
): JsonSchemaNode | undefined => {
  const conditionSchema = schema.if;
  if (!isRecord(conditionSchema) && typeof conditionSchema !== 'boolean') return undefined;

  const branchSchema = isExampleValidForSchemaNode(example, conditionSchema)
    ? schema.then
    : schema.else;
  return isRecord(branchSchema) || typeof branchSchema === 'boolean' ? branchSchema : undefined;
};

const addConditionalObjectEntries = (
  entries: Map<string, unknown>,
  schema: Record<string, unknown>,
  properties: Record<string, JsonSchemaNode>,
  propertyNamesSchema: JsonSchemaNode | undefined,
  additionalPropertiesSchema: JsonSchemaNode | false | undefined,
  context: ExampleContext
) => {
  const branchSchema = getConditionalBranchSchema(schema, Object.fromEntries(entries));
  if (branchSchema === undefined || branchSchema === false) return;

  const branchExample = generateExampleValue(branchSchema, { ...context, depth: context.depth + 1 });
  if (!isRecord(branchExample)) return;

  const hasAddedEntry = addGeneratedObjectEntries(
    entries,
    branchExample,
    properties,
    propertyNamesSchema,
    additionalPropertiesSchema
  );
  if (hasAddedEntry) {
    addObjectDependencyEntries(entries, schema, properties, propertyNamesSchema, additionalPropertiesSchema, context);
  }
};

const generateObjectExample = (schema: Record<string, unknown>, context: ExampleContext): Record<string, unknown> => {
  const properties = getSchemaProperties(schema);
  const patternProperties = getPatternProperties(schema);
  const propertyNamesSchema = getPropertyNamesSchema(schema);
  const additionalPropertiesSchema = getAdditionalPropertiesSchema(schema);
  const keys = uniqueKeys([
    ...getRequiredKeys(schema),
    ...Object.keys(properties),
  ]);
  const entries = new Map<string, unknown>();

  keys.forEach(key => {
    const value = generateExampleValue(properties[key] || {}, { ...context, depth: context.depth + 1 });
    entries.set(key, value === undefined ? null : value);
  });
  addObjectDependencyEntries(entries, schema, properties, propertyNamesSchema, additionalPropertiesSchema, context);

  patternProperties.forEach(([pattern, patternSchema]) => {
    if (entries.size >= MAX_OBJECT_EXAMPLE_PROPERTIES) return;

    const matcher = getPatternMatcher(pattern);
    const key = findAvailablePropertyKey(
      getPatternPropertyKeyCandidates(pattern, propertyNamesSchema),
      new Set(entries.keys()),
      candidate => matcher(candidate) && isPropertyNameAllowed(candidate, propertyNamesSchema)
    );
    if (!key) return;

    const value = generateExampleValue(patternSchema, { ...context, depth: context.depth + 1 });
    entries.set(key, value === undefined ? null : value);
  });
  addObjectDependencyEntries(entries, schema, properties, propertyNamesSchema, additionalPropertiesSchema, context);

  const minProperties = Math.max(getIntegerValue(schema, 'minProperties') || 0, 0);
  const extraSchema = additionalPropertiesSchema === undefined ? true : additionalPropertiesSchema;
  while (
    entries.size < minProperties &&
    entries.size < MAX_OBJECT_EXAMPLE_PROPERTIES &&
    extraSchema !== false
  ) {
    const key = findAvailablePropertyKey(
      getPropertyNameCandidates(propertyNamesSchema),
      new Set(entries.keys()),
      candidate => isPropertyNameAllowed(candidate, propertyNamesSchema)
    );
    if (!key) break;

    const value = generateExampleValue(extraSchema, { ...context, depth: context.depth + 1 });
    entries.set(key, value === undefined ? null : value);
  }
  addObjectDependencyEntries(entries, schema, properties, propertyNamesSchema, additionalPropertiesSchema, context);
  addConditionalObjectEntries(entries, schema, properties, propertyNamesSchema, additionalPropertiesSchema, context);

  return Object.fromEntries(entries);
};

const generateExampleValue = (schemaNode: unknown, context: ExampleContext): unknown => {
  if (context.depth > MAX_EXAMPLE_DEPTH) return {};
  if (schemaNode === true) return {};
  if (schemaNode === false) return undefined;
  if (!isRecord(schemaNode)) return {};

  const ref = typeof schemaNode.$ref === 'string' ? schemaNode.$ref : '';
  if (ref) {
    if (context.seenRefs.has(ref)) return {};

    const resolved = resolveLocalRef(context.rootSchema, ref);
    if (resolved !== undefined) {
      const nextRefs = new Set(context.seenRefs);
      nextRefs.add(ref);
      return generateExampleValue(resolved, {
        ...context,
        seenRefs: nextRefs,
        depth: context.depth + 1,
      });
    }
  }

  const preferredLiteral = getPreferredLiteral(schemaNode);
  if (preferredLiteral !== undefined) return preferredLiteral;

  if (Array.isArray(schemaNode.allOf)) {
    return mergeAllOfExamples(
      schemaNode.allOf.map(branch => generateExampleValue(branch, { ...context, depth: context.depth + 1 }))
    );
  }

  const branchExample = pickFirstBranchExample(schemaNode.oneOf || schemaNode.anyOf, context, schemaNode);
  if (branchExample !== undefined) return branchExample;

  const type = getPrimaryType(schemaNode);
  if (type === 'object') return generateObjectExample(schemaNode, context);
  if (type === 'array') return generateArrayExample(schemaNode, context);
  if (type === 'string') return generateStringExample(schemaNode);
  if (type === 'integer') return generateNumberExample(schemaNode, true);
  if (type === 'number') return generateNumberExample(schemaNode, false);
  if (type === 'boolean') return true;
  if (type === 'null') return null;

  return {};
};

const formatExampleValidationError = (result: JsonSchemaValidationResult): string => {
  const firstIssue = result.issues[0];
  if (firstIssue) {
    return `生成的示例未通过当前 Schema 校验：${firstIssue.path} [${firstIssue.keyword}] ${firstIssue.message}`;
  }

  return `生成的示例未通过当前 Schema 校验：${result.summary}`;
};

export const generateJsonSchemaExampleText = (schemaText: string): JsonSchemaExampleResult => {
  if (!schemaText.trim()) return { error: '请先粘贴 JSON Schema' };

  let schema: unknown;
  try {
    schema = JSON.parse(schemaText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Schema 不是合法 JSON: ${message}` };
  }

  if (schema === false) return { error: '当前 Schema 不允许任何 JSON 值，无法生成示例' };

  const example = generateExampleValue(schema, {
    rootSchema: schema,
    seenRefs: new Set(),
    depth: 0,
  });

  if (example === undefined) return { error: '当前 Schema 不允许任何 JSON 值，无法生成示例' };

  const exampleText = JSON.stringify(example, null, 2);
  const validationResult = validateJsonAgainstSchema(exampleText, schemaText);
  if (validationResult.status !== 'valid') {
    return { error: formatExampleValidationError(validationResult) };
  }

  return { exampleText };
};

import type {
  DecodeLayer,
  SchemeDisplayHeaderRecord,
} from './schemeTypes';
import { isSchemeDisplayHeaderKey } from './schemeDisplayHeader';
import { isRecord } from './storage';

const DECODE_LAYER_TYPES = {
  url: true,
  'query-string': true,
  'url-encoded': true,
  base64: true,
  jwt: true,
  json: true,
  plain: true,
  'json-escaped-slash': true,
  'json-unicode-ascii': true,
} satisfies Record<DecodeLayer['type'], true>;

const isOptionalString = (value: unknown): value is string | undefined => (
  value === undefined || typeof value === 'string'
);

const isOptionalBoolean = (value: unknown): value is boolean | undefined => (
  value === undefined || typeof value === 'boolean'
);

const isArrayOf = <T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] => {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index) || !predicate(value[index])) return false;
  }
  return true;
};

const isJsonPointer = (value: unknown): value is string => (
  typeof value === 'string'
  && (value === '' || /^(?:\/(?:[^~]|~[01])*)+$/.test(value))
);

const isDecodeLayer = (value: unknown): value is DecodeLayer => (
  isRecord(value)
  && typeof value.type === 'string'
  && Object.hasOwn(DECODE_LAYER_TYPES, value.type)
  && typeof value.before === 'string'
  && isOptionalString(value.after)
  && typeof value.description === 'string'
  && isOptionalBoolean(value.reversible)
);

export const isSchemeDisplayHeaderRecord = (
  value: unknown,
): value is SchemeDisplayHeaderRecord => (
  isRecord(value)
  && isJsonPointer(value.path)
  && isSchemeDisplayHeaderKey(value.headerKey)
  && typeof value.header === 'string'
  && typeof value.source === 'string'
  && isArrayOf(value.layers, isDecodeLayer)
  && isOptionalString(value.displayValueSnapshot)
);

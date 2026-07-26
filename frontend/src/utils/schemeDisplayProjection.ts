import type { JsonValue } from '../types';
import {
  tryGetJsonPointerValue,
} from './jsonPointer';
import { getSchemeDisplayHeader } from './schemeDisplayHeader';
import { parseJsonValue, tryParseJsonValue } from './jsonValueGuards';
import {
  buildSchemeDisplayProjectionValue,
  type SchemeDisplayHeaderEvent,
  type SchemeDisplayProjection,
} from './schemeDisplayProjectionBuilder';
import type {
  DecodeLayer,
  SchemeDisplayHeaderRecord,
  StructuredValue,
} from './schemeTypes';
import type { SchemeUrlContext } from './schemeUrlShapes';
import { createSecureUuid } from './secureUuid';

export interface SchemeDecodeDisplayContext {
  displayHeaderEvents: SchemeDisplayHeaderEvent[];
  displayHeaderNonce: string;
  nextDisplayHeaderEventId: number;
  displayHeaderValues: Set<string>;
}

const getDisplayHeaderEventKey = (internalKey: string, internalValue: string): string => (
  `${internalKey}\u0000${internalValue}`
);

export const createSchemeDecodeDisplayContext = (): SchemeDecodeDisplayContext => ({
  displayHeaderEvents: [],
  displayHeaderNonce: createSecureUuid(),
  nextDisplayHeaderEventId: 0,
  displayHeaderValues: new Set(),
});

export const isSchemeDisplayProjectionHeader = (
  context: SchemeDecodeDisplayContext | undefined,
  key: string,
  value: StructuredValue,
): boolean => (
  typeof value === 'string'
  && context?.displayHeaderValues.has(getDisplayHeaderEventKey(key, value)) === true
);

export const addSchemeDisplayProjectionHeader = (
  value: StructuredValue,
  source: string,
  layers: DecodeLayer[],
  context?: SchemeDecodeDisplayContext,
  parsedUrlContext?: SchemeUrlContext,
): StructuredValue => {
  if (!context) return value;

  if (
    !value
    || Array.isArray(value)
    || typeof value !== 'object'
  ) {
    return value;
  }
  const header = getSchemeDisplayHeader(
    source,
    parsedUrlContext,
  );
  if (!header) return value;

  const eventId = context.nextDisplayHeaderEventId;
  context.nextDisplayHeaderEventId += 1;
  const internalKey = `__scheme_display_event_${context.displayHeaderNonce}_${eventId}__`;
  const internalValue = `__scheme_display_marker_${context.displayHeaderNonce}_${eventId}__`;
  const valueWithInternalHeader = {
    [internalKey]: internalValue,
    ...value,
  } as StructuredValue;

  context.displayHeaderEvents.push({
    internalKey,
    internalValue,
    header,
    source,
    layers: layers.map(layer => ({ ...layer })),
  });
  context.displayHeaderValues.add(
    getDisplayHeaderEventKey(internalKey, internalValue),
  );
  return valueWithInternalHeader;
};

export const buildSchemeDisplayProjection = (
  decodedWithHeaders: string,
  context: SchemeDecodeDisplayContext,
): SchemeDisplayProjection | null => {
  const parsed = tryParseJsonValue(decodedWithHeaders);
  if (parsed === undefined) return null;
  return buildSchemeDisplayProjectionValue(
    parsed,
    context.displayHeaderEvents,
  );
};

export const stripSchemeDisplayHeadersFromValue = (
  value: JsonValue,
  displayHeaders: SchemeDisplayHeaderRecord[] = [],
): JsonValue => {
  if (displayHeaders.length === 0) return value;

  const root = structuredClone(value);
  for (const header of displayHeaders) {
    const currentValue = tryGetJsonPointerValue<JsonValue>(root, header.path);
    if (
      currentValue
      && !Array.isArray(currentValue)
      && typeof currentValue === 'object'
      && Object.hasOwn(currentValue, header.headerKey)
    ) {
      delete currentValue[header.headerKey];
    }
  }
  return root;
};

export const stripSchemeDisplayHeaders = (
  content: string,
  displayHeaders: SchemeDisplayHeaderRecord[] = [],
): string => {
  if (displayHeaders.length === 0) return content;

  try {
    const value = parseJsonValue(content);
    return JSON.stringify(
      stripSchemeDisplayHeadersFromValue(value, displayHeaders),
      null,
      2,
    );
  } catch {
    return content;
  }
};

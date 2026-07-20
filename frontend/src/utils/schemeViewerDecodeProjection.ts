import type { JsonObject } from '../types';
import { isJsonObject, isJsonValue } from './jsonValueGuards';
import { removeSchemeDisplayHeader } from './schemeDisplayHeader';
import { getUrlResourceSchemaFromUrl } from './schemeMetadata';
import type { DecodeLayer } from './schemeTypes';

const URL_HEADER_KEYS = ['__url__', '__url_header__'] as const;
const SCHEME_HEADER_KEYS = ['__scheme__', '__scheme_header__'] as const;

export interface SchemeViewerDecodeProjection {
  content: string;
  headerKey?: string;
}

export interface SchemeViewerRestoredContent {
  content: string;
  source: string;
}

export interface SchemeViewerEncodingInput {
  content: string;
  layers: DecodeLayer[];
}

const getHeaderKeys = (
  source: string,
): typeof URL_HEADER_KEYS | typeof SCHEME_HEADER_KEYS | null => {
  const normalized = source.trim().replace(/\\\//g, '/');
  const protocol = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(normalized)?.[1].toLowerCase();
  if (!protocol) return null;

  return protocol === 'http' || protocol === 'https'
    ? URL_HEADER_KEYS
    : SCHEME_HEADER_KEYS;
};

const parseJsonObject = (content: string): JsonObject | null => {
  try {
    const parsed: unknown = JSON.parse(content);
    return isJsonValue(parsed) && isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isValidEditedHeader = (value: string): boolean => {
  const normalized = value.trim().replace(/\\\//g, '/');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)) return false;

  try {
    const url = new URL(normalized);
    return `${url.protocol}//${url.host}${url.pathname}` === normalized;
  } catch {
    return false;
  }
};

export const createSchemeViewerDecodeProjection = (
  content: string,
  source: string,
): SchemeViewerDecodeProjection => {
  const value = parseJsonObject(content);
  const header = getUrlResourceSchemaFromUrl(source);
  const headerKeys = getHeaderKeys(source);
  if (!value || !header || !headerKeys) return { content };

  const headerKey = headerKeys.find(key => !Object.hasOwn(value, key));
  if (!headerKey) return { content };

  return {
    content: JSON.stringify({ [headerKey]: header, ...value }, null, 2),
    headerKey,
  };
};

export const restoreSchemeViewerDecodeProjection = (
  content: string,
  source: string,
  headerKey?: string,
): SchemeViewerRestoredContent => {
  if (!headerKey) return { content, source };

  const value = parseJsonObject(content);
  if (!value) return { content, source };

  const editedHeader = value[headerKey];
  if (typeof editedHeader === 'string' && !isValidEditedHeader(editedHeader)) {
    const restoredValue = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== headerKey),
    ) as JsonObject;
    return {
      content: JSON.stringify(restoredValue, null, 2),
      source,
    };
  }

  const restored = removeSchemeDisplayHeader(value, source, headerKey);
  return {
    content: JSON.stringify(restored.value, null, 2),
    source: restored.source,
  };
};

export const createSchemeViewerEncodingInput = (
  content: string,
  source: string,
  layers: DecodeLayer[],
  headerKey?: string,
): SchemeViewerEncodingInput => {
  const restored = restoreSchemeViewerDecodeProjection(content, source, headerKey);
  if (restored.source === source) {
    return { content: restored.content, layers };
  }

  let hasUpdatedUrlLayer = false;
  const updatedLayers = layers.map(layer => {
    if (hasUpdatedUrlLayer || layer.type !== 'url') return layer;

    hasUpdatedUrlLayer = true;
    return { ...layer, before: restored.source };
  });

  return { content: restored.content, layers: updatedLayers };
};

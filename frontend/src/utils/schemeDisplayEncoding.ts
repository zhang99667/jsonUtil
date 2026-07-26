import type { JsonValue } from '../types';
import {
  setJsonPointerValue,
  tryGetJsonPointerValue,
} from './jsonPointer';
import { removeSchemeDisplayHeader } from './schemeDisplayHeader';
import { tryParseJsonValue } from './jsonValueGuards';
import type {
  DecodeLayer,
  SchemeDisplayHeaderRecord,
} from './schemeTypes';
import { normalizeJsonUrlEscapes } from './schemeUrlShapes';
import { getUrlResourceSchemaFromUrl } from './schemeUrlResourceSchema';

export type SchemeDisplayEncoding =
  | {
      safe: true;
      content: string;
      layers: DecodeLayer[];
    }
  | {
      safe: false;
    };

type EncodeSchemeDisplayValue = (
  value: JsonValue,
  layers: DecodeLayer[],
) => string;

const replaceRootSchemeLayerSource = (
  layers: DecodeLayer[],
  originalSource: string,
  editedSource: string,
): DecodeLayer[] => {
  const normalizedSource = normalizeJsonUrlEscapes(originalSource);
  const matchingIndex = layers.findIndex(layer => (
    layer.type === 'url' && normalizeJsonUrlEscapes(layer.before) === normalizedSource
  ));
  const urlLayerIndex = matchingIndex >= 0
    ? matchingIndex
    : layers.findIndex(layer => layer.type === 'url');
  if (urlLayerIndex < 0 || layers[urlLayerIndex].before === editedSource) return layers;

  return layers.map((layer, index) => (
    index === urlLayerIndex ? { ...layer, before: editedSource } : layer
  ));
};

export const prepareSchemeDisplayEncoding = (
  content: string,
  layers: DecodeLayer[],
  displayHeaders: SchemeDisplayHeaderRecord[],
  encodeValue: EncodeSchemeDisplayValue,
): SchemeDisplayEncoding => {
  let root = tryParseJsonValue(content);
  if (root === undefined) return { safe: false };

  let encodingLayers = layers;
  const sortedHeaders = [...displayHeaders].sort((left, right) => (
    right.path.split('/').length - left.path.split('/').length
  ));

  for (const header of sortedHeaders) {
    const currentValue = tryGetJsonPointerValue<JsonValue>(root, header.path);
    if (!currentValue || Array.isArray(currentValue) || typeof currentValue !== 'object') {
      return { safe: false };
    }

    const editedHeader = currentValue[header.headerKey];
    if (
      typeof editedHeader !== 'string'
      || getUrlResourceSchemaFromUrl(editedHeader) !== normalizeJsonUrlEscapes(editedHeader.trim())
    ) {
      return { safe: false };
    }

    const currentSnapshot = JSON.stringify(currentValue);
    const belongsToOtherHeader = (
      editedHeader !== header.header
      && displayHeaders.some(other => other !== header && other.header === editedHeader)
    );
    const belongsToOtherSnapshot = (
      header.displayValueSnapshot !== undefined
      && currentSnapshot !== header.displayValueSnapshot
      && displayHeaders.some(other => (
        other !== header
        && other.displayValueSnapshot !== undefined
        && other.displayValueSnapshot === currentSnapshot
      ))
    );
    if (belongsToOtherHeader || belongsToOtherSnapshot) {
      return { safe: false };
    }

    const schemeEncoding = removeSchemeDisplayHeader(
      currentValue,
      header.source,
      header.headerKey,
    );
    if (header.path === '') {
      root = schemeEncoding.value;
      encodingLayers = replaceRootSchemeLayerSource(
        encodingLayers,
        header.source,
        schemeEncoding.source,
      );
      continue;
    }

    const nestedLayers = replaceRootSchemeLayerSource(
      header.layers,
      header.source,
      schemeEncoding.source,
    );
    try {
      root = setJsonPointerValue(
        root,
        header.path,
        encodeValue(schemeEncoding.value, nestedLayers),
      ) as JsonValue;
    } catch {
      return { safe: false };
    }
  }

  return {
    content: JSON.stringify(root),
    layers: encodingLayers,
    safe: true,
  };
};

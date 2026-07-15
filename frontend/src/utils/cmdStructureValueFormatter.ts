import type { JsonObject, JsonValue } from '../types';
import { isJsonObject } from './jsonValueGuards';

const CMD_STRUCTURE_VALUE_PREVIEW_LIMIT = 160;

const normalizeCmdStructureValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(normalizeCmdStructureValue);
  if (!isJsonObject(value)) return value;

  return Object.keys(value).sort().reduce<JsonObject>((result, key) => {
    result[key] = normalizeCmdStructureValue(value[key]);
    return result;
  }, {});
};

export const stringifyCmdStructureValue = (value: JsonValue): string | undefined => {
  if (!isJsonObject(value) && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return JSON.stringify(normalizeCmdStructureValue(value));
};

export const formatCmdStructureValuePreview = (value: JsonValue): string => {
  const text = stringifyCmdStructureValue(value) || String(value);
  return text.length > CMD_STRUCTURE_VALUE_PREVIEW_LIMIT
    ? `${text.slice(0, CMD_STRUCTURE_VALUE_PREVIEW_LIMIT)}...`
    : text;
};

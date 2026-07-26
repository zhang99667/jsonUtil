import type { JsonValue } from '../types';
import { sortJsonKeys } from './jsonKeySort';
import { stringifyJsonValue } from './jsonValueStringify';

const CMD_STRUCTURE_VALUE_PREVIEW_LIMIT = 160;

export const stringifyCmdStructureValue = (value: JsonValue): string | undefined => (
  stringifyJsonValue(sortJsonKeys(value))
);

export const formatCmdStructureValuePreview = (value: JsonValue): string => {
  const text = stringifyCmdStructureValue(value) || String(value);
  return text.length > CMD_STRUCTURE_VALUE_PREVIEW_LIMIT
    ? `${text.slice(0, CMD_STRUCTURE_VALUE_PREVIEW_LIMIT)}...`
    : text;
};

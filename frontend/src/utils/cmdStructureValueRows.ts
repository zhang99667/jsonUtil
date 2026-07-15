import type { JsonValue } from '../types';
import type { CmdStructureValueRow } from './cmdStructureValueDiffTypes';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { isJsonObject } from './jsonValueGuards';

export const collectCmdStructureValueRows = (
  value: JsonValue,
  path = '$'
): Map<string, CmdStructureValueRow> => {
  const rows = new Map<string, CmdStructureValueRow>();

  if (Array.isArray(value)) {
    rows.set(path, { type: 'array', value });
    value.forEach((item, index) => {
      collectCmdStructureValueRows(item, appendJsonPathIndex(path, index)).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  if (isJsonObject(value)) {
    rows.set(path, { type: 'object', value });
    Object.entries(value).forEach(([key, item]) => {
      collectCmdStructureValueRows(item, appendJsonPathKey(path, key)).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  rows.set(path, {
    type: value === null ? 'null' : typeof value,
    value,
  });
  return rows;
};

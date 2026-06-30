import type { JsonValue } from '../types';
import type { CmdStructureValueRow } from './cmdStructureValueDiffTypes';

interface JsonObject {
  [key: string]: JsonValue;
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

export const collectCmdStructureValueRows = (
  value: JsonValue,
  path = '$'
): Map<string, CmdStructureValueRow> => {
  const rows = new Map<string, CmdStructureValueRow>();

  if (Array.isArray(value)) {
    rows.set(path, { type: 'array', value });
    value.forEach((item, index) => {
      collectCmdStructureValueRows(item, `${path}[${index}]`).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  if (isRecord(value)) {
    rows.set(path, { type: 'object', value });
    Object.entries(value).forEach(([key, item]) => {
      collectCmdStructureValueRows(item, appendPathKey(path, key)).forEach((row, rowPath) => {
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

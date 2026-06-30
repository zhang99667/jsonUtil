import type { JsonValue } from '../types';
import { stringifyCmdStructureValue } from './cmdStructureDiffFormatter';
import { normalizeRawSourceString } from './cmdStructureRawSource';

interface JsonObject {
  [key: string]: JsonValue;
}

interface CmdStructureValueRow {
  type: string;
  value: JsonValue;
}

export interface CmdStructureValueDiff {
  path: string;
  actual: JsonValue;
  expected: JsonValue;
}

export interface CmdStructureValueComparison {
  missingPaths: string[];
  extraPaths: string[];
  valueDiffs: CmdStructureValueDiff[];
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const collectValueMap = (value: JsonValue, path = '$'): Map<string, CmdStructureValueRow> => {
  const rows = new Map<string, CmdStructureValueRow>();

  if (Array.isArray(value)) {
    rows.set(path, { type: 'array', value });
    value.forEach((item, index) => {
      collectValueMap(item, `${path}[${index}]`).forEach((row, rowPath) => {
        rows.set(rowPath, row);
      });
    });
    return rows;
  }

  if (isRecord(value)) {
    rows.set(path, { type: 'object', value });
    Object.entries(value).forEach(([key, item]) => {
      collectValueMap(item, appendPathKey(path, key)).forEach((row, rowPath) => {
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

const getStructuredSourceValue = (value: JsonValue): string | undefined => (
  isRecord(value) && typeof value.source === 'string'
    ? normalizeRawSourceString(value.source)
    : undefined
);

const isStructuredSourceEquivalent = (actual: JsonValue, expected: JsonValue): boolean => {
  if (typeof actual === 'string') {
    return getStructuredSourceValue(expected) === normalizeRawSourceString(actual);
  }

  if (typeof expected === 'string') {
    return getStructuredSourceValue(actual) === normalizeRawSourceString(expected);
  }

  return false;
};

export const compareCmdStructureValues = (
  actual: JsonValue,
  expected: JsonValue
): CmdStructureValueComparison => {
  const actualRows = collectValueMap(actual);
  const expectedRows = collectValueMap(expected);
  const missingPaths: string[] = [];
  const extraPaths: string[] = [];
  const valueDiffs: CmdStructureValueDiff[] = [];
  const addValueDiff = (path: string, actualRow: CmdStructureValueRow, expectedRow: CmdStructureValueRow) => {
    valueDiffs.push({ path, actual: actualRow.value, expected: expectedRow.value });
  };

  expectedRows.forEach((expectedRow, path) => {
    const actualRow = actualRows.get(path);
    if (!actualRow) {
      missingPaths.push(path);
      return;
    }

    if (actualRow.type !== expectedRow.type) {
      if (isStructuredSourceEquivalent(actualRow.value, expectedRow.value)) return;

      addValueDiff(path, actualRow, expectedRow);
      return;
    }

    if (actualRow.type === 'object' || actualRow.type === 'array') {
      return;
    }

    if (stringifyCmdStructureValue(actualRow.value) !== stringifyCmdStructureValue(expectedRow.value)) {
      addValueDiff(path, actualRow, expectedRow);
    }
  });

  actualRows.forEach((_actualRow, path) => {
    if (!expectedRows.has(path)) {
      extraPaths.push(path);
    }
  });

  return { missingPaths, extraPaths, valueDiffs };
};

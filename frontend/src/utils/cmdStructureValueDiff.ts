import type { JsonValue } from '../types';
import { isStructuredSourceEquivalent } from './cmdStructureSourceEquivalence';
import { stringifyCmdStructureValue } from './cmdStructureDiffFormatter';
import type {
  CmdStructureValueComparison,
  CmdStructureValueDiff,
  CmdStructureValueRow,
} from './cmdStructureValueDiffTypes';
import { collectCmdStructureValueRows } from './cmdStructureValueRows';

export type {
  CmdStructureValueComparison,
  CmdStructureValueDiff,
} from './cmdStructureValueDiffTypes';

export const compareCmdStructureValues = (
  actual: JsonValue,
  expected: JsonValue
): CmdStructureValueComparison => {
  const actualRows = collectCmdStructureValueRows(actual);
  const expectedRows = collectCmdStructureValueRows(expected);
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

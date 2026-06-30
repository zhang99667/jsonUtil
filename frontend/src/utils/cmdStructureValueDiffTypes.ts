import type { JsonValue } from '../types';

export interface CmdStructureValueRow {
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

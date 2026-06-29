import type { JsonValue } from '../types';
import type { AppVersionMetadata } from './appVersion';
import type { CmdStructureCandidateInput } from './cmdStructureCandidates';
import {
  stringifyCmdStructureValue,
} from './cmdStructureDiffFormatter';
import { countCmdStructurePathBranches } from './cmdStructurePathBranches';
import {
  findRawResponseCmdStructure,
  normalizeRawSourceString,
} from './cmdStructureRawSource';
import type { NormalizedCmdStructure } from './cmdStructureRawSource';

export {
  collectActualCmdStructureCandidates,
} from './cmdStructureCandidates';
export type {
  CmdStructureCandidateInput,
} from './cmdStructureCandidates';
export {
  formatCmdStructureDiff,
} from './cmdStructureDiffFormatter';
export {
  countCmdStructurePathBranches,
} from './cmdStructurePathBranches';

interface JsonObject {
  [key: string]: JsonValue;
}

interface ValueRow {
  type: string;
  value: JsonValue;
}

export interface CmdStructureValueDiff {
  path: string;
  actual: JsonValue;
  expected: JsonValue;
}

export interface CmdStructureDiff {
  schemaDiff: { actual?: string; expected?: string } | null;
  sourceDiff: { actual?: string; expected?: string } | null;
  missingPaths: string[];
  extraPaths: string[];
  ignoredExtraPaths: string[];
  valueDiffs: CmdStructureValueDiff[];
  hasDifferences: boolean;
}

export interface CmdStructureDiffOptions {
  ignoreExtraPaths?: boolean;
}

export interface CmdStructureDiffContext {
  path?: string;
  sourceLabel?: string;
  tool?: Partial<AppVersionMetadata>;
  toolVersionLabel?: string;
  modeLabel?: string;
}

export interface RankedCmdStructureCandidate extends Omit<CmdStructureCandidateInput, 'actual'> {
  diff: CmdStructureDiff;
  score: number;
  isExactMatch: boolean;
}

export interface RankCmdStructureCandidatesOptions extends CmdStructureDiffOptions {
  limit?: number;
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const parseJsonCandidate = (candidate: string): JsonValue | undefined => {
  try {
    return JSON.parse(candidate) as JsonValue;
  } catch {
    return undefined;
  }
};

const normalizeCmdHandlerTreeLine = (line: string): string => (
  line.trim().replace(/([\[{])\s*\d+\s+items?\s*$/i, '$1')
);

const findCmdHandlerTreeStartIndex = (lines: string[]): number => {
  const wrappedIndex = lines.findIndex(line => /"(解析结果|result)"\s*:/.test(line));
  if (wrappedIndex >= 0) return wrappedIndex;

  return lines.findIndex(line => /"(cmdSchema|cmdParams|source)"\s*:/.test(line));
};

const isCmdHandlerTreeContentLine = (line: string): boolean => (
  /^"[^"]+"\s*:/.test(line) || /^[}\]]$/.test(line) || /^[\[{]$/.test(line)
);

const parseCmdHandlerTreeText = (text: string): JsonValue | undefined => {
  if (!/cmd解析|\bitems?\b|"(cmdSchema|cmdParams)"\s*:/i.test(text)) return undefined;

  const lines = text.split(/\r?\n/);
  const startIndex = findCmdHandlerTreeStartIndex(lines);
  if (startIndex < 0) return undefined;

  const relevantLines: string[] = [];
  let depth = 0;
  let hasOpenedContainer = false;
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = normalizeCmdHandlerTreeLine(lines[index]);
    if (!line || /^cmd解析$/i.test(line) || /^\d+\s+items?$/i.test(line)) continue;
    if (!isCmdHandlerTreeContentLine(line)) {
      if (relevantLines.length > 0 && depth <= 0) break;
      continue;
    }

    relevantLines.push(line);
    if (/[\[{]\s*$/.test(line)) {
      depth += 1;
      hasOpenedContainer = true;
    }
    if (/^[}\]]$/.test(line)) depth -= 1;
    if (relevantLines.length > 0 && depth <= 0 && hasOpenedContainer) break;
  }

  if (relevantLines.length === 0) return undefined;

  const wrappedLines = /^[\[{]/.test(relevantLines[0])
    ? relevantLines
    : ['{', ...relevantLines, '}'];
  const jsonText = wrappedLines.map((line, index) => {
    const nextLine = wrappedLines[index + 1];
    if (!nextLine || /[\[{]\s*$/.test(line) || /^[}\]]$/.test(nextLine)) return line;
    return `${line},`;
  }).join('\n');

  return parseJsonCandidate(jsonText);
};

const extractBalancedJsonFrom = (text: string, start: number): string | null => {
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  const stack: string[] = [];
  let isInString = false;
  let isEscaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];

    if (isInString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        isInString = false;
      }
      continue;
    }

    if (char === '"') {
      isInString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char === '{' ? '}' : ']');
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return text.slice(start, index + 1);
    }
  }

  return null;
};

const extractBalancedJsonTexts = (text: string): string[] => {
  const candidates: string[] = [];

  for (const open of ['{', '[']) {
    let start = text.indexOf(open);
    while (start >= 0) {
      const candidate = extractBalancedJsonFrom(text, start);
      if (candidate && parseJsonCandidate(candidate) !== undefined) {
        candidates.push(candidate);
      }
      start = text.indexOf(open, start + 1);
    }
  }

  return candidates;
};

const parseCmdStructureJsonCandidate = (text: string, depth = 0): JsonValue | undefined => {
  if (depth > 1) return undefined;

  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const parsed = parseJsonCandidate(trimmed);
  if (parsed !== undefined) {
    if (typeof parsed === 'string') {
      const nested = parseCmdStructureJsonCandidate(parsed, depth + 1);
      return nested ?? parsed;
    }
    return parsed;
  }

  const treeParsed = parseCmdHandlerTreeText(trimmed);
  if (treeParsed !== undefined) return treeParsed;

  const balancedJsonCandidates = extractBalancedJsonTexts(trimmed)
    .filter(candidate => candidate !== trimmed);
  const recognizableCandidate = balancedJsonCandidates.find(candidate => {
    const candidateValue = parseCmdStructureJsonCandidate(candidate, depth + 1);
    return candidateValue !== undefined && hasRecognizableCmdStructure(candidateValue);
  });
  const balancedJson = recognizableCandidate ?? balancedJsonCandidates[0];
  if (!balancedJson) return undefined;

  return parseCmdStructureJsonCandidate(balancedJson, depth + 1);
};

export const parseCmdStructureJson = (text: string, label = '输入'): JsonValue => {
  const parsed = parseCmdStructureJsonCandidate(text);
  if (parsed !== undefined) return parsed;

  try {
    JSON.parse(text);
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : String(error);
    throw new Error(`${label}不是有效 JSON: ${detail}`);
  }

  throw new Error(`${label}不是有效 JSON`);
};

const appendPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const findCmdStructure = (value: JsonValue): NormalizedCmdStructure | null => {
  if (!isRecord(value)) return null;

  if (isRecord(value.result)) {
    const result = findCmdStructure(value.result);
    if (result) return result;
  }

  if (isRecord(value.data)) {
    const result = findCmdStructure(value.data);
    if (result) return result;
  }

  if (isRecord(value['解析结果'])) {
    const result = findCmdStructure(value['解析结果']);
    if (result) return result;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'cmdParams')) {
    return {
      cmdSchema: typeof value.cmdSchema === 'string' ? value.cmdSchema : undefined,
      cmdParams: value.cmdParams,
      source: typeof value.source === 'string' ? value.source : undefined,
    };
  }

  return null;
};

export const hasRecognizableCmdStructure = (value: JsonValue): boolean => (
  Boolean(findCmdStructure(value) || findRawResponseCmdStructure(value))
);

export const normalizeCmdStructure = (value: JsonValue): NormalizedCmdStructure => {
  const structure = findCmdStructure(value);
  if (structure) return structure;

  const rawResponseStructure = findRawResponseCmdStructure(value);
  if (rawResponseStructure) return rawResponseStructure;

  return {
    cmdParams: value,
  };
};

const collectValueMap = (value: JsonValue, path = '$'): Map<string, ValueRow> => {
  const rows = new Map<string, ValueRow>();

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

const compareRows = (
  actualRows: Map<string, ValueRow>,
  expectedRows: Map<string, ValueRow>
): Pick<CmdStructureDiff, 'missingPaths' | 'extraPaths' | 'valueDiffs'> => {
  const missingPaths: string[] = [];
  const extraPaths: string[] = [];
  const valueDiffs: CmdStructureValueDiff[] = [];

  expectedRows.forEach((expectedRow, path) => {
    const actualRow = actualRows.get(path);
    if (!actualRow) {
      missingPaths.push(path);
      return;
    }

    if (actualRow.type !== expectedRow.type) {
      if (isStructuredSourceEquivalent(actualRow.value, expectedRow.value)) return;

      valueDiffs.push({
        path,
        actual: actualRow.value,
        expected: expectedRow.value,
      });
      return;
    }

    if (actualRow.type === 'object' || actualRow.type === 'array') {
      return;
    }

    if (stringifyCmdStructureValue(actualRow.value) !== stringifyCmdStructureValue(expectedRow.value)) {
      valueDiffs.push({
        path,
        actual: actualRow.value,
        expected: expectedRow.value,
      });
    }
  });

  actualRows.forEach((_actualRow, path) => {
    if (!expectedRows.has(path)) {
      extraPaths.push(path);
    }
  });

  return { missingPaths, extraPaths, valueDiffs };
};

export const diffCmdStructures = (
  actualInput: JsonValue,
  expectedInput: JsonValue,
  options: CmdStructureDiffOptions = {}
): CmdStructureDiff => {
  const actual = normalizeCmdStructure(actualInput);
  const expected = normalizeCmdStructure(expectedInput);
  const schemaDiff = actual.cmdSchema !== expected.cmdSchema
    ? { actual: actual.cmdSchema, expected: expected.cmdSchema }
    : null;
  const sourceDiff = expected.source !== undefined && actual.source !== expected.source
    ? { actual: actual.source, expected: expected.source }
    : null;
  const paramDiff = compareRows(
    collectValueMap(actual.cmdParams),
    collectValueMap(expected.cmdParams)
  );
  const extraPaths = options.ignoreExtraPaths ? [] : paramDiff.extraPaths;

  return {
    schemaDiff,
    sourceDiff,
    missingPaths: paramDiff.missingPaths,
    extraPaths,
    ignoredExtraPaths: options.ignoreExtraPaths ? paramDiff.extraPaths : [],
    valueDiffs: paramDiff.valueDiffs,
    hasDifferences: Boolean(
      schemaDiff ||
      sourceDiff ||
      paramDiff.missingPaths.length ||
      extraPaths.length ||
      paramDiff.valueDiffs.length
    ),
  };
};

const getCmdStructureCandidateScore = (diff: CmdStructureDiff): number => (
  (diff.schemaDiff ? 10000 : 0) +
  (diff.sourceDiff ? 5000 : 0) +
  countCmdStructurePathBranches(diff.missingPaths) * 100 +
  diff.valueDiffs.length * 50 +
  countCmdStructurePathBranches(diff.extraPaths) * 10 +
  countCmdStructurePathBranches(diff.ignoredExtraPaths)
);

export const rankCmdStructureCandidates = (
  candidates: CmdStructureCandidateInput[],
  expectedInput: JsonValue,
  options: RankCmdStructureCandidatesOptions = {}
): RankedCmdStructureCandidate[] => {
  const rankedCandidates = candidates.map((candidate, index) => {
    const diff = diffCmdStructures(candidate.actual, expectedInput, {
      ignoreExtraPaths: options.ignoreExtraPaths,
    });
    return {
      id: candidate.id,
      label: candidate.label,
      sourceLabel: candidate.sourceLabel,
      commandSchema: candidate.commandSchema,
      diff,
      score: getCmdStructureCandidateScore(diff),
      isExactMatch: !diff.hasDifferences,
      index,
    };
  });

  return rankedCandidates
    .sort((left, right) => (
      left.score - right.score ||
      countCmdStructurePathBranches(left.diff.missingPaths) - countCmdStructurePathBranches(right.diff.missingPaths) ||
      left.diff.valueDiffs.length - right.diff.valueDiffs.length ||
      left.index - right.index
    ))
    .slice(0, options.limit ?? 3)
    .map(({ index: _index, ...candidate }) => candidate);
};

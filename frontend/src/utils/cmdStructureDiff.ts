import type { JsonValue } from '../types';
import type { AppVersionMetadata } from './appVersion';

interface JsonObject {
  [key: string]: JsonValue;
}

interface NormalizedCmdStructure {
  cmdSchema?: string;
  cmdParams: JsonValue;
  source?: string;
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

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

export const parseCmdStructureJson = (text: string, label = '输入'): JsonValue => {
  try {
    return JSON.parse(text) as JsonValue;
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : String(error);
    throw new Error(`${label}不是有效 JSON: ${detail}`);
  }
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

  if (Object.prototype.hasOwnProperty.call(value, 'cmdParams')) {
    return {
      cmdSchema: typeof value.cmdSchema === 'string' ? value.cmdSchema : undefined,
      cmdParams: value.cmdParams,
      source: typeof value.source === 'string' ? value.source : undefined,
    };
  }

  return null;
};

export const normalizeCmdStructure = (value: JsonValue): NormalizedCmdStructure => {
  const structure = findCmdStructure(value);
  if (structure) return structure;

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

const stableStringify = (value: JsonValue): string | undefined => {
  if (!isRecord(value) && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  const normalize = (item: JsonValue): JsonValue => {
    if (Array.isArray(item)) return item.map(normalize);
    if (!isRecord(item)) return item;

    return Object.keys(item).sort().reduce<JsonObject>((result, key) => {
      result[key] = normalize(item[key]);
      return result;
    }, {});
  };

  return JSON.stringify(normalize(value));
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

    if (stableStringify(actualRow.value) !== stableStringify(expectedRow.value)) {
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

const formatValue = (value: JsonValue): string => {
  const text = stableStringify(value) || String(value);
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
};

const formatSourceValue = (value?: string): string => {
  if (!value) return '(空)';

  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
};

const getContextToolVersionLabel = (context: CmdStructureDiffContext): string => {
  const explicitVersionLabel = context.toolVersionLabel?.trim();
  if (explicitVersionLabel) return explicitVersionLabel;

  const versionLabel = context.tool?.versionLabel?.trim();
  if (versionLabel) return versionLabel;

  const version = context.tool?.version?.trim();
  if (!version) return '';

  return version.startsWith('v') ? version : `v${version}`;
};

const appendDiffContextLines = (
  lines: string[],
  context: CmdStructureDiffContext
) => {
  const toolVersionLabel = getContextToolVersionLabel(context);
  if (toolVersionLabel) lines.push(`工具版本: ${toolVersionLabel}`);
  if (context.path) lines.push(`对比路径: ${context.path}`);
  if (context.sourceLabel) lines.push(`业务字段: ${context.sourceLabel}`);
  if (context.modeLabel) lines.push(`对比模式: ${context.modeLabel}`);
};

export const formatCmdStructureDiff = (
  diff: CmdStructureDiff,
  context: CmdStructureDiffContext = {}
): string => {
  const lines = ['CMD 结构差异报告'];
  appendDiffContextLines(lines, context);

  if (!diff.hasDifferences) {
    lines.push('- 结构一致');
    if (diff.ignoredExtraPaths.length > 0) {
      lines.push(`- 已忽略 actual 额外路径 ${diff.ignoredExtraPaths.length} 个:`);
      diff.ignoredExtraPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
      if (diff.ignoredExtraPaths.length > 20) lines.push(`  - ... 还有 ${diff.ignoredExtraPaths.length - 20} 个`);
    }
    return lines.join('\n');
  }

  if (diff.schemaDiff) {
    lines.push(`- cmdSchema 不一致: actual=${diff.schemaDiff.actual || '(空)'} expected=${diff.schemaDiff.expected || '(空)'}`);
  }

  if (diff.sourceDiff) {
    lines.push('- source 不一致');
    lines.push(`  actual: ${formatSourceValue(diff.sourceDiff.actual)}`);
    lines.push(`  expected: ${formatSourceValue(diff.sourceDiff.expected)}`);
  }

  if (diff.missingPaths.length > 0) {
    lines.push(`- 缺失路径 ${diff.missingPaths.length} 个:`);
    diff.missingPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
    if (diff.missingPaths.length > 20) lines.push(`  - ... 还有 ${diff.missingPaths.length - 20} 个`);
  }

  if (diff.extraPaths.length > 0) {
    lines.push(`- 额外路径 ${diff.extraPaths.length} 个:`);
    diff.extraPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
    if (diff.extraPaths.length > 20) lines.push(`  - ... 还有 ${diff.extraPaths.length - 20} 个`);
  }

  if (diff.ignoredExtraPaths.length > 0) {
    lines.push(`- 已忽略 actual 额外路径 ${diff.ignoredExtraPaths.length} 个:`);
    diff.ignoredExtraPaths.slice(0, 20).forEach(path => lines.push(`  - ${path}`));
    if (diff.ignoredExtraPaths.length > 20) lines.push(`  - ... 还有 ${diff.ignoredExtraPaths.length - 20} 个`);
  }

  if (diff.valueDiffs.length > 0) {
    lines.push(`- 值不一致 ${diff.valueDiffs.length} 个:`);
    diff.valueDiffs.slice(0, 20).forEach(item => {
      lines.push(`  - ${item.path}: actual=${formatValue(item.actual)} expected=${formatValue(item.expected)}`);
    });
    if (diff.valueDiffs.length > 20) lines.push(`  - ... 还有 ${diff.valueDiffs.length - 20} 个`);
  }

  return lines.join('\n');
};

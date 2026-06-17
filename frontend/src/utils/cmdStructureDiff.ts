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

interface RawCmdCandidate {
  source: string;
  priority: number;
  depth: number;
  order: number;
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

const RAW_CMD_FIELD_PRIORITIES = new Map<string, number>([
  ['$', 100],
  ['scheme', 100],
  ['cmd', 100],
  ['schema', 98],
  ['action_cmd', 96],
  ['actioncmd', 96],
  ['command', 94],
  ['convert_cmd', 92],
  ['panel_cmd', 90],
  ['webpanel_cmd', 90],
  ['panel_scheme', 88],
  ['stay_cmd', 86],
  ['reward_cmd', 86],
  ['strong_guide_cmd', 86],
  ['button_scheme', 82],
  ['bottom_button_scheme', 82],
  ['button_cmd', 78],
  ['url', 30],
  ['page_url', 28],
  ['lp_real_url', 28],
  ['click_url', 24],
  ['video_url', 10],
]);
const RAW_CMD_DECODE_MAX_DEPTH = 10;
const URL_LIKE_RE = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;
const QUERY_PAIR_RE = /^\??[A-Za-z0-9_.\-[\]%]+=/;
const STRUCTURED_FIELD_RE = /(^|[_-])(cmd|command|schema|scheme|url|uri|link|params?|policy|info)$/i;
const STRUCTURED_CAMEL_FIELD_RE = /[a-z0-9](Cmd|Command|Schema|Scheme|URL|Url|URI|Uri|Link|Params?|Policy|Info)$/;

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

const normalizeRawSourceString = (value: string): string => value.trim().replace(/\\\//g, '/');

const getRawCmdFieldPriority = (key: string): number => {
  const lowerKey = key.trim().toLowerCase();
  return RAW_CMD_FIELD_PRIORITIES.get(key) ??
    RAW_CMD_FIELD_PRIORITIES.get(lowerKey) ??
    (/(_cmd|cmd|_scheme|scheme)$/i.test(key) ? 70 : 0);
};

const looksLikeRawCmdSource = (value: string): boolean => {
  const normalized = normalizeRawSourceString(value);
  if (!normalized || /^__[^_]+__$/.test(normalized)) return false;

  if (URL_LIKE_RE.test(normalized) || QUERY_PAIR_RE.test(normalized)) return true;

  const decoded = safeDecodeURIComponent(normalized);
  return decoded !== normalized && (URL_LIKE_RE.test(decoded) || QUERY_PAIR_RE.test(decoded));
};

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

const parseCmdHandlerTreeText = (text: string): JsonValue | undefined => {
  if (!/cmd解析|\bitems?\b/i.test(text)) return undefined;

  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex(line => /"(解析结果|result)"\s*:/.test(line));
  if (startIndex < 0) return undefined;

  const relevantLines: string[] = [];
  let depth = 0;
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = normalizeCmdHandlerTreeLine(lines[index]);
    if (!line || /^cmd解析$/i.test(line) || /^\d+\s+items?$/i.test(line)) continue;

    relevantLines.push(line);
    if (/[\[{]\s*$/.test(line)) depth += 1;
    if (/^[}\]]$/.test(line)) depth -= 1;
    if (relevantLines.length > 0 && depth <= 0) break;
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

const extractBalancedJsonText = (text: string): string | null => {
  for (const open of ['{', '[']) {
    let start = text.indexOf(open);
    while (start >= 0) {
      const candidate = extractBalancedJsonFrom(text, start);
      if (candidate && parseJsonCandidate(candidate) !== undefined) return candidate;
      start = text.indexOf(open, start + 1);
    }
  }

  return null;
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

  const balancedJson = extractBalancedJsonText(trimmed);
  if (!balancedJson || balancedJson === trimmed) return undefined;

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

const collectRawCmdCandidates = (
  value: JsonValue,
  candidates: RawCmdCandidate[],
  key = '$',
  depth = 0,
  orderRef = { value: 0 }
) => {
  if (typeof value === 'string') {
    const priority = getRawCmdFieldPriority(key);
    if (priority > 0 && looksLikeRawCmdSource(value)) {
      candidates.push({
        source: value,
        priority,
        depth,
        order: orderRef.value,
      });
      orderRef.value += 1;
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectRawCmdCandidates(item, candidates, key, depth + 1, orderRef));
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([childKey, item]) => {
    collectRawCmdCandidates(item, candidates, childKey, depth + 1, orderRef);
  });
};

const isStructuredCmdField = (key: string): boolean => {
  const lowerKey = key.trim().toLowerCase();
  return RAW_CMD_FIELD_PRIORITIES.has(key) ||
    RAW_CMD_FIELD_PRIORITIES.has(lowerKey) ||
    STRUCTURED_FIELD_RE.test(key) ||
    STRUCTURED_CAMEL_FIELD_RE.test(key);
};

const getUrlCmdSchema = (source: string): string | undefined => {
  if (!URL_LIKE_RE.test(source)) return undefined;

  try {
    const url = new URL(source);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return source.split(/[?#]/)[0] || undefined;
  }
};

const toJsonValue = (value: unknown): JsonValue => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;

  if (Array.isArray(value)) return value.map(toJsonValue);

  if (Boolean(value) && typeof value === 'object') {
    const result: JsonObject = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = toJsonValue(item);
    });
    return result;
  }

  return String(value);
};

const tryParseJsonString = (value: string): JsonValue | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^[{["]/.test(trimmed)) return undefined;

  const parsed = parseJsonCandidate(trimmed);
  if (parsed !== undefined) return parsed;

  const decoded = safeDecodeURIComponent(trimmed);
  if (decoded !== trimmed) {
    return parseJsonCandidate(decoded);
  }

  return undefined;
};

const parseFastCmdValue = (value: string, key: string, depth: number): JsonValue => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return value;

  const normalized = normalizeRawSourceString(value);
  const parsedJson = tryParseJsonString(normalized);
  if (parsedJson !== undefined) {
    return parseFastStructuredValue(parsedJson, key, depth + 1);
  }

  const decoded = URL_LIKE_RE.test(normalized) ? normalized : safeDecodeURIComponent(normalized);
  if (decoded !== normalized) {
    const decodedJson = tryParseJsonString(decoded);
    if (decodedJson !== undefined) {
      return parseFastStructuredValue(decodedJson, key, depth + 1);
    }

    if (looksLikeRawCmdSource(decoded) && isStructuredCmdField(key)) {
      const decodedStructure = parseFastCmdSource(decoded, depth + 1);
      if (decodedStructure) return toJsonValue(decodedStructure);
    }
  }

  if (looksLikeRawCmdSource(normalized) && isStructuredCmdField(key)) {
    const structure = parseFastCmdSource(normalized, depth + 1);
    if (structure) return toJsonValue(structure);
  }

  return value;
};

const parseFastStructuredValue = (value: JsonValue, key: string, depth: number): JsonValue => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return value;

  if (typeof value === 'string') return parseFastCmdValue(value, key, depth);

  if (Array.isArray(value)) {
    return value.map(item => parseFastStructuredValue(item, key, depth + 1));
  }

  if (!isRecord(value)) return value;

  const result: JsonObject = {};
  Object.entries(value).forEach(([childKey, item]) => {
    result[childKey] = parseFastStructuredValue(item, childKey, depth + 1);
  });
  return result;
};

const parseFastQueryParams = (queryString: string, depth: number): JsonObject => {
  const normalizedQuery = queryString.replace(/^\?/, '');
  const params = new URLSearchParams(normalizedQuery);
  const result: JsonObject = {};

  params.forEach((value, key) => {
    const parsedValue = parseFastCmdValue(value, key, depth + 1);
    const existing = result[key];
    if (existing === undefined) {
      result[key] = parsedValue;
      return;
    }

    result[key] = Array.isArray(existing)
      ? [...existing, parsedValue]
      : [existing, parsedValue];
  });

  return result;
};

const parseFastCmdSource = (source: string, depth = 0): NormalizedCmdStructure | null => {
  if (depth > RAW_CMD_DECODE_MAX_DEPTH) return null;

  const normalized = normalizeRawSourceString(source);
  const decoded = URL_LIKE_RE.test(normalized) ? normalized : safeDecodeURIComponent(normalized);
  const schema = getUrlCmdSchema(decoded);
  if (!schema) {
    if (QUERY_PAIR_RE.test(decoded)) {
      return {
        cmdParams: parseFastQueryParams(decoded, depth + 1),
        source: decoded,
      };
    }
    return null;
  }

  let query = '';
  try {
    const url = new URL(decoded);
    query = url.search;
  } catch {
    const queryIndex = decoded.indexOf('?');
    const hashIndex = decoded.indexOf('#');
    const endIndex = hashIndex >= 0 ? hashIndex : decoded.length;
    query = queryIndex >= 0 ? decoded.slice(queryIndex + 1, endIndex) : '';
  }

  return {
    cmdSchema: schema,
    cmdParams: query ? parseFastQueryParams(query, depth + 1) : {},
    source: decoded,
  };
};

const decodeRawCmdCandidate = (source: string): NormalizedCmdStructure | null => {
  return parseFastCmdSource(source);
};

const findRawResponseCmdStructure = (value: JsonValue): NormalizedCmdStructure | null => {
  const candidates: RawCmdCandidate[] = [];
  collectRawCmdCandidates(value, candidates);
  if (candidates.length === 0) return null;

  const orderedCandidates = candidates.sort((left, right) => (
    right.priority - left.priority ||
    left.depth - right.depth ||
    left.order - right.order
  ));

  for (const candidate of orderedCandidates) {
    const structure = decodeRawCmdCandidate(candidate.source);
    if (structure) return structure;
  }

  return null;
};

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

import type {
  JsonValue,
  PathTransformRecord,
  TransformContext,
  TransformStep,
  TransformStepType,
  TransformWarning,
} from '../types';
import {
  collectSchemeInsightFields,
  formatSchemeInsightItems,
  formatCmdHandlerCompatibleResult,
  getSchemeCommandSchemaFromUrl,
} from './schemeMetadata';

export interface TransformContextSummary {
  recordCount: number;
  stepCounts: Partial<Record<TransformStepType, number>>;
  schemeCounts: {
    queryString: number;
    url: number;
    base64: number;
    nonReversible: number;
  };
  warningCount: number;
  unresolvedCount: number;
  placeholderCount: number;
}

export interface TransformReportRecord {
  path: string;
  sourceLabel?: string;
  labels: string[];
  insights: string[];
  originalValue: string;
  originalPreview: string;
  decodedPreview?: string;
  decodedSearchText?: string;
  decodedSearchPaths?: TransformReportDecodedPath[];
  decodedPaths: TransformReportDecodedPath[];
  hasMoreDecodedPaths: boolean;
  cmdStructureCopyText?: string;
  stepCount: number;
  hasNonReversibleScheme: boolean;
}

export interface TransformReportDecodedPath {
  path: string;
  preview: string;
  copyText: string;
}

export interface TransformReportWarning {
  type: TransformWarning['type'];
  path: string;
  sourceLabel?: string;
  originalValue: string;
  message: string;
  length: number;
  limit: number;
  reasonLabel: string;
  nextAction: string;
}

export interface TransformReportUnresolvedCandidate {
  path: string;
  sourceLabel?: string;
  originalValue: string;
  message: string;
  length: number;
  preview: string;
  detectedType?: string;
  reasonLabel: string;
  reasonLevel: 'info' | 'warning';
  nextAction: string;
}

export interface TransformReportRuntimePlaceholder {
  path: string;
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalValue?: string;
  sourceOriginalPreview?: string;
  value: string;
  description: string;
}

export interface TransformReportRuntimePlaceholderSourceGroup {
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalValue?: string;
  sourceOriginalPreview?: string;
  count: number;
}

export interface TransformReportRuntimePlaceholderGroup {
  value: string;
  description: string;
  count: number;
  sourceCount: number;
  sources: TransformReportRuntimePlaceholderSourceGroup[];
}

export interface TransformContextReport {
  summary: TransformContextSummary;
  summaryText?: string;
  coverage: TransformReportCoverage;
  records: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
}

export interface TransformReportCoverage {
  score: number;
  label: string;
  level: 'success' | 'info' | 'warning';
  description: string;
  items: string[];
}

export interface TransformReportView {
  records: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  filteredRecordCount: number;
  filteredWarningCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  totalRecordCount: number;
  totalWarningCount: number;
  totalUnresolvedCount: number;
  totalPlaceholderCount: number;
  isRecordTruncated: boolean;
  isWarningTruncated: boolean;
  isUnresolvedTruncated: boolean;
  isPlaceholderTruncated: boolean;
}

export interface TransformReportViewOptions {
  recordLimit?: number;
  warningLimit?: number;
  unresolvedLimit?: number;
  placeholderLimit?: number;
}

export const DEFAULT_TRANSFORM_REPORT_RECORD_LIMIT = 200;
export const DEFAULT_TRANSFORM_REPORT_WARNING_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_UNRESOLVED_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_PLACEHOLDER_LIMIT = 100;
const DEFAULT_DECODED_PATH_LIMIT = 12;
const DEFAULT_DECODED_SEARCH_TEXT_LIMIT = 20_000;
const DEFAULT_DECODED_SEARCH_PATH_LIMIT = 200;

const STEP_LABELS: Record<TransformStepType, string> = {
  json_parse: '嵌套 JSON',
  json_stringify: 'JSON 字符串化',
  scheme_decode: 'Scheme',
  unicode_decode: 'Unicode 解码',
  unicode_encode: 'Unicode 编码',
  url_decode: 'URL 解码',
  url_encode: 'URL 编码',
  base64_decode: 'Base64 解码',
  base64_encode: 'Base64 编码',
  unescape: '反转义',
  escape: '转义',
};

const incrementCount = <T extends string>(
  counts: Partial<Record<T, number>>,
  key: T
) => {
  counts[key] = (counts[key] || 0) + 1;
};

const formatOriginalPreview = (value: string, maxLength = 96): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

const formatJsonValuePreview = (value: JsonValue, maxLength = 120): string => {
  if (Array.isArray(value)) {
    return `数组 ${value.length} 项`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '对象: 空';

    const visibleKeys = keys.slice(0, 8).join(', ');
    return keys.length > 8
      ? `对象: ${visibleKeys} ... +${keys.length - 8}`
      : `对象: ${visibleKeys}`;
  }

  if (typeof value === 'string') return formatOriginalPreview(value, maxLength);
  return String(value);
};

const formatDecodedPathCopyValue = (value: JsonValue, maxLength = 8_000): string => {
  const text = typeof value === 'string'
    ? JSON.stringify(value)
    : JSON.stringify(value) ?? String(value);

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const createDecodedPathRow = (
  path: string,
  value: JsonValue,
  preview = formatJsonValuePreview(value, 80)
): DecodedPathCollectRow => ({
  path,
  preview,
  valueText: formatDecodedPathCopyValue(value),
});

const rebaseDecodedPathRow = (
  basePath: string,
  row: DecodedPathCollectRow
): TransformReportDecodedPath => {
  const path = joinJsonPath(basePath, row.path);

  return {
    path,
    preview: row.preview,
    copyText: `${path} = ${row.valueText}`,
  };
};

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const appendJsonPathIndex = (path: string, index: number): string => (
  `${path}[${index}]`
);

const joinJsonPath = (basePath: string, relativePath: string): string => (
  relativePath === '$'
    ? basePath
    : `${basePath}${relativePath.slice(1)}`
);

const getSchemeDecodedValue = (steps: TransformStep[]): JsonValue | undefined => {
  const schemeStep = [...steps].reverse().find(step => (
    step.type === 'scheme_decode' && step.decodedSchemeValue !== undefined
  ));

  return schemeStep?.decodedSchemeValue;
};

const getSchemeDecodedPreview = (steps: TransformStep[]): string | undefined => {
  const decodedValue = getSchemeDecodedValue(steps);

  return decodedValue === undefined
    ? undefined
    : formatJsonValuePreview(decodedValue);
};

const getJsonParseDecodedPreview = (record: PathTransformRecord): string | undefined => {
  if (!record.steps.some(step => step.type === 'json_parse')) return undefined;

  try {
    return formatJsonValuePreview(JSON.parse(record.originalValue) as JsonValue);
  } catch {
    return undefined;
  }
};

const getDecodedPreview = (record: PathTransformRecord): string | undefined => (
  getSchemeDecodedPreview(record.steps) || getJsonParseDecodedPreview(record)
);

const getDecodedValue = (record: PathTransformRecord): JsonValue | undefined => {
  const schemeDecodedValue = getSchemeDecodedValue(record.steps);
  if (schemeDecodedValue !== undefined) return schemeDecodedValue;
  if (!record.steps.some(step => step.type === 'json_parse')) return undefined;

  try {
    return JSON.parse(record.originalValue) as JsonValue;
  } catch {
    return undefined;
  }
};

const getRecordCommandSchema = (record: PathTransformRecord): string | undefined => {
  const schemeStep = [...record.steps].reverse().find(step => (
    step.type === 'scheme_decode' && step.originalSchemeType === 'url' && step.originalScheme
  ));

  return schemeStep?.originalScheme ? getSchemeCommandSchemaFromUrl(schemeStep.originalScheme) : undefined;
};

const getRecordCmdStructureCopyText = (record: PathTransformRecord): string | undefined => {
  const schemeStep = [...record.steps].reverse().find(step => (
    step.type === 'scheme_decode' &&
    (step.originalSchemeType === 'url' || step.originalSchemeType === 'query-string')
  ));
  if (!schemeStep) return undefined;

  const decodedValue = getSchemeDecodedValue(record.steps);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return undefined;
  }

  const result = formatCmdHandlerCompatibleResult(
    JSON.stringify(decodedValue),
    getRecordCommandSchema(record)
  );
  return result || undefined;
};

const buildRecordInsights = (record: PathTransformRecord): string[] => {
  const insights: string[] = [];
  const commandSchema = getRecordCommandSchema(record);
  if (commandSchema) {
    insights.push(`cmdSchema: ${commandSchema}`);
  }

  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return insights;
  }

  const {
    commandFields,
    extFields,
    base64SuffixFields,
  } = collectSchemeInsightFields(decodedValue);

  const nestedCmdInsight = formatSchemeInsightItems('cmd解析', commandFields);
  const extInsight = formatSchemeInsightItems('ext解析', extFields);
  const suffixInsight = formatSchemeInsightItems('Base64 后缀', base64SuffixFields, 6);

  return [
    ...insights,
    ...(nestedCmdInsight ? [nestedCmdInsight] : []),
    ...(extInsight ? [extInsight] : []),
    ...(suffixInsight ? [suffixInsight] : []),
  ];
};

const classifyUnresolvedCandidate = (
  candidate: Pick<TransformReportUnresolvedCandidate, 'detectedType' | 'message'>
): Pick<TransformReportUnresolvedCandidate, 'reasonLabel' | 'reasonLevel' | 'nextAction'> => {
  if (candidate.detectedType === 'url-encoded') {
    return {
      reasonLabel: '已解码但未结构化',
      reasonLevel: 'info',
      nextAction: '定位该字段确认是否只是普通埋点参数；如果它应继续拆成对象，可把原始值加入 CMD 解析样本。',
    };
  }

  if (candidate.detectedType === 'query-string') {
    return {
      reasonLabel: '疑似 CMD 规则缺口',
      reasonLevel: 'warning',
      nextAction: '检查分隔符、嵌套编码或参数名形态，必要时补充单字段 CMD 解析规则。',
    };
  }

  if (candidate.detectedType === 'url') {
    return {
      reasonLabel: '疑似 URL/Scheme 规则缺口',
      reasonLevel: 'warning',
      nextAction: '定位源字段确认协议、hash route 或内层 query 形态，必要时补充 Scheme 解析样本。',
    };
  }

  if (candidate.detectedType === 'base64') {
    return {
      reasonLabel: '疑似 Base64 非 JSON',
      reasonLevel: 'info',
      nextAction: '确认该值是否为二进制或拼接载荷；如果业务上应是 JSON，可保留样本补充 Base64 规则。',
    };
  }

  return {
    reasonLabel: '待补充解析规则',
    reasonLevel: candidate.message.includes('不是有效 JSON') ? 'warning' : 'info',
    nextAction: '定位该字段并保留原始值，用作后续解析规则或样本回归补充。',
  };
};

const classifyWarning = (
  warning: Pick<TransformWarning, 'type'>
): Pick<TransformReportWarning, 'reasonLabel' | 'nextAction'> => {
  if (warning.type === 'string_decode_budget_exceeded') {
    return {
      reasonLabel: '累计预算保护',
      nextAction: '优先用 JSONPath 定位目标字段，或只复制该字段到 Scheme 面板单独解析，避免整段 response 的其它长字符串消耗预算。',
    };
  }

  return {
    reasonLabel: '单字段长度保护',
    nextAction: '该字段本身超过自动解析阈值，可复制路径定位后单独粘贴到 Scheme 面板，或缩小 response 后再深度解析。',
  };
};

interface DecodedPathCollectState {
  rows: DecodedPathCollectRow[];
  limit: number;
  hasMore: boolean;
}

interface DecodedPathCollectRow {
  path: string;
  preview: string;
  valueText: string;
}

interface DecodedSearchTextCollectState {
  parts: string[];
  rows: TransformReportDecodedPath[];
  remainingLength: number;
  rowLimit: number;
}

const pushDecodedPath = (
  state: DecodedPathCollectState,
  row: DecodedPathCollectRow
) => {
  if (state.rows.length < state.limit) {
    state.rows.push(row);
    return;
  }

  state.hasMore = true;
};

const collectDecodedLeafPaths = (
  value: JsonValue,
  currentPath: string,
  state: DecodedPathCollectState
) => {
  if (state.hasMore) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedPath(state, createDecodedPathRow(currentPath, value, '数组 0 项'));
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedLeafPaths(value[index], appendJsonPathIndex(currentPath, index), state);
      if (state.hasMore) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      pushDecodedPath(state, createDecodedPathRow(currentPath, value, '对象: 空'));
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedLeafPaths(item, appendJsonPathKey(currentPath, key), state);
      if (state.hasMore) return;
    }
    return;
  }

  pushDecodedPath(state, createDecodedPathRow(currentPath, value));
};

const buildDecodedPaths = (
  record: PathTransformRecord,
  limit = DEFAULT_DECODED_PATH_LIMIT
): { decodedPaths: TransformReportDecodedPath[]; hasMoreDecodedPaths: boolean } => {
  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return { decodedPaths: [], hasMoreDecodedPaths: false };
  }

  const state: DecodedPathCollectState = {
    rows: [],
    limit,
    hasMore: false,
  };
  collectDecodedLeafPaths(decodedValue, '$', state);

  return {
    decodedPaths: state.rows.map(row => rebaseDecodedPathRow(record.path, row)),
    hasMoreDecodedPaths: state.hasMore,
  };
};

const pushDecodedSearchText = (
  state: DecodedSearchTextCollectState,
  path: string,
  value: JsonValue,
  preview = formatJsonValuePreview(value, 80)
) => {
  if (state.rows.length < state.rowLimit) {
    state.rows.push({
      path,
      preview,
      copyText: `${path} = ${formatDecodedPathCopyValue(value)}`,
    });
  }

  if (state.remainingLength > 0) {
    const part = `${path} ${preview}`;
    const nextPart = part.length > state.remainingLength
      ? part.slice(0, state.remainingLength)
      : part;
    state.parts.push(nextPart);
    state.remainingLength -= nextPart.length + 1;
  }
};

const collectDecodedSearchText = (
  value: JsonValue,
  currentPath: string,
  state: DecodedSearchTextCollectState
) => {
  if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedSearchText(state, currentPath, value, '数组 0 项');
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedSearchText(value[index], appendJsonPathIndex(currentPath, index), state);
      if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      pushDecodedSearchText(state, currentPath, value, '对象: 空');
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedSearchText(item, appendJsonPathKey(currentPath, key), state);
      if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;
    }
    return;
  }

  pushDecodedSearchText(state, currentPath, value);
};

const buildDecodedSearchData = (
  record: PathTransformRecord,
  textLimit = DEFAULT_DECODED_SEARCH_TEXT_LIMIT,
  pathLimit = DEFAULT_DECODED_SEARCH_PATH_LIMIT
): Pick<TransformReportRecord, 'decodedSearchText' | 'decodedSearchPaths'> => {
  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {};
  }

  const state: DecodedSearchTextCollectState = {
    parts: [],
    rows: [],
    remainingLength: textLimit,
    rowLimit: pathLimit,
  };
  collectDecodedSearchText(decodedValue, record.path, state);

  return {
    ...(state.parts.length > 0 ? { decodedSearchText: state.parts.join('\n') } : {}),
    ...(state.rows.length > 0 ? { decodedSearchPaths: state.rows } : {}),
  };
};

const buildTransformReportCoverage = (
  summary: TransformContextSummary
): TransformReportCoverage => {
  const attentionCount = summary.unresolvedCount + summary.warningCount;
  const totalCount = summary.recordCount + attentionCount;
  const score = totalCount === 0
    ? 100
    : Math.round((summary.recordCount / totalCount) * 100);

  if (summary.warningCount > 0) {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'warning',
      description: `有 ${summary.warningCount} 条内容被性能保护跳过，真实 response 可能仍有未展开字段。`,
      items: [
        '优先查看跳过记录，必要时复制路径定位源字段',
        '超长字段可单独粘贴到 Scheme 面板继续拆解',
      ],
    };
  }

  if (summary.unresolvedCount > 0) {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'info',
      description: `还有 ${summary.unresolvedCount} 条疑似结构化内容未完全展开，需要判断是普通文本还是规则缺口。`,
      items: [
        '优先看未展开线索的原因标签和下一步建议',
        '如果字段应继续拆解，可保留原始值补充解析样本',
      ],
    };
  }

  if (summary.placeholderCount > 0) {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'info',
      description: `结构解析已完成，但仍有 ${summary.placeholderCount} 个运行时占位符需要服务端或客户端运行时替换。`,
      items: [
        '占位符不是解析失败，可复制来源路径回到原始字段排查',
      ],
    };
  }

  return {
    score,
    label: `解析覆盖 ${score}%`,
    level: 'success',
    description: summary.recordCount > 0
      ? '本次未发现待检查线索、性能跳过或运行时占位符。'
      : '本次没有需要展开的嵌套字符串。',
    items: [],
  };
};

const getSchemeTypeLabel = (step: TransformStep): string => {
  if (step.originalSchemeType === 'query-string') return 'CMD 参数';
  if (step.originalSchemeType === 'url') return 'URL Scheme';
  if (step.originalSchemeType === 'base64') return 'Base64';
  return 'Scheme';
};

const getStepLabel = (step: TransformStep): string => {
  if (step.type !== 'scheme_decode') return STEP_LABELS[step.type];

  const reversibleLabel = step.originalSchemeReversible === false ? '不可逆' : '可回写';
  return `${getSchemeTypeLabel(step)} · ${reversibleLabel}`;
};

const includesQuery = (value: string, normalizedQuery: string): boolean => (
  value.toLowerCase().includes(normalizedQuery)
);

const matchesReportRecord = (
  record: TransformReportRecord,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(record.path, normalizedQuery) ||
  (record.sourceLabel ? includesQuery(record.sourceLabel, normalizedQuery) : false) ||
  includesQuery(record.labels.join(' '), normalizedQuery) ||
  includesQuery(record.insights.join(' '), normalizedQuery) ||
  includesQuery(record.originalPreview, normalizedQuery) ||
  (record.decodedPreview ? includesQuery(record.decodedPreview, normalizedQuery) : false) ||
  (record.decodedSearchText ? includesQuery(record.decodedSearchText, normalizedQuery) : false) ||
  (record.decodedSearchPaths ? record.decodedSearchPaths.some(row => matchesDecodedPath(row, normalizedQuery)) : false) ||
  record.decodedPaths.some(row => (
    includesQuery(row.path, normalizedQuery) ||
    includesQuery(row.preview, normalizedQuery)
  ))
);

const matchesDecodedPath = (
  row: TransformReportDecodedPath,
  normalizedQuery: string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  includesQuery(row.preview, normalizedQuery)
);

const buildFilteredRecordView = (
  record: TransformReportRecord,
  normalizedQuery: string
): TransformReportRecord => {
  if (!normalizedQuery || !record.decodedSearchPaths) return record;

  const matchedDecodedPaths = record.decodedSearchPaths.filter(row => (
    matchesDecodedPath(row, normalizedQuery)
  ));
  if (matchedDecodedPaths.length === 0) return record;

  return {
    ...record,
    decodedPaths: matchedDecodedPaths.slice(0, DEFAULT_DECODED_PATH_LIMIT),
    hasMoreDecodedPaths: matchedDecodedPaths.length > DEFAULT_DECODED_PATH_LIMIT,
  };
};

const matchesReportWarning = (
  warning: TransformReportWarning,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(warning.path, normalizedQuery) ||
  (warning.sourceLabel ? includesQuery(warning.sourceLabel, normalizedQuery) : false) ||
  includesQuery(warning.message, normalizedQuery) ||
  includesQuery(warning.reasonLabel, normalizedQuery) ||
  includesQuery(warning.nextAction, normalizedQuery) ||
  includesQuery(warning.originalValue, normalizedQuery)
);

const matchesUnresolvedCandidate = (
  candidate: TransformReportUnresolvedCandidate,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(candidate.path, normalizedQuery) ||
  (candidate.sourceLabel ? includesQuery(candidate.sourceLabel, normalizedQuery) : false) ||
  includesQuery(candidate.message, normalizedQuery) ||
  includesQuery(candidate.preview, normalizedQuery) ||
  includesQuery(candidate.reasonLabel, normalizedQuery) ||
  includesQuery(candidate.nextAction, normalizedQuery) ||
  (candidate.detectedType ? includesQuery(candidate.detectedType, normalizedQuery) : false) ||
  includesQuery(candidate.originalValue, normalizedQuery)
);

const matchesRuntimePlaceholder = (
  placeholder: TransformReportRuntimePlaceholder,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(placeholder.path, normalizedQuery) ||
  includesQuery(placeholder.sourcePath, normalizedQuery) ||
  (placeholder.sourceLabel ? includesQuery(placeholder.sourceLabel, normalizedQuery) : false) ||
  includesQuery(placeholder.value, normalizedQuery) ||
  includesQuery(placeholder.description, normalizedQuery) ||
  (placeholder.sourceOriginalValue ? includesQuery(placeholder.sourceOriginalValue, normalizedQuery) : false)
);

const buildRuntimePlaceholderGroups = (
  placeholders: TransformReportRuntimePlaceholder[]
): TransformReportRuntimePlaceholderGroup[] => {
  const groups = new Map<string, {
    value: string;
    description: string;
    count: number;
    sources: Map<string, TransformReportRuntimePlaceholderSourceGroup>;
  }>();

  placeholders.forEach(placeholder => {
    let group = groups.get(placeholder.value);
    if (!group) {
      group = {
        value: placeholder.value,
        description: placeholder.description,
        count: 0,
        sources: new Map(),
      };
      groups.set(placeholder.value, group);
    }

    group.count += 1;

    let source = group.sources.get(placeholder.sourcePath);
    if (!source) {
      source = {
        sourcePath: placeholder.sourcePath,
        ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
        ...(placeholder.sourceOriginalValue ? { sourceOriginalValue: placeholder.sourceOriginalValue } : {}),
        ...(placeholder.sourceOriginalPreview ? { sourceOriginalPreview: placeholder.sourceOriginalPreview } : {}),
        count: 0,
      };
      group.sources.set(placeholder.sourcePath, source);
    }

    source.count += 1;
  });

  return Array.from(groups.values()).map(group => {
    const sources = Array.from(group.sources.values()).sort((left, right) => (
      right.count - left.count || left.sourcePath.localeCompare(right.sourcePath)
    ));

    return {
      value: group.value,
      description: group.description,
      count: group.count,
      sourceCount: sources.length,
      sources,
    };
  }).sort((left, right) => (
    right.count - left.count || left.value.localeCompare(right.value)
  ));
};

export const summarizeTransformContext = (
  context: TransformContext
): TransformContextSummary => {
  const summary: TransformContextSummary = {
    recordCount: context.records.size,
    stepCounts: {},
    schemeCounts: {
      queryString: 0,
      url: 0,
      base64: 0,
      nonReversible: 0,
    },
    warningCount: context.warnings?.length || 0,
    unresolvedCount: context.unresolvedCandidates?.length || 0,
    placeholderCount: context.runtimePlaceholders?.length || 0,
  };

  context.records.forEach(record => {
    record.steps.forEach(step => {
      incrementCount(summary.stepCounts, step.type);

      if (step.type !== 'scheme_decode') return;

      if (step.originalSchemeType === 'query-string') {
        summary.schemeCounts.queryString += 1;
      } else if (step.originalSchemeType === 'url') {
        summary.schemeCounts.url += 1;
      } else if (step.originalSchemeType === 'base64') {
        summary.schemeCounts.base64 += 1;
      }

      if (step.originalSchemeReversible === false) {
        summary.schemeCounts.nonReversible += 1;
      }
    });
  });

  return summary;
};

export const formatTransformContextSummary = (
  context: TransformContext
): string | undefined => {
  const summary = summarizeTransformContext(context);
  if (
    summary.recordCount === 0 &&
    summary.warningCount === 0 &&
    summary.unresolvedCount === 0 &&
    summary.placeholderCount === 0
  ) {
    return undefined;
  }

  const parts = [`展开 ${summary.recordCount} 处`];
  const jsonParseCount = summary.stepCounts.json_parse || 0;
  const schemeDecodeCount = summary.stepCounts.scheme_decode || 0;
  const urlDecodeCount = summary.stepCounts.url_decode || 0;
  const unicodeDecodeCount = summary.stepCounts.unicode_decode || 0;

  if (schemeDecodeCount > 0) {
    const schemeParts = [
      summary.schemeCounts.queryString > 0 ? `CMD ${summary.schemeCounts.queryString}` : '',
      summary.schemeCounts.url > 0 ? `URL ${summary.schemeCounts.url}` : '',
      summary.schemeCounts.base64 > 0 ? `Base64 ${summary.schemeCounts.base64}` : '',
    ].filter(Boolean);
    parts.push(`Scheme ${schemeDecodeCount}${schemeParts.length > 0 ? ` (${schemeParts.join(' / ')})` : ''}`);
  }
  if (jsonParseCount > 0) parts.push(`嵌套 JSON ${jsonParseCount}`);
  if (urlDecodeCount > 0) parts.push(`URL 解码 ${urlDecodeCount}`);
  if (unicodeDecodeCount > 0) parts.push(`Unicode ${unicodeDecodeCount}`);
  if (summary.schemeCounts.nonReversible > 0) parts.push(`不可逆 ${summary.schemeCounts.nonReversible}`);
  if (summary.warningCount > 0) parts.push(`跳过 ${summary.warningCount}`);
  if (summary.unresolvedCount > 0) parts.push(`待检查 ${summary.unresolvedCount}`);
  if (summary.placeholderCount > 0) parts.push(`占位符 ${summary.placeholderCount}`);

  return `深度解析: ${parts.join('，')}`;
};

export const buildTransformContextReport = (
  context: TransformContext
): TransformContextReport => {
  const records: TransformReportRecord[] = Array.from(context.records.values()).map(record => {
    const { decodedPaths, hasMoreDecodedPaths } = buildDecodedPaths(record);
    const decodedSearchData = buildDecodedSearchData(record);

    return {
      path: record.path,
      sourceLabel: record.sourceLabel,
      labels: record.steps.map(getStepLabel),
      insights: buildRecordInsights(record),
      originalValue: record.originalValue,
      originalPreview: formatOriginalPreview(record.originalValue),
      decodedPreview: getDecodedPreview(record),
      ...decodedSearchData,
      decodedPaths,
      hasMoreDecodedPaths,
      cmdStructureCopyText: getRecordCmdStructureCopyText(record),
      stepCount: record.steps.length,
      hasNonReversibleScheme: record.steps.some(
        step => step.type === 'scheme_decode' && step.originalSchemeReversible === false
      ),
    };
  });
  const summary = summarizeTransformContext(context);
  const runtimePlaceholders: TransformReportRuntimePlaceholder[] = (context.runtimePlaceholders || []).map(placeholder => ({
    path: placeholder.path,
    sourcePath: placeholder.sourcePath,
    ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
    ...(placeholder.sourceOriginalValue ? { sourceOriginalValue: placeholder.sourceOriginalValue } : {}),
    ...(placeholder.sourceOriginalValue
      ? { sourceOriginalPreview: formatOriginalPreview(placeholder.sourceOriginalValue) }
      : {}),
    value: placeholder.value,
    description: placeholder.description,
  }));

  return {
    summary,
    summaryText: formatTransformContextSummary(context),
    coverage: buildTransformReportCoverage(summary),
    records,
    warnings: (context.warnings || []).map(warning => ({
      type: warning.type,
      path: warning.path,
      ...(warning.sourceLabel ? { sourceLabel: warning.sourceLabel } : {}),
      originalValue: warning.originalValue,
      message: warning.message,
      length: warning.length,
      limit: warning.limit,
      ...classifyWarning(warning),
    })),
    unresolvedCandidates: (context.unresolvedCandidates || []).map(candidate => ({
      path: candidate.path,
      ...(candidate.sourceLabel ? { sourceLabel: candidate.sourceLabel } : {}),
      originalValue: candidate.originalValue,
      message: candidate.message,
      length: candidate.length,
      preview: candidate.preview,
      detectedType: candidate.detectedType,
      ...classifyUnresolvedCandidate(candidate),
    })),
    runtimePlaceholderGroups: buildRuntimePlaceholderGroups(runtimePlaceholders),
    runtimePlaceholders,
  };
};

export const formatTransformContextReportText = (
  context: TransformContext
): string => {
  const report = buildTransformContextReport(context);
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    report.coverage.label,
    `覆盖说明: ${report.coverage.description}`,
    ...report.coverage.items.map(item => `- ${item}`),
    '',
    '展开记录:',
  ];

  appendReportRecordLines(lines, report.records);
  appendReportWarningSection(lines, report.warnings);
  appendReportUnresolvedSection(lines, report.unresolvedCandidates);
  appendReportPlaceholderSection(lines, report.runtimePlaceholderGroups, report.runtimePlaceholders);

  return lines.join('\n');
};

const appendReportRecordLines = (
  lines: string[],
  records: TransformReportRecord[]
) => {
  if (records.length === 0) {
    lines.push('- 无');
  } else {
    records.forEach(record => {
      lines.push(`- ${record.path}: ${record.labels.join(' -> ')}`);
      if (record.sourceLabel) {
        lines.push(`  业务字段: ${record.sourceLabel}`);
      }
      if (record.decodedPreview) {
        lines.push(`  解析结果: ${record.decodedPreview}`);
      }
      if (record.insights.length > 0) {
        lines.push(`  解析线索: ${record.insights.join('；')}`);
      }
      if (record.decodedPaths.length > 0) {
        lines.push(`  内部路径: ${record.decodedPaths.map(row => `${row.path}=${row.preview}`).join('；')}`);
      }
      if (record.hasMoreDecodedPaths) {
        lines.push('  内部路径: 还有更多未展示');
      }
    });
  }
};

const appendReportWarningSection = (
  lines: string[],
  warnings: TransformReportWarning[]
) => {
  if (warnings.length > 0) {
    lines.push('', '跳过记录:');
    warnings.forEach(warning => {
      lines.push(`- ${warning.path}: ${warning.message} (${warning.length}/${warning.limit})`);
      if (warning.sourceLabel) {
        lines.push(`  业务字段: ${warning.sourceLabel}`);
      }
      lines.push(`  原因: ${warning.reasonLabel}`);
      lines.push(`  下一步: ${warning.nextAction}`);
    });
  }
};

const appendReportUnresolvedSection = (
  lines: string[],
  unresolvedCandidates: TransformReportUnresolvedCandidate[]
) => {
  if (unresolvedCandidates.length > 0) {
    lines.push('', '未展开线索:');
    unresolvedCandidates.forEach(candidate => {
      const typeText = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${typeText}: ${candidate.message} (${candidate.length} 字符)`);
      if (candidate.sourceLabel) {
        lines.push(`  业务字段: ${candidate.sourceLabel}`);
      }
      lines.push(`  原因: ${candidate.reasonLabel}`);
      lines.push(`  下一步: ${candidate.nextAction}`);
      lines.push(`  预览: ${candidate.preview}`);
    });
  }
};

const appendReportPlaceholderSection = (
  lines: string[],
  placeholderGroups: TransformReportRuntimePlaceholderGroup[],
  runtimePlaceholders: TransformReportRuntimePlaceholder[]
) => {
  if (runtimePlaceholders.length > 0) {
    lines.push('', '运行时占位符汇总:');
    placeholderGroups.forEach(group => {
      lines.push(`- ${group.value} ×${group.count}: ${group.description}`);
      lines.push(`  来源数: ${group.sourceCount}`);
      lines.push(`  主要来源: ${group.sources.map(source => (
        `${source.sourceLabel ? `${source.sourceLabel} ` : ''}${source.sourcePath} ×${source.count}`
      )).join('；')}`);
    });

    lines.push('', '运行时占位符明细:');
    runtimePlaceholders.forEach(placeholder => {
      lines.push(`- ${placeholder.path}: ${placeholder.value}`);
      lines.push(`  来源: ${placeholder.sourcePath}`);
      if (placeholder.sourceLabel) {
        lines.push(`  业务字段: ${placeholder.sourceLabel}`);
      }
      if (placeholder.sourceOriginalPreview) {
        lines.push(`  来源预览: ${placeholder.sourceOriginalPreview}`);
      }
      lines.push(`  说明: ${placeholder.description}`);
    });
  }
};

export const buildTransformReportView = (
  report: TransformContextReport,
  query: string,
  options?: TransformReportViewOptions
): TransformReportView => {
  const normalizedQuery = query.trim().toLowerCase();
  const recordLimit = options?.recordLimit ?? DEFAULT_TRANSFORM_REPORT_RECORD_LIMIT;
  const warningLimit = options?.warningLimit ?? DEFAULT_TRANSFORM_REPORT_WARNING_LIMIT;
  const unresolvedLimit = options?.unresolvedLimit ?? DEFAULT_TRANSFORM_REPORT_UNRESOLVED_LIMIT;
  const placeholderLimit = options?.placeholderLimit ?? DEFAULT_TRANSFORM_REPORT_PLACEHOLDER_LIMIT;
  const filteredRecords = report.records.filter(record => matchesReportRecord(record, normalizedQuery));
  const filteredWarnings = report.warnings.filter(warning => matchesReportWarning(warning, normalizedQuery));
  const filteredUnresolved = report.unresolvedCandidates.filter(
    candidate => matchesUnresolvedCandidate(candidate, normalizedQuery)
  );
  const filteredPlaceholders = report.runtimePlaceholders.filter(
    placeholder => matchesRuntimePlaceholder(placeholder, normalizedQuery)
  );

  return {
    records: filteredRecords.map(record => (
      buildFilteredRecordView(record, normalizedQuery)
    )).slice(0, recordLimit),
    warnings: filteredWarnings.slice(0, warningLimit),
    unresolvedCandidates: filteredUnresolved.slice(0, unresolvedLimit),
    runtimePlaceholderGroups: buildRuntimePlaceholderGroups(filteredPlaceholders),
    runtimePlaceholders: filteredPlaceholders.slice(0, placeholderLimit),
    filteredRecordCount: filteredRecords.length,
    filteredWarningCount: filteredWarnings.length,
    filteredUnresolvedCount: filteredUnresolved.length,
    filteredPlaceholderCount: filteredPlaceholders.length,
    totalRecordCount: report.records.length,
    totalWarningCount: report.warnings.length,
    totalUnresolvedCount: report.unresolvedCandidates.length,
    totalPlaceholderCount: report.runtimePlaceholders.length,
    isRecordTruncated: filteredRecords.length > recordLimit,
    isWarningTruncated: filteredWarnings.length > warningLimit,
    isUnresolvedTruncated: filteredUnresolved.length > unresolvedLimit,
    isPlaceholderTruncated: filteredPlaceholders.length > placeholderLimit,
  };
};

export const formatTransformReportViewText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    `筛选: ${normalizedQuery || '全部'}`,
    `筛选结果: 展开 ${reportView.filteredRecordCount}/${reportView.totalRecordCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}，待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}`,
  ];

  if (
    reportView.filteredRecordCount === 0 &&
    reportView.filteredPlaceholderCount === 0 &&
    reportView.filteredUnresolvedCount === 0 &&
    reportView.filteredWarningCount === 0
  ) {
    lines.push('', '筛选结果:', '- 无匹配记录');
    return lines.join('\n');
  }

  if (reportView.filteredRecordCount > 0) {
    lines.push('', '展开记录:');
    appendReportRecordLines(lines, reportView.records);
    if (reportView.isRecordTruncated) {
      lines.push(`- 还有 ${reportView.filteredRecordCount - reportView.records.length} 条展开记录未复制`);
    }
  }

  appendReportUnresolvedSection(lines, reportView.unresolvedCandidates);
  if (reportView.isUnresolvedTruncated) {
    lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条未展开线索未复制`);
  }

  appendReportPlaceholderSection(lines, reportView.runtimePlaceholderGroups, reportView.runtimePlaceholders);
  if (reportView.isPlaceholderTruncated) {
    lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
  }

  appendReportWarningSection(lines, reportView.warnings);
  if (reportView.isWarningTruncated) {
    lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未复制`);
  }

  return lines.join('\n');
};

export const formatTransformPathValueReportText = (
  reportView: TransformReportView
): string => {
  const lines: string[] = [];

  reportView.records.forEach(record => {
    record.decodedPaths.forEach(row => {
      lines.push(row.copyText);
    });

    if (record.hasMoreDecodedPaths) {
      lines.push(`... ${record.path} 还有更多内部路径未复制`);
    }
  });

  if (reportView.isRecordTruncated) {
    lines.push(`... 还有 ${reportView.filteredRecordCount - reportView.records.length} 条展开记录未复制`);
  }

  return lines.join('\n');
};

export const formatTransformCmdStructureReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const records = reportView.records.filter(record => record.cmdStructureCopyText);
  if (records.length === 0) return '';

  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    ...(normalizedQuery ? [`筛选: ${normalizedQuery}`] : []),
    `CMD 结构: ${records.length} 条`,
  ];

  records.forEach(record => {
    lines.push('', `路径: ${record.path}`);
    if (record.sourceLabel) {
      lines.push(`业务字段: ${record.sourceLabel}`);
    }
    if (record.insights.length > 0) {
      lines.push(`解析线索: ${record.insights.join('；')}`);
    }
    lines.push(record.cmdStructureCopyText || '');
  });

  if (reportView.isRecordTruncated) {
    lines.push(`... 还有 ${reportView.filteredRecordCount - reportView.records.length} 条展开记录未复制`);
  }

  return lines.join('\n');
};

export const formatTransformPlaceholderReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    ...(normalizedQuery ? [`筛选: ${normalizedQuery}`] : []),
    `占位符: ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}`,
  ];

  if (reportView.filteredPlaceholderCount === 0) {
    lines.push('', '运行时占位符:', '- 无匹配占位符');
    return lines.join('\n');
  }

  appendReportPlaceholderSection(lines, reportView.runtimePlaceholderGroups, reportView.runtimePlaceholders);
  if (reportView.isPlaceholderTruncated) {
    lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
  }

  return lines.join('\n');
};

import type { JsonValue, PathTransformRecord, TransformContext, TransformStep, TransformStepType } from '../types';

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
  originalPreview: string;
  decodedPreview?: string;
  decodedSearchText?: string;
  decodedPaths: TransformReportDecodedPath[];
  hasMoreDecodedPaths: boolean;
  stepCount: number;
  hasNonReversibleScheme: boolean;
}

export interface TransformReportDecodedPath {
  path: string;
  preview: string;
}

export interface TransformReportWarning {
  path: string;
  sourceLabel?: string;
  message: string;
  length: number;
  limit: number;
}

export interface TransformReportUnresolvedCandidate {
  path: string;
  sourceLabel?: string;
  message: string;
  length: number;
  preview: string;
  detectedType?: string;
}

export interface TransformReportRuntimePlaceholder {
  path: string;
  sourcePath: string;
  sourceLabel?: string;
  value: string;
  description: string;
}

export interface TransformContextReport {
  summary: TransformContextSummary;
  summaryText?: string;
  records: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
}

export interface TransformReportView {
  records: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
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

interface DecodedPathCollectState {
  rows: TransformReportDecodedPath[];
  limit: number;
  hasMore: boolean;
}

interface DecodedSearchTextCollectState {
  parts: string[];
  remainingLength: number;
}

const pushDecodedPath = (
  state: DecodedPathCollectState,
  row: TransformReportDecodedPath
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
      pushDecodedPath(state, { path: currentPath, preview: '数组 0 项' });
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
      pushDecodedPath(state, { path: currentPath, preview: '对象: 空' });
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedLeafPaths(item, appendJsonPathKey(currentPath, key), state);
      if (state.hasMore) return;
    }
    return;
  }

  pushDecodedPath(state, {
    path: currentPath,
    preview: formatJsonValuePreview(value, 80),
  });
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
    decodedPaths: state.rows.map(row => ({
      path: joinJsonPath(record.path, row.path),
      preview: row.preview,
    })),
    hasMoreDecodedPaths: state.hasMore,
  };
};

const pushDecodedSearchText = (
  state: DecodedSearchTextCollectState,
  path: string,
  preview: string
) => {
  if (state.remainingLength <= 0) return;

  const part = `${path} ${preview}`;
  const nextPart = part.length > state.remainingLength
    ? part.slice(0, state.remainingLength)
    : part;
  state.parts.push(nextPart);
  state.remainingLength -= nextPart.length + 1;
};

const collectDecodedSearchText = (
  value: JsonValue,
  currentPath: string,
  state: DecodedSearchTextCollectState
) => {
  if (state.remainingLength <= 0) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedSearchText(state, currentPath, '数组 0 项');
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedSearchText(value[index], appendJsonPathIndex(currentPath, index), state);
      if (state.remainingLength <= 0) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      pushDecodedSearchText(state, currentPath, '对象: 空');
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedSearchText(item, appendJsonPathKey(currentPath, key), state);
      if (state.remainingLength <= 0) return;
    }
    return;
  }

  pushDecodedSearchText(state, currentPath, formatJsonValuePreview(value, 80));
};

const buildDecodedSearchText = (
  record: PathTransformRecord,
  limit = DEFAULT_DECODED_SEARCH_TEXT_LIMIT
): string | undefined => {
  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return undefined;
  }

  const state: DecodedSearchTextCollectState = {
    parts: [],
    remainingLength: limit,
  };
  collectDecodedSearchText(decodedValue, record.path, state);

  return state.parts.length > 0 ? state.parts.join('\n') : undefined;
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
  includesQuery(record.originalPreview, normalizedQuery) ||
  (record.decodedPreview ? includesQuery(record.decodedPreview, normalizedQuery) : false) ||
  (record.decodedSearchText ? includesQuery(record.decodedSearchText, normalizedQuery) : false) ||
  record.decodedPaths.some(row => (
    includesQuery(row.path, normalizedQuery) ||
    includesQuery(row.preview, normalizedQuery)
  ))
);

const matchesReportWarning = (
  warning: TransformReportWarning,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(warning.path, normalizedQuery) ||
  (warning.sourceLabel ? includesQuery(warning.sourceLabel, normalizedQuery) : false) ||
  includesQuery(warning.message, normalizedQuery)
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
  (candidate.detectedType ? includesQuery(candidate.detectedType, normalizedQuery) : false)
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
  includesQuery(placeholder.description, normalizedQuery)
);

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

    return {
      path: record.path,
      sourceLabel: record.sourceLabel,
      labels: record.steps.map(getStepLabel),
      originalPreview: formatOriginalPreview(record.originalValue),
      decodedPreview: getDecodedPreview(record),
      decodedSearchText: buildDecodedSearchText(record),
      decodedPaths,
      hasMoreDecodedPaths,
      stepCount: record.steps.length,
      hasNonReversibleScheme: record.steps.some(
        step => step.type === 'scheme_decode' && step.originalSchemeReversible === false
      ),
    };
  });

  return {
    summary: summarizeTransformContext(context),
    summaryText: formatTransformContextSummary(context),
    records,
    warnings: (context.warnings || []).map(warning => ({
      path: warning.path,
      ...(warning.sourceLabel ? { sourceLabel: warning.sourceLabel } : {}),
      message: warning.message,
      length: warning.length,
      limit: warning.limit,
    })),
    unresolvedCandidates: (context.unresolvedCandidates || []).map(candidate => ({
      path: candidate.path,
      ...(candidate.sourceLabel ? { sourceLabel: candidate.sourceLabel } : {}),
      message: candidate.message,
      length: candidate.length,
      preview: candidate.preview,
      detectedType: candidate.detectedType,
    })),
    runtimePlaceholders: (context.runtimePlaceholders || []).map(placeholder => ({
      path: placeholder.path,
      sourcePath: placeholder.sourcePath,
      ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
      value: placeholder.value,
      description: placeholder.description,
    })),
  };
};

export const formatTransformContextReportText = (
  context: TransformContext
): string => {
  const report = buildTransformContextReport(context);
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    '',
    '展开记录:',
  ];

  if (report.records.length === 0) {
    lines.push('- 无');
  } else {
    report.records.forEach(record => {
      lines.push(`- ${record.path}: ${record.labels.join(' -> ')}`);
      if (record.sourceLabel) {
        lines.push(`  业务字段: ${record.sourceLabel}`);
      }
      if (record.decodedPreview) {
        lines.push(`  解析结果: ${record.decodedPreview}`);
      }
      if (record.decodedPaths.length > 0) {
        lines.push(`  内部路径: ${record.decodedPaths.map(row => `${row.path}=${row.preview}`).join('；')}`);
      }
      if (record.hasMoreDecodedPaths) {
        lines.push('  内部路径: 还有更多未展示');
      }
    });
  }

  if (report.warnings.length > 0) {
    lines.push('', '跳过记录:');
    report.warnings.forEach(warning => {
      lines.push(`- ${warning.path}: ${warning.message} (${warning.length}/${warning.limit})`);
      if (warning.sourceLabel) {
        lines.push(`  业务字段: ${warning.sourceLabel}`);
      }
    });
  }

  if (report.unresolvedCandidates.length > 0) {
    lines.push('', '未展开线索:');
    report.unresolvedCandidates.forEach(candidate => {
      const typeText = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${typeText}: ${candidate.message} (${candidate.length} 字符)`);
      if (candidate.sourceLabel) {
        lines.push(`  业务字段: ${candidate.sourceLabel}`);
      }
      lines.push(`  预览: ${candidate.preview}`);
    });
  }

  if (report.runtimePlaceholders.length > 0) {
    lines.push('', '运行时占位符:');
    report.runtimePlaceholders.forEach(placeholder => {
      lines.push(`- ${placeholder.path}: ${placeholder.value}`);
      lines.push(`  来源: ${placeholder.sourcePath}`);
      if (placeholder.sourceLabel) {
        lines.push(`  业务字段: ${placeholder.sourceLabel}`);
      }
      lines.push(`  说明: ${placeholder.description}`);
    });
  }

  return lines.join('\n');
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
    records: filteredRecords.slice(0, recordLimit),
    warnings: filteredWarnings.slice(0, warningLimit),
    unresolvedCandidates: filteredUnresolved.slice(0, unresolvedLimit),
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

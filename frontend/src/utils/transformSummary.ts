import type {
  JsonValue,
  PathTransformRecord,
  TransformContext,
  TransformSchemeParamStageSummary,
  TransformSchemeParamStageSummaryBucket,
  TransformStep,
  TransformStepType,
  TransformWarning,
} from '../types';
import { APP_VERSION_METADATA, APP_VERSION_LABEL, type AppVersionMetadata } from './appVersion';
import {
  collectCmdHandlerCommandSchemaRows,
  collectSchemeInsightFields,
  formatSchemeInsightItems,
  formatCmdHandlerCompatibleResult,
  getSchemeInsightFieldCopyText,
  getSchemeCommandSchemaFromUrl,
  getUrlResourceSchemaFromUrl,
} from './schemeMetadata';
import { formatSourceLabelText, getSourceLabelDisplayValue } from './sourceLabels';
import {
  formatTransformContextSummary,
  summarizeTransformContext,
  type TransformContextSummary,
} from './transformContextSummary';

export { formatTransformContextSummary, summarizeTransformContext };
export type { TransformContextSummary };

export interface TransformReportRecord {
  path: string;
  sourceLabel?: string;
  commandSchema?: string;
  commandSchemaRows?: TransformReportCommandSchemaRow[];
  commandParamCount?: number;
  commandParamKeys?: string[];
  labels: string[];
  insights: string[];
  originalValue: string;
  originalPreview: string;
  decodedPreview?: string;
  decodedSearchText?: string;
  decodedSearchPaths?: TransformReportDecodedPath[];
  decodedPaths: TransformReportDecodedPath[];
  decodedPathCount: number;
  isDecodedPathCountTruncated: boolean;
  indexedDecodedPathCount: number;
  hasMoreDecodedPaths: boolean;
  nestedCommandFields: TransformReportDecodedPath[];
  nestedCommandSearchFields?: TransformReportDecodedPath[];
  indexedNestedCommandFieldCount: number;
  hasMoreNestedCommandFields: boolean;
  nestedResourceFields?: TransformReportDecodedPath[];
  nestedResourceSearchFields?: TransformReportDecodedPath[];
  indexedNestedResourceFieldCount?: number;
  hasMoreNestedResourceFields?: boolean;
  hasCmdStructure: boolean;
  nestedCommandFieldCount: number;
  nestedResourceFieldCount?: number;
  nestedExtFieldCount: number;
  nestedBase64SuffixFieldCount: number;
  cmdStructureCopyText?: string;
  getCmdStructureCopyText?: (focusedFieldPaths?: string[]) => string;
  cmdStructureFocusPaths?: string[];
  cmdStructureFocusCount?: number;
  cmdStructureFocusLabel?: string;
  stepCount: number;
  hasNonReversibleScheme: boolean;
  schemeParamStageSummary?: TransformSchemeParamStageSummary;
}

export interface TransformReportDecodedPath {
  path: string;
  preview: string;
  copyText?: string;
  value?: JsonValue;
  sourceValue?: JsonValue;
  resourceType?: TransformReportResourceType;
  resourceTypeLabel?: string;
}

export interface TransformReportCommandSchemaRow {
  schema: string;
  path: string;
  source?: string;
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

export interface TransformReportNestedCommandFieldGroup {
  key: string;
  count: number;
  recordCount: number;
  paths: string[];
  hasMorePaths: boolean;
}

export interface TransformReportCommandSchemaGroup {
  schema: string;
  count: number;
  recordCount: number;
  paths: string[];
  hasMorePaths: boolean;
  resourceType?: TransformReportResourceType;
  resourceTypeLabel?: string;
}

export type TransformReportResourceType = 'image' | 'video' | 'lottie' | 'audio' | 'package' | 'other';

export interface TransformReportResourceTypeGroup {
  resourceType: TransformReportResourceType;
  resourceTypeLabel: string;
  query: string;
  count: number;
  percentage: number;
  recordCount: number;
  schemaCount: number;
  schemas: string[];
  hasMoreSchemas: boolean;
}

export interface TransformReportCommandSchemaOriginGroup {
  origin: string;
  count: number;
  schemaCount: number;
  recordCount: number;
  schemas: string[];
  hasMoreSchemas: boolean;
}

export interface TransformContextReport {
  summary: TransformContextSummary;
  summaryText?: string;
  coverage: TransformReportCoverage;
  cmdStructureCount: number;
  nestedCommandFieldCount: number;
  nestedResourceFieldCount?: number;
  topCommandSchemaOrigins?: TransformReportCommandSchemaOriginGroup[];
  topCommandSchemas?: TransformReportCommandSchemaGroup[];
  topResourceSchemas?: TransformReportCommandSchemaGroup[];
  topResourceTypes?: TransformReportResourceTypeGroup[];
  topNestedCommandFields?: TransformReportNestedCommandFieldGroup[];
  topNestedResourceFields?: TransformReportNestedCommandFieldGroup[];
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
  cmdStructureRecords: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  filteredRecordCount: number;
  filteredWarningCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  filteredSchemeParamStageCount: number;
  filteredSchemeParamStageRepairHintCount: number;
  filteredNonReversibleParamStageCount: number;
  filteredCmdStructureCount: number;
  filteredNestedCommandFieldCount: number;
  filteredNestedResourceFieldCount: number;
  totalRecordCount: number;
  totalWarningCount: number;
  totalUnresolvedCount: number;
  totalPlaceholderCount: number;
  totalSchemeParamStageCount: number;
  totalSchemeParamStageRepairHintCount: number;
  totalNonReversibleParamStageCount: number;
  totalCmdStructureCount: number;
  totalNestedCommandFieldCount: number;
  totalNestedResourceFieldCount: number;
  isRecordTruncated: boolean;
  isCmdStructureTruncated: boolean;
  isWarningTruncated: boolean;
  isUnresolvedTruncated: boolean;
  isPlaceholderTruncated: boolean;
}

export interface TransformReportViewOptions {
  recordLimit?: number;
  warningLimit?: number;
  unresolvedLimit?: number;
  placeholderLimit?: number;
  cmdStructureLimit?: number;
}

export type TransformIssueSampleType = 'unresolved' | 'runtime_placeholder' | 'warning';

export interface TransformIssueSampleExportItem {
  type: TransformIssueSampleType;
  path: string;
  sourceLabel?: string;
  originalValue: string;
  redactionHint?: string;
  reasonLabel: string;
  nextAction?: string;
  message?: string;
  detectedType?: string;
  reasonLevel?: 'info' | 'warning';
  length?: number;
  limit?: number;
  value?: string;
  sourcePath?: string;
  warningType?: TransformWarning['type'];
}

export interface TransformIssueSampleExport {
  schemaVersion: 1;
  kind: 'json-helper-transform-issue-samples';
  tool: AppVersionMetadata;
  filter: string;
  suggestedCommands: TransformSuggestedCommand[];
  summary: {
    unresolved: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
    runtimePlaceholders: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
    warnings: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
  };
  samples: TransformIssueSampleExportItem[];
}

export interface TransformIssueSampleJsonOptions {
  redactSensitiveValues?: boolean;
  filter?: string;
}

export interface TransformPlaceholderFillTemplateSource {
  sourcePath: string;
  sourceLabel?: string;
  count: number;
  sourceOriginalPreview?: string;
}

export interface TransformPlaceholderFillTemplateSuggestion {
  replacement: string;
  sourcePath: string;
  sourceLabel?: string;
  reason: string;
}

export interface TransformPlaceholderFillTemplateDetail {
  value: string;
  replacement: string;
  suggestion?: TransformPlaceholderFillTemplateSuggestion;
  description: string;
  count: number;
  sourceCount: number;
  sources: TransformPlaceholderFillTemplateSource[];
}

export interface TransformPlaceholderFillTemplate {
  schemaVersion: 1;
  kind: 'json-helper-runtime-placeholder-fill-template';
  tool: AppVersionMetadata;
  filter: string;
  summary: {
    groups: number;
    visibleOccurrences: number;
    filteredOccurrences: number;
    totalOccurrences: number;
    truncated: boolean;
  };
  placeholders: Record<string, string>;
  placeholderDetails: TransformPlaceholderFillTemplateDetail[];
}

export interface TransformQualitySnapshotBucket {
  key: string;
  count: number;
  paths: string[];
}

export interface TransformQualitySnapshot {
  schemaVersion: 1;
  kind: 'json-helper-transform-quality-snapshot';
  tool: AppVersionMetadata;
  filter: string;
  coverage: TransformReportCoverage;
  totals: {
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    runtimePlaceholders: number;
    schemeParamStages: number;
    schemeParamStageRepairHints: number;
    nonReversibleParamStages: number;
    unresolved: number;
    warnings: number;
  };
  filtered: {
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    runtimePlaceholders: number;
    schemeParamStages: number;
    schemeParamStageRepairHints: number;
    nonReversibleParamStages: number;
    unresolved: number;
    warnings: number;
  };
  hotspots: {
    topCommandSchemas: TransformReportCommandSchemaGroup[];
    topCommandSchemaOrigins: TransformReportCommandSchemaOriginGroup[];
    topResourceSchemas: TransformReportCommandSchemaGroup[];
    topResourceTypes: TransformReportResourceTypeGroup[];
    topNestedCommandFields: TransformReportNestedCommandFieldGroup[];
    topNestedResourceFields: TransformReportNestedCommandFieldGroup[];
    unresolvedReasons: TransformQualitySnapshotBucket[];
    warningReasons: TransformQualitySnapshotBucket[];
    warningTypes: TransformQualitySnapshotBucket[];
    runtimePlaceholders: TransformQualitySnapshotBucket[];
    schemeParamStageSources: TransformQualitySnapshotBucket[];
    schemeParamStageKeys: TransformQualitySnapshotBucket[];
    schemeParamStageRepairHints: TransformQualitySnapshotBucket[];
  };
  truncation: {
    records: boolean;
    cmdStructures: boolean;
    runtimePlaceholders: boolean;
    unresolved: boolean;
    warnings: boolean;
  };
  recommendations: string[];
}

export interface TransformCollaborationReportOptions {
  cmdComparisonReportText?: string;
  cmdComparisonCandidateText?: string;
}

export interface TransformArchivePackageOptions extends TransformCollaborationReportOptions {
  sampleName?: string;
}

export interface TransformSuggestedCommand {
  id: string;
  label: string;
  command: string;
  description: string;
}

export interface TransformArchivePackage {
  schemaVersion: 1;
  kind: 'json-helper-transform-archive-package';
  tool: AppVersionMetadata;
  filter: string;
  safety: {
    containsRawResponse: false;
    issueSampleOriginalValues: 'omitted-or-redacted';
    placeholderSourcePreviews: false;
    cmdComparisonMayContainValues: boolean;
    notes: string[];
  };
  artifacts: {
    diagnosticSummaryText: string;
    collaborationReportText: string;
    qualitySnapshot: TransformQualitySnapshot;
    issueSamples: TransformIssueSampleExport | null;
    placeholderFillTemplate: TransformPlaceholderFillTemplate | null;
    cmdComparisonReportText?: string;
    cmdComparisonCandidateText?: string;
  };
  suggestedCommands: TransformSuggestedCommand[];
  corpusCandidate: {
    recommendedFiles: string[];
    checklist: string[];
  };
}

export interface TransformTroubleshootingRecipeStep {
  id: string;
  label: string;
  action: string;
  description: string;
  input: string;
  output: string;
  dependsOn: string[];
  enabled: boolean;
}

export interface TransformTroubleshootingRecipe {
  schemaVersion: 1;
  kind: 'json-helper-transform-troubleshooting-recipe';
  tool: AppVersionMetadata;
  filter: string;
  safety: {
    containsRawResponse: false;
    containsOriginalValues: false;
    notes: string[];
  };
  summary: {
    coverageLabel: string;
    coverageScore: number;
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    runtimePlaceholders: number;
    unresolved: number;
    warnings: number;
    truncated: boolean;
  };
  steps: TransformTroubleshootingRecipeStep[];
  suggestedCommands: TransformSuggestedCommand[];
}

type TransformQualitySnapshotMetricKey = keyof TransformQualitySnapshot['totals'];

const DEFAULT_DIAGNOSTIC_TOP_LIMIT = 8;
const DEFAULT_DIAGNOSTIC_SAMPLE_LIMIT = 5;
const DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT = 8;
const DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT = 4;
const ARCHIVE_OMITTED_ORIGINAL_VALUE = '[已省略，归档包默认不携带原始字段值]';
const CMD_DIFF_STDIN_COMMAND = 'pbpaste | npm run cmd:diff -- --stdin';
const CMD_DIFF_STDIN_IGNORE_EXTRA_COMMAND = 'pbpaste | npm run cmd:diff -- --stdin --ignore-extra';
const ISSUE_SAMPLES_TO_REGRESSION_STDIN_COMMAND = 'pbpaste | npm run samples:to-regression -- --redact';
const ISSUE_SAMPLES_TO_REGRESSION_FILE_COMMAND = 'npm run samples:to-regression -- --redact <issue-samples.json>';
const CORPUS_SNAPSHOT_CHECK_COMMAND = 'npm run corpus:snapshot:check';
export const DEFAULT_TRANSFORM_REPORT_RECORD_LIMIT = 200;
export const DEFAULT_TRANSFORM_REPORT_WARNING_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_UNRESOLVED_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_PLACEHOLDER_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_CMD_STRUCTURE_LIMIT = 200;
const DEFAULT_DECODED_PATH_LIMIT = 12;
const DEFAULT_NESTED_COMMAND_FIELD_LIMIT = 8;
const DEFAULT_NESTED_COMMAND_FIELD_SEARCH_LIMIT = 200;
const DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT = 8;
const DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT = 4;
const DEFAULT_TOP_COMMAND_SCHEMA_LIMIT = 8;
const DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT = 4;
const DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_LIMIT = 8;
const DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT = 4;
const DEFAULT_COMMAND_SCHEMA_ROW_LIMIT = 8;
const DEFAULT_COMMAND_PARAM_KEY_LIMIT = 8;
const DEFAULT_DECODED_PATH_COUNT_LIMIT = 10_000;
const DEFAULT_DECODED_SEARCH_TEXT_LIMIT = 20_000;
const DEFAULT_DECODED_SEARCH_PATH_LIMIT = 1_000;
const CMD_STRUCTURE_SEARCH_TEXT = 'CMD结构 cmdHandler cmdParams cmdSchema';
const NESTED_CMD_SEARCH_TEXT = '内部CMD字段 内部CMD cmd解析';
const NESTED_RESOURCE_SEARCH_TEXT = '资源URL 静态资源字段 资源字段 resource url';
const UNRESOLVED_SEARCH_TEXT = '待检查 未展开 线索 unresolved';
const PLACEHOLDER_SEARCH_TEXT = '占位符 运行时 placeholder';
const WARNING_SEARCH_TEXT = '跳过 性能保护 warning skipped';
const SENSITIVE_SAMPLE_KEYWORDS = [
  'access_token',
  'refresh_token',
  'authorization',
  'android_id',
  'device_id',
  'baiduid',
  'baidu_id',
  'password',
  'passwd',
  'session',
  'cookie',
  'secret',
  'token',
  'sign',
  'imei',
  'oaid',
  'idfa',
  'cuid',
];

const buildCmdComparisonSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'cmd-diff-stdin',
    label: '对比 actual/expected',
    command: CMD_DIFF_STDIN_COMMAND,
    description: '复制当前对比包后直接运行，输出 cmdHandler 结构差异。',
  },
  {
    id: 'cmd-diff-stdin-ignore-extra',
    label: '忽略 actual 额外路径对比',
    command: CMD_DIFF_STDIN_IGNORE_EXTRA_COMMAND,
    description: 'expected 只保存稳定子集时使用，避免 actual 额外展开字段造成噪音。',
  },
];

const buildIssueSampleSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'issue-samples-to-regression-stdin',
    label: '生成回归测试模板',
    command: ISSUE_SAMPLES_TO_REGRESSION_STDIN_COMMAND,
    description: '复制问题样本 JSON 后直接运行，输出可补断言的 Vitest 模板。',
  },
];

const buildArchiveSuggestedCommands = (): TransformSuggestedCommand[] => [
  {
    id: 'issue-samples-to-regression-file',
    label: '沉淀问题样本回归',
    command: ISSUE_SAMPLES_TO_REGRESSION_FILE_COMMAND,
    description: '先将 artifacts.issueSamples 保存为 issue-samples.json，再生成可补断言的回归测试模板。',
  },
  {
    id: 'corpus-snapshot-check',
    label: '校验 corpus 质量基线',
    command: CORPUS_SNAPSHOT_CHECK_COMMAND,
    description: '按 recommendedFiles 补齐脱敏 response、expected snapshot 和 cmdHandler expected 后运行。',
  },
];

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

const formatOriginalPreview = (value: string, maxLength = 96): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

const decodeForSensitiveSearch = (value: string): string => {
  let current = value;
  for (let index = 0; index < 2; index++) {
    try {
      const decoded = decodeURIComponent(current.replace(/\+/g, ' '));
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const includesSensitiveKeyword = (text: string, keyword: string): boolean => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, 'i').test(text);
};

const collectIssueSampleSensitiveKeywords = (sample: TransformIssueSampleExportItem): string[] => {
  const searchText = [
    sample.path,
    sample.sourcePath,
    sample.sourceLabel,
    sample.value,
    sample.originalValue,
    decodeForSensitiveSearch(sample.originalValue),
  ].filter(Boolean).join('\n');

  return SENSITIVE_SAMPLE_KEYWORDS.filter(keyword => includesSensitiveKeyword(searchText, keyword));
};

const collectIssueSampleSensitiveHints = (
  samples: TransformIssueSampleExportItem[]
): Array<{ path: string; keywords: string[] }> => (
  samples.flatMap(sample => {
    const keywords = collectIssueSampleSensitiveKeywords(sample);
    return keywords.length > 0 ? [{ path: sample.path, keywords }] : [];
  })
);

const formatIssueSampleSensitiveHint = (
  hint: { path: string; keywords: string[] }
): string => `${hint.path}(${hint.keywords.join('/')})`;

const redactSensitiveIssueSamples = (
  samples: TransformIssueSampleExportItem[]
): TransformIssueSampleExportItem[] => (
  samples.map(sample => {
    const keywords = collectIssueSampleSensitiveKeywords(sample);
    if (keywords.length === 0) return sample;

    return {
      ...sample,
      originalValue: `[REDACTED: ${keywords.join('/')}]`,
      redactionHint: `原始值已脱敏，命中: ${keywords.join('/')}`,
    };
  })
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

export const getTransformDecodedPathCopyText = (
  row: TransformReportDecodedPath
): string => {
  if (row.copyText !== undefined) return row.copyText;

  const value = Object.prototype.hasOwnProperty.call(row, 'value')
    ? row.value as JsonValue
    : row.preview;
  return `${row.path} = ${formatDecodedPathCopyValue(value)}`;
};

export const getTransformPathValueCopyRows = (
  record: TransformReportRecord
): TransformReportDecodedPath[] => (
  record.cmdStructureFocusLabel === '内部 CMD 字段' && record.nestedCommandSearchFields?.length
    ? record.nestedCommandSearchFields
    : record.decodedSearchPaths || record.decodedPaths
);

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

const getRecordCmdStructureSource = (
  record: PathTransformRecord
): { decodedValue: JsonValue; commandSchema?: string; source: string } | null => {
  const schemeStep = [...record.steps].reverse().find(step => (
    step.type === 'scheme_decode' &&
    (step.originalSchemeType === 'url' || step.originalSchemeType === 'query-string')
  ));
  if (!schemeStep) return null;

  const decodedValue = getSchemeDecodedValue(record.steps);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return null;
  }

  const commandSchema = getRecordCommandSchema(record);

  return {
    decodedValue,
    ...(commandSchema ? { commandSchema } : {}),
    source: record.originalValue,
  };
};

const buildCommandParamSummary = (
  cmdParams: JsonValue
): Pick<TransformReportRecord, 'commandParamCount' | 'commandParamKeys'> => {
  if (!cmdParams || typeof cmdParams !== 'object' || Array.isArray(cmdParams)) {
    return {};
  }

  const keys = Object.keys(cmdParams);
  return {
    commandParamCount: keys.length,
    commandParamKeys: keys.slice(0, DEFAULT_COMMAND_PARAM_KEY_LIMIT),
  };
};

type JsonPathSegment = string | number;

// 只解析本文件生成的 JSONPath，用于把筛选命中的内部 CMD 字段投影成聚焦 cmdParams。
const parseGeneratedJsonPath = (path: string): JsonPathSegment[] | null => {
  if (!path.startsWith('$')) return null;

  const segments: JsonPathSegment[] = [];
  let index = 1;
  while (index < path.length) {
    const current = path[index];
    if (current === '.') {
      const start = index + 1;
      index = start;
      while (index < path.length && path[index] !== '.' && path[index] !== '[') {
        index += 1;
      }
      const key = path.slice(start, index);
      if (!key) return null;
      segments.push(key);
      continue;
    }

    if (current === '[') {
      const end = path.indexOf(']', index + 1);
      if (end < 0) return null;

      const rawSegment = path.slice(index + 1, end);
      if (/^\d+$/.test(rawSegment)) {
        segments.push(Number(rawSegment));
      } else {
        try {
          const parsed = JSON.parse(rawSegment) as unknown;
          if (typeof parsed !== 'string') return null;
          segments.push(parsed);
        } catch {
          return null;
        }
      }
      index = end + 1;
      continue;
    }

    return null;
  }

  return segments;
};

const getJsonValueBySegments = (
  value: JsonValue,
  segments: JsonPathSegment[]
): JsonValue | undefined => {
  let current: JsonValue | undefined = value;
  for (const segment of segments) {
    if (current === undefined || current === null || typeof current !== 'object') return undefined;

    current = Array.isArray(current)
      ? typeof segment === 'number' ? current[segment] : undefined
      : current[segment];
  }

  return current;
};

const getJsonPathLeafKey = (path: string): string => {
  const segments = parseGeneratedJsonPath(path);
  if (!segments) return path;

  for (let index = segments.length - 1; index >= 0; index--) {
    const segment = segments[index];
    if (typeof segment === 'string') return segment;
  }

  return path;
};

const createJsonPathContainer = (segment?: JsonPathSegment): JsonValue => (
  typeof segment === 'number' ? [] : {}
);

const setJsonValueBySegments = (
  target: JsonValue,
  segments: JsonPathSegment[],
  value: JsonValue
) => {
  if (segments.length === 0) return;

  let current = target;
  for (let index = 0; index < segments.length - 1; index++) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    if (current === null || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      if (typeof segment !== 'number') return;
      if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
        current[segment] = createJsonPathContainer(nextSegment);
      }
      current = current[segment];
      continue;
    }

    if (typeof segment !== 'string') return;
    if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
      current[segment] = createJsonPathContainer(nextSegment);
    }
    current = current[segment];
  }

  if (current === null || typeof current !== 'object') return;

  const leaf = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (typeof leaf === 'number') current[leaf] = value;
    return;
  }

  if (typeof leaf === 'string') {
    current[leaf] = value;
  }
};

const getRelativeNestedFieldPath = (basePath: string, nestedFieldPath: string): string | null => {
  if (nestedFieldPath === basePath) return '$';
  if (!nestedFieldPath.startsWith(basePath)) return null;

  const suffix = nestedFieldPath.slice(basePath.length);
  return suffix.startsWith('.') || suffix.startsWith('[') ? `$${suffix}` : null;
};

const buildFocusedCmdStructureValue = (
  decodedValue: JsonValue,
  basePath: string,
  focusedFieldPaths: string[]
): JsonValue | null => {
  let focusedRoot: JsonValue | null = null;
  let hasFocusedValue = false;

  focusedFieldPaths.forEach(path => {
    const relativePath = getRelativeNestedFieldPath(basePath, path);
    if (!relativePath) return;

    const segments = parseGeneratedJsonPath(relativePath);
    if (!segments || segments.length === 0) return;

    const value = getJsonValueBySegments(decodedValue, segments);
    if (value === undefined) return;

    if (focusedRoot === null) {
      focusedRoot = createJsonPathContainer(segments[0]);
    }
    setJsonValueBySegments(focusedRoot, segments, value);
    hasFocusedValue = true;
  });

  return hasFocusedValue ? focusedRoot : null;
};

const createRecordCmdStructureCopyTextGetter = (
  source: NonNullable<ReturnType<typeof getRecordCmdStructureSource>>,
  basePath: string
): ((focusedFieldPaths?: string[]) => string) => (focusedFieldPaths) => {
  const focusedValue = focusedFieldPaths?.length
    ? buildFocusedCmdStructureValue(source.decodedValue, basePath, focusedFieldPaths)
    : null;

  return formatCmdHandlerCompatibleResult(
    JSON.stringify(focusedValue || source.decodedValue),
    source.commandSchema,
    source.source
  );
};

export const getTransformRecordCmdStructureCopyText = (
  record: TransformReportRecord
): string => (
  record.cmdStructureFocusPaths?.length
    ? record.getCmdStructureCopyText?.(record.cmdStructureFocusPaths) ||
      record.cmdStructureCopyText ||
      ''
    : record.cmdStructureCopyText || record.getCmdStructureCopyText?.() || ''
);

export const formatTransformCmdStructureComparisonPackageText = (
  record: TransformReportRecord
): string => {
  const cmdStructureCopyText = getTransformRecordCmdStructureCopyText(record);
  if (!cmdStructureCopyText) return '';

  try {
    return JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-cmd-structure-comparison-package',
      tool: APP_VERSION_METADATA,
      path: record.path,
      ...(record.sourceLabel ? { sourceLabel: record.sourceLabel } : {}),
      suggestedCommands: buildCmdComparisonSuggestedCommands(),
      actual: JSON.parse(cmdStructureCopyText) as unknown,
      expected: {},
    }, null, 2);
  } catch {
    return '';
  }
};

const buildNestedInsightSearchFields = (
  recordPath: string,
  rows: Array<{ key: string; path: string; preview: string; value?: unknown; sourceValue?: unknown; copyText?: string }>
): TransformReportDecodedPath[] => rows
  .slice(0, DEFAULT_NESTED_COMMAND_FIELD_SEARCH_LIMIT)
  .map(row => {
    const path = joinJsonPath(recordPath, row.path);
    if (Object.prototype.hasOwnProperty.call(row, 'value')) {
      return {
        path,
        preview: row.preview,
        value: row.value as JsonValue,
        ...(row.sourceValue !== undefined ? { sourceValue: row.sourceValue as JsonValue } : {}),
      };
    }

    return {
      path,
      preview: row.preview,
      copyText: getSchemeInsightFieldCopyText(row).replace(row.path, path),
    };
  });

const withResourceType = (row: TransformReportDecodedPath): TransformReportDecodedPath => {
  const schemaSource = typeof row.sourceValue === 'string'
    ? row.sourceValue
    : typeof row.value === 'string'
      ? row.value
      : undefined;
  const schema = schemaSource ? getUrlResourceSchemaFromUrl(schemaSource) : undefined;
  if (!schema) return row;

  const resourceType = getStaticResourceType(schema, row.path);
  return {
    ...row,
    resourceType,
    resourceTypeLabel: getResourceTypeLabel(resourceType),
  };
};

const buildRecordInsightData = (
  record: PathTransformRecord
): Pick<
  TransformReportRecord,
  | 'insights'
  | 'nestedCommandFields'
  | 'nestedCommandSearchFields'
  | 'indexedNestedCommandFieldCount'
  | 'hasMoreNestedCommandFields'
  | 'nestedResourceFields'
  | 'nestedResourceSearchFields'
  | 'indexedNestedResourceFieldCount'
  | 'hasMoreNestedResourceFields'
  | 'nestedCommandFieldCount'
  | 'nestedResourceFieldCount'
  | 'nestedExtFieldCount'
  | 'nestedBase64SuffixFieldCount'
> => {
  const insights: string[] = [];
  const commandSchema = getRecordCommandSchema(record);
  if (commandSchema) {
    insights.push(`cmdSchema: ${commandSchema}`);
  }

  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {
      insights,
      nestedCommandFields: [],
      indexedNestedCommandFieldCount: 0,
      hasMoreNestedCommandFields: false,
      nestedResourceFields: [],
      indexedNestedResourceFieldCount: 0,
      hasMoreNestedResourceFields: false,
      nestedCommandFieldCount: 0,
      nestedResourceFieldCount: 0,
      nestedExtFieldCount: 0,
      nestedBase64SuffixFieldCount: 0,
    };
  }

  const {
    commandFields,
    commandFieldRows,
    commandFieldCount,
    resourceFields,
    resourceFieldRows,
    resourceFieldCount,
    extFields,
    extFieldCount,
    base64SuffixFields,
    base64SuffixFieldCount,
  } = collectSchemeInsightFields(decodedValue, { source: record.originalValue });
  const nestedCommandSearchFields = buildNestedInsightSearchFields(record.path, commandFieldRows);
  const nestedResourceSearchFields = buildNestedInsightSearchFields(record.path, resourceFieldRows).map(withResourceType);

  const nestedCmdInsight = formatSchemeInsightItems('cmd解析', commandFields);
  const resourceInsight = formatSchemeInsightItems('资源URL', resourceFields);
  const extInsight = formatSchemeInsightItems('ext解析', extFields);
  const suffixInsight = formatSchemeInsightItems('Base64 后缀', base64SuffixFields, 6);

  return {
    insights: [
      ...insights,
      ...(nestedCmdInsight ? [nestedCmdInsight] : []),
      ...(resourceInsight ? [resourceInsight] : []),
      ...(extInsight ? [extInsight] : []),
      ...(suffixInsight ? [suffixInsight] : []),
    ],
    nestedCommandFields: nestedCommandSearchFields.slice(0, DEFAULT_NESTED_COMMAND_FIELD_LIMIT),
    ...(nestedCommandSearchFields.length > 0 ? { nestedCommandSearchFields } : {}),
    indexedNestedCommandFieldCount: nestedCommandSearchFields.length,
    hasMoreNestedCommandFields: commandFieldCount > DEFAULT_NESTED_COMMAND_FIELD_LIMIT,
    nestedResourceFields: nestedResourceSearchFields.slice(0, DEFAULT_NESTED_COMMAND_FIELD_LIMIT),
    ...(nestedResourceSearchFields.length > 0 ? { nestedResourceSearchFields } : {}),
    indexedNestedResourceFieldCount: nestedResourceSearchFields.length,
    hasMoreNestedResourceFields: resourceFieldCount > DEFAULT_NESTED_COMMAND_FIELD_LIMIT,
    nestedCommandFieldCount: commandFieldCount,
    nestedResourceFieldCount: resourceFieldCount,
    nestedExtFieldCount: extFieldCount,
    nestedBase64SuffixFieldCount: base64SuffixFieldCount,
  };
};

const classifyUnresolvedCandidate = (
  candidate: Pick<TransformReportUnresolvedCandidate, 'detectedType' | 'message'>
): Pick<TransformReportUnresolvedCandidate, 'reasonLabel' | 'reasonLevel' | 'nextAction'> => {
  if (candidate.detectedType === 'url-encoded') {
    if (candidate.message.includes('解码失败')) {
      return {
        reasonLabel: 'URL 编码解码失败',
        reasonLevel: 'warning',
        nextAction: '检查该字段是否包含半截 UTF-8、孤立百分号或被日志截断的编码片段；可复制原始值单独确认来源。',
      };
    }

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
  count: number;
  countLimit: number;
  isCountTruncated: boolean;
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
  if (state.count >= state.countLimit) {
    state.hasMore = true;
    state.isCountTruncated = true;
    return;
  }

  state.count += 1;

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
  if (state.isCountTruncated) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedPath(state, createDecodedPathRow(currentPath, value, '数组 0 项'));
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedLeafPaths(value[index], appendJsonPathIndex(currentPath, index), state);
      if (state.isCountTruncated) return;
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
      if (state.isCountTruncated) return;
    }
    return;
  }

  pushDecodedPath(state, createDecodedPathRow(currentPath, value));
};

const buildDecodedPaths = (
  record: PathTransformRecord,
  limit = DEFAULT_DECODED_PATH_LIMIT
): {
  decodedPaths: TransformReportDecodedPath[];
  decodedPathCount: number;
  isDecodedPathCountTruncated: boolean;
  hasMoreDecodedPaths: boolean;
} => {
  const decodedValue = getDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {
      decodedPaths: [],
      decodedPathCount: 0,
      isDecodedPathCountTruncated: false,
      hasMoreDecodedPaths: false,
    };
  }

  const state: DecodedPathCollectState = {
    rows: [],
    limit,
    hasMore: false,
    count: 0,
    countLimit: DEFAULT_DECODED_PATH_COUNT_LIMIT,
    isCountTruncated: false,
  };
  collectDecodedLeafPaths(decodedValue, '$', state);

  return {
    decodedPaths: state.rows.map(row => rebaseDecodedPathRow(record.path, row)),
    decodedPathCount: state.count,
    isDecodedPathCountTruncated: state.isCountTruncated,
    hasMoreDecodedPaths: state.hasMore,
  };
};

const formatDecodedPathCount = (record: Pick<TransformReportRecord, 'decodedPathCount' | 'isDecodedPathCountTruncated'>): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

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
      value,
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
      label: summary.recordCount > 0
        ? `结构解析完成 · 占位符 ${summary.placeholderCount}`
        : `运行时占位符 ${summary.placeholderCount}`,
      level: 'info',
      description: `已展开当前可解析结构，但仍有 ${summary.placeholderCount} 个运行时占位符需要服务端或客户端替换。`,
      items: [
        '占位符不是解析失败，可筛选占位符查看待替换字段',
        '复制来源路径可回到原始 CMD/Scheme 字段排查',
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

const isIssuePriorityQuery = (normalizedQuery: string): boolean => (
  normalizedQuery === '待处理' || normalizedQuery === '问题优先'
);

const matchesResourceType = (
  resourceType: TransformReportResourceType | undefined,
  normalizedQuery: string
): boolean => {
  if (!resourceType) return false;
  return getResourceTypeSearchTokens(resourceType).some(token => token.includes(normalizedQuery));
};

// 短字段名扫整段原始 CMD 会把同源诊断项全部带出；仅对长片段或明显编码/URL 片段兜底。
const shouldSearchLongSourceValue = (normalizedQuery: string): boolean => (
  normalizedQuery.length >= 12 ||
  /[%=&?/:#{}[\]"'\\.]/.test(normalizedQuery)
);

const matchesReportRecord = (
  record: TransformReportRecord,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  includesQuery(record.path, normalizedQuery) ||
  (record.sourceLabel ? includesQuery(record.sourceLabel, normalizedQuery) : false) ||
  (record.commandSchema ? includesQuery(record.commandSchema, normalizedQuery) : false) ||
  (record.commandSchema ? includesQuery(getCommandSchemaOrigin(record.commandSchema), normalizedQuery) : false) ||
  includesQuery(record.labels.join(' '), normalizedQuery) ||
  includesQuery(record.insights.join(' '), normalizedQuery) ||
  includesQuery(getSchemeParamStageSearchText(record.schemeParamStageSummary), normalizedQuery) ||
  (record.hasCmdStructure ? includesQuery(CMD_STRUCTURE_SEARCH_TEXT, normalizedQuery) : false) ||
  (record.nestedCommandFieldCount > 0 ? includesQuery(NESTED_CMD_SEARCH_TEXT, normalizedQuery) : false) ||
  ((record.nestedResourceFieldCount || 0) > 0 ? includesQuery(NESTED_RESOURCE_SEARCH_TEXT, normalizedQuery) : false) ||
  (record.nestedCommandSearchFields
    ? record.nestedCommandSearchFields.some(row => matchesNestedCommandField(row, normalizedQuery))
    : false) ||
  (record.nestedResourceSearchFields
    ? record.nestedResourceSearchFields.some(row => matchesNestedCommandField(row, normalizedQuery))
    : false) ||
  (record.commandSchemaRows
    ? record.commandSchemaRows.some(row => matchesCommandSchemaRow(row, normalizedQuery))
    : false) ||
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
  includesQuery(row.preview, normalizedQuery) ||
  matchesResourceType(row.resourceType, normalizedQuery)
);

const matchesNestedCommandField = (
  row: TransformReportDecodedPath,
  normalizedQuery: string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  matchesResourceType(row.resourceType, normalizedQuery) ||
  (!row.preview.startsWith('对象:') &&
    !row.preview.startsWith('数组 ') &&
    includesQuery(row.preview, normalizedQuery))
);

const matchesCommandSchemaRow = (
  row: TransformReportCommandSchemaRow,
  normalizedQuery: string
): boolean => (
  includesQuery(row.path, normalizedQuery) ||
  includesQuery(row.schema, normalizedQuery) ||
  includesQuery(getCommandSchemaOrigin(row.schema), normalizedQuery)
);

const buildFilteredRecordView = (
  record: TransformReportRecord,
  normalizedQuery: string
): TransformReportRecord => {
  if (!normalizedQuery) return record;

  const matchedDecodedPaths = record.decodedSearchPaths?.filter(row => (
    matchesDecodedPath(row, normalizedQuery)
  )) || [];
  const matchedNestedCommandFields = record.nestedCommandSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [];
  const matchedNestedResourceFields = record.nestedResourceSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [];
  const matchedCommandSchemaRows = record.commandSchemaRows?.filter(row => (
    matchesCommandSchemaRow(row, normalizedQuery)
  )) || [];
  if (
    matchedDecodedPaths.length === 0 &&
    matchedNestedCommandFields.length === 0 &&
    matchedNestedResourceFields.length === 0 &&
    matchedCommandSchemaRows.length === 0
  ) {
    return record;
  }
  const cmdStructureFocusRows = matchedNestedCommandFields.length > 0
    ? matchedNestedCommandFields
    : matchedCommandSchemaRows.length > 0
      ? matchedCommandSchemaRows
      : matchedDecodedPaths;
  const cmdStructureFocusLabel = matchedNestedCommandFields.length > 0
    ? '内部 CMD 字段'
    : matchedCommandSchemaRows.length > 0
      ? 'CMD Schema'
      : '内部路径';

  return {
    ...record,
    ...(matchedDecodedPaths.length > 0
      ? {
          decodedSearchPaths: matchedDecodedPaths,
          decodedPaths: matchedDecodedPaths.slice(0, DEFAULT_DECODED_PATH_LIMIT),
          decodedPathCount: matchedDecodedPaths.length,
          isDecodedPathCountTruncated: false,
          indexedDecodedPathCount: matchedDecodedPaths.length,
          hasMoreDecodedPaths: matchedDecodedPaths.length > DEFAULT_DECODED_PATH_LIMIT,
        }
      : {}),
    ...(matchedNestedCommandFields.length > 0
      ? {
          nestedCommandSearchFields: matchedNestedCommandFields,
          nestedCommandFields: matchedNestedCommandFields.slice(0, DEFAULT_NESTED_COMMAND_FIELD_LIMIT),
          nestedCommandFieldCount: matchedNestedCommandFields.length,
          indexedNestedCommandFieldCount: matchedNestedCommandFields.length,
          hasMoreNestedCommandFields: matchedNestedCommandFields.length > DEFAULT_NESTED_COMMAND_FIELD_LIMIT,
        }
      : matchedDecodedPaths.length > 0
        ? {
            nestedCommandSearchFields: [],
            nestedCommandFields: [],
            nestedCommandFieldCount: 0,
            indexedNestedCommandFieldCount: 0,
            hasMoreNestedCommandFields: false,
          }
        : {}),
    ...(matchedNestedResourceFields.length > 0
      ? {
          nestedResourceSearchFields: matchedNestedResourceFields,
          nestedResourceFields: matchedNestedResourceFields.slice(0, DEFAULT_NESTED_COMMAND_FIELD_LIMIT),
          nestedResourceFieldCount: matchedNestedResourceFields.length,
          indexedNestedResourceFieldCount: matchedNestedResourceFields.length,
          hasMoreNestedResourceFields: matchedNestedResourceFields.length > DEFAULT_NESTED_COMMAND_FIELD_LIMIT,
        }
      : matchedDecodedPaths.length > 0
        ? {
            nestedResourceSearchFields: [],
            nestedResourceFields: [],
            nestedResourceFieldCount: 0,
            indexedNestedResourceFieldCount: 0,
            hasMoreNestedResourceFields: false,
          }
        : {}),
    ...(matchedCommandSchemaRows.length > 0
      ? { commandSchemaRows: matchedCommandSchemaRows }
      : {}),
    ...(record.hasCmdStructure && cmdStructureFocusRows.length > 0
      ? {
          cmdStructureFocusPaths: cmdStructureFocusRows.map(row => row.path),
          cmdStructureFocusCount: cmdStructureFocusRows.length,
          cmdStructureFocusLabel,
        }
      : {}),
  };
};

const matchesReportWarning = (
  warning: TransformReportWarning,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(warning.path, normalizedQuery) ||
  (warning.sourceLabel ? includesQuery(warning.sourceLabel, normalizedQuery) : false) ||
  includesQuery(WARNING_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(warning.message, normalizedQuery) ||
  includesQuery(warning.reasonLabel, normalizedQuery) ||
  includesQuery(warning.nextAction, normalizedQuery) ||
  (shouldSearchLongSourceValue(normalizedQuery) ? includesQuery(warning.originalValue, normalizedQuery) : false)
);

const matchesUnresolvedCandidate = (
  candidate: TransformReportUnresolvedCandidate,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(candidate.path, normalizedQuery) ||
  (candidate.sourceLabel ? includesQuery(candidate.sourceLabel, normalizedQuery) : false) ||
  includesQuery(UNRESOLVED_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(candidate.message, normalizedQuery) ||
  includesQuery(candidate.preview, normalizedQuery) ||
  includesQuery(candidate.reasonLabel, normalizedQuery) ||
  includesQuery(candidate.nextAction, normalizedQuery) ||
  (candidate.detectedType ? includesQuery(candidate.detectedType, normalizedQuery) : false) ||
  (shouldSearchLongSourceValue(normalizedQuery) ? includesQuery(candidate.originalValue, normalizedQuery) : false)
);

const matchesRuntimePlaceholder = (
  placeholder: TransformReportRuntimePlaceholder,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(placeholder.path, normalizedQuery) ||
  includesQuery(placeholder.sourcePath, normalizedQuery) ||
  (placeholder.sourceLabel ? includesQuery(placeholder.sourceLabel, normalizedQuery) : false) ||
  includesQuery(PLACEHOLDER_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(placeholder.value, normalizedQuery) ||
  includesQuery(placeholder.description, normalizedQuery) ||
  (placeholder.sourceOriginalValue && shouldSearchLongSourceValue(normalizedQuery)
    ? includesQuery(placeholder.sourceOriginalValue, normalizedQuery)
    : false)
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

const addSchemeParamStageBuckets = (
  target: Map<string, number>,
  buckets: TransformSchemeParamStageSummaryBucket[]
) => {
  buckets.forEach(bucket => {
    target.set(bucket.key, (target.get(bucket.key) || 0) + bucket.count);
  });
};

const buildSchemeParamStageBucketsFromMap = (
  bucketMap: Map<string, number>
): TransformSchemeParamStageSummaryBucket[] => (
  Array.from(bucketMap.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT)
);

const getRecordSchemeParamStageSummary = (
  record: PathTransformRecord
): TransformSchemeParamStageSummary | undefined => {
  const summaries = record.steps
    .map(step => step.schemeParamStageSummary)
    .filter((summary): summary is TransformSchemeParamStageSummary => Boolean(summary));
  if (summaries.length === 0) return undefined;

  const sources = new Map<string, number>();
  const keys = new Map<string, number>();
  const repairHintLabels = new Map<string, number>();
  const samples: TransformSchemeParamStageSummary['samples'] = [];

  summaries.forEach(summary => {
    addSchemeParamStageBuckets(sources, summary.sources);
    addSchemeParamStageBuckets(keys, summary.keys);
    addSchemeParamStageBuckets(repairHintLabels, summary.repairHintLabels);
    if (samples.length < DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT) {
      samples.push(...summary.samples.slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT - samples.length));
    }
  });

  return {
    total: summaries.reduce((count, summary) => count + summary.total, 0),
    repairHints: summaries.reduce((count, summary) => count + summary.repairHints, 0),
    nonReversible: summaries.reduce((count, summary) => count + summary.nonReversible, 0),
    sources: buildSchemeParamStageBucketsFromMap(sources),
    keys: buildSchemeParamStageBucketsFromMap(keys),
    repairHintLabels: buildSchemeParamStageBucketsFromMap(repairHintLabels),
    samples,
  };
};

const sumSchemeParamStageCount = (records: TransformReportRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.total || 0), 0)
);

const sumSchemeParamStageRepairHintCount = (records: TransformReportRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.repairHints || 0), 0)
);

const sumNonReversibleParamStageCount = (records: TransformReportRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.nonReversible || 0), 0)
);

const buildSchemeParamStageQualityBuckets = (
  records: TransformReportRecord[],
  getBuckets: (summary: TransformSchemeParamStageSummary) => TransformSchemeParamStageSummaryBucket[]
): TransformQualitySnapshotBucket[] => {
  const bucketMap = new Map<string, { count: number; paths: string[] }>();

  records.forEach(record => {
    const summary = record.schemeParamStageSummary;
    if (!summary) return;

    getBuckets(summary).forEach(summaryBucket => {
      const bucket = bucketMap.get(summaryBucket.key) || { count: 0, paths: [] };
      bucket.count += summaryBucket.count;
      if (bucket.paths.length < DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT && !bucket.paths.includes(record.path)) {
        bucket.paths.push(record.path);
      }
      bucketMap.set(summaryBucket.key, bucket);
    });
  });

  return Array.from(bucketMap.entries())
    .map(([key, bucket]) => ({ key, count: bucket.count, paths: bucket.paths }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT);
};

const getSchemeParamStageSearchText = (
  summary: TransformSchemeParamStageSummary | undefined
): string => {
  if (!summary) return '';

  return [
    '参数层',
    'param stage',
    ...summary.sources.map(bucket => bucket.key),
    ...summary.keys.map(bucket => bucket.key),
    ...summary.repairHintLabels.map(bucket => bucket.key),
    ...summary.samples.flatMap(sample => [
      sample.path,
      sample.key,
      sample.source,
      sample.repairHint || '',
      sample.reversible ? '可回写' : '不可回写',
    ]),
  ].filter(Boolean).join(' ');
};

const buildTopNestedCommandFieldGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT
): TransformReportNestedCommandFieldGroup[] => {
  const groups = new Map<string, {
    key: string;
    count: number;
    recordPaths: Set<string>;
    paths: string[];
    hasMorePaths: boolean;
  }>();

  records.forEach(record => {
    record.nestedCommandSearchFields?.forEach(row => {
      const key = getJsonPathLeafKey(row.path);
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          count: 0,
          recordPaths: new Set(),
          paths: [],
          hasMorePaths: false,
        };
        groups.set(key, group);
      }

      group.count += 1;
      group.recordPaths.add(record.path);
      if (group.paths.length < DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT) {
        group.paths.push(row.path);
      } else {
        group.hasMorePaths = true;
      }
    });
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, limit)
    .map(group => ({
      key: group.key,
      count: group.count,
      recordCount: group.recordPaths.size,
      paths: group.paths,
      hasMorePaths: group.hasMorePaths,
    }));
};

const buildTopNestedResourceFieldGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT
): TransformReportNestedCommandFieldGroup[] => {
  const groups = new Map<string, {
    key: string;
    count: number;
    recordPaths: Set<string>;
    paths: string[];
    hasMorePaths: boolean;
  }>();

  records.forEach(record => {
    record.nestedResourceSearchFields?.forEach(row => {
      const key = getJsonPathLeafKey(row.path);
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          count: 0,
          recordPaths: new Set(),
          paths: [],
          hasMorePaths: false,
        };
        groups.set(key, group);
      }

      group.count += 1;
      group.recordPaths.add(record.path);
      if (group.paths.length < DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT) {
        group.paths.push(row.path);
      } else {
        group.hasMorePaths = true;
      }
    });
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, limit)
    .map(group => ({
      key: group.key,
      count: group.count,
      recordCount: group.recordPaths.size,
      paths: group.paths,
      hasMorePaths: group.hasMorePaths,
    }));
};

interface CommandSchemaOccurrence {
  schema: string;
  path: string;
  recordPath: string;
  kind: 'navigation' | 'resource';
  resourceType?: TransformReportResourceType;
}

const STATIC_RESOURCE_SCHEMA_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp|mp4|m4v|mov|webm|avi|m3u8|mp3|wav|aac|ogg|flac|m4a|lottie|apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;
const STATIC_RESOURCE_PATH_RE = /(?:^|[.[\]"])(?:image|img|icon|logo|avatar|portrait|poster|cover|lottie|video_url|audio_url|media_url|swipe_up_lottie)(?:$|[.[\]"])/i;

const RESOURCE_TYPE_LABELS: Record<TransformReportResourceType, string> = {
  image: '图片',
  video: '视频',
  lottie: 'Lottie',
  audio: '音频',
  package: '包/压缩',
  other: '其他',
};

const VIDEO_RESOURCE_EXTENSION_RE = /\.(?:mp4|m4v|mov|webm|avi|m3u8)$/i;
const IMAGE_RESOURCE_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const AUDIO_RESOURCE_EXTENSION_RE = /\.(?:mp3|wav|aac|ogg|flac|m4a)$/i;
const PACKAGE_RESOURCE_EXTENSION_RE = /\.(?:apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;

const getStaticResourcePathname = (schema: string): string => {
  const normalizedSchema = schema.trim().replace(/\\\//g, '/');
  try {
    return new URL(normalizedSchema).pathname;
  } catch {
    return normalizedSchema.split(/[?#]/)[0] || normalizedSchema;
  }
};

const getStaticResourceType = (
  schema: string,
  path: string
): TransformReportResourceType => {
  const pathname = getStaticResourcePathname(schema);
  const normalizedPath = path.toLowerCase();
  const compactPath = normalizedPath.replace(/[^a-z0-9]/g, '');
  const haystack = `${pathname} ${normalizedPath}`.toLowerCase();

  if (pathname.toLowerCase().endsWith('.lottie') || haystack.includes('lottie')) return 'lottie';
  if (VIDEO_RESOURCE_EXTENSION_RE.test(pathname) || compactPath.includes('videourl') || compactPath.includes('mediaurl')) {
    return 'video';
  }
  if (
    IMAGE_RESOURCE_EXTENSION_RE.test(pathname) ||
    ['image', 'img', 'icon', 'logo', 'avatar', 'portrait', 'poster', 'cover'].some(keyword => compactPath.includes(keyword))
  ) {
    return 'image';
  }
  if (AUDIO_RESOURCE_EXTENSION_RE.test(pathname) || compactPath.includes('audiourl') || compactPath.includes('audio')) {
    return 'audio';
  }
  if (PACKAGE_RESOURCE_EXTENSION_RE.test(pathname)) return 'package';

  return 'other';
};

const getResourceTypeLabel = (resourceType: TransformReportResourceType): string => (
  RESOURCE_TYPE_LABELS[resourceType]
);

const getResourceTypeQuery = (resourceType: TransformReportResourceType): string => (
  `资源类型:${getResourceTypeLabel(resourceType)}`
);

const getResourceTypeSearchTokens = (resourceType: TransformReportResourceType): string[] => {
  const label = getResourceTypeLabel(resourceType);
  return [
    resourceType,
    label,
    getResourceTypeQuery(resourceType),
    `resource:${resourceType}`,
  ].map(token => token.toLowerCase());
};

const isStaticResourceSchema = (schema: string, path: string): boolean => {
  const normalizedSchema = schema.trim().replace(/\\\//g, '/');
  try {
    const url = new URL(normalizedSchema);
    if (STATIC_RESOURCE_SCHEMA_EXTENSION_RE.test(url.pathname)) return true;
  } catch {
    if (STATIC_RESOURCE_SCHEMA_EXTENSION_RE.test(normalizedSchema.split(/[?#]/)[0] || '')) return true;
  }

  return STATIC_RESOURCE_PATH_RE.test(path);
};

const collectCommandSchemaOccurrences = (
  records: TransformReportRecord[]
): CommandSchemaOccurrence[] => {
  const occurrences: CommandSchemaOccurrence[] = [];

  const pushSchema = (schema: string | undefined, path: string, recordPath: string) => {
    if (!schema) return;
    const kind = isStaticResourceSchema(schema, path) ? 'resource' : 'navigation';
    occurrences.push({
      schema,
      path,
      recordPath,
      kind,
      ...(kind === 'resource' ? { resourceType: getStaticResourceType(schema, path) } : {}),
    });
  };

  const pushResourceSchema = (row: TransformReportDecodedPath, recordPath: string) => {
    const schemaSource = typeof row.sourceValue === 'string'
      ? row.sourceValue
      : typeof row.value === 'string'
        ? row.value
        : undefined;
    const schema = schemaSource
      ? getUrlResourceSchemaFromUrl(schemaSource)
      : undefined;
    if (!schema) return;

    occurrences.push({
      schema,
      path: row.path,
      recordPath,
      kind: 'resource',
      resourceType: getStaticResourceType(schema, row.path),
    });
  };

  records.forEach(record => {
    pushSchema(record.commandSchema, record.path, record.path);
    record.commandSchemaRows?.forEach(row => {
      pushSchema(row.schema, row.path, record.path);
    });
    record.nestedResourceSearchFields?.forEach(row => {
      pushResourceSchema(row, record.path);
    });
  });

  return occurrences;
};

const buildTopCommandSchemaGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
  kind: CommandSchemaOccurrence['kind'] = 'navigation'
): TransformReportCommandSchemaGroup[] => {
  const groups = new Map<string, {
    schema: string;
    count: number;
    recordPaths: Set<string>;
    paths: string[];
    hasMorePaths: boolean;
    resourceType?: TransformReportResourceType;
  }>();

  collectCommandSchemaOccurrences(records).forEach(({ schema, path, recordPath, kind: occurrenceKind, resourceType }) => {
    if (occurrenceKind !== kind) return;

    let group = groups.get(schema);
    if (!group) {
      group = {
        schema,
        count: 0,
        recordPaths: new Set(),
        paths: [],
        hasMorePaths: false,
        ...(resourceType ? { resourceType } : {}),
      };
      groups.set(schema, group);
    } else if (resourceType && group.resourceType === 'other') {
      group.resourceType = resourceType;
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    if (group.paths.length < DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT) {
      group.paths.push(path);
    } else {
      group.hasMorePaths = true;
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.schema.localeCompare(right.schema))
    .slice(0, limit)
    .map(group => ({
      schema: group.schema,
      count: group.count,
      recordCount: group.recordPaths.size,
      paths: group.paths,
      hasMorePaths: group.hasMorePaths,
      ...(group.resourceType
        ? {
          resourceType: group.resourceType,
          resourceTypeLabel: getResourceTypeLabel(group.resourceType),
        }
        : {}),
    }));
};

const buildTopResourceTypeGroups = (
  records: TransformReportRecord[]
): TransformReportResourceTypeGroup[] => {
  const resourceOccurrences = collectCommandSchemaOccurrences(records).filter(occurrence => (
    occurrence.kind === 'resource' && occurrence.resourceType
  ));
  const totalCount = resourceOccurrences.length;
  if (totalCount === 0) return [];

  const groups = new Map<TransformReportResourceType, {
    resourceType: TransformReportResourceType;
    count: number;
    recordPaths: Set<string>;
    schemas: string[];
    schemaSet: Set<string>;
    hasMoreSchemas: boolean;
  }>();

  resourceOccurrences.forEach(({ schema, recordPath, resourceType }) => {
    if (!resourceType) return;

    let group = groups.get(resourceType);
    if (!group) {
      group = {
        resourceType,
        count: 0,
        recordPaths: new Set(),
        schemas: [],
        schemaSet: new Set(),
        hasMoreSchemas: false,
      };
      groups.set(resourceType, group);
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    group.schemaSet.add(schema);
    if (group.schemas.includes(schema)) return;
    if (group.schemas.length < DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT) {
      group.schemas.push(schema);
    } else {
      group.hasMoreSchemas = true;
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => (
      right.count - left.count ||
      getResourceTypeLabel(left.resourceType).localeCompare(getResourceTypeLabel(right.resourceType))
    ))
    .map(group => ({
      resourceType: group.resourceType,
      resourceTypeLabel: getResourceTypeLabel(group.resourceType),
      query: getResourceTypeQuery(group.resourceType),
      count: group.count,
      percentage: Number(((group.count / totalCount) * 100).toFixed(1)),
      recordCount: group.recordPaths.size,
      schemaCount: group.schemaSet.size,
      schemas: group.schemas,
      hasMoreSchemas: group.hasMoreSchemas,
    }));
};

const getCommandSchemaOrigin = (schema: string): string => {
  const trimmed = schema.trim().replace(/\\\//g, '/');
  const protocolRelativeMatch = trimmed.match(/^\/\/([^/?#\s]+)/);
  if (protocolRelativeMatch) return `//${protocolRelativeMatch[1]}`;

  const absoluteMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)\/\/([^/?#\s]+)/);
  if (absoluteMatch) return `${absoluteMatch[1]}//${absoluteMatch[2]}`;

  const protocolMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)/);
  return protocolMatch ? protocolMatch[1] : trimmed;
};

const buildTopCommandSchemaOriginGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_LIMIT,
  kind: CommandSchemaOccurrence['kind'] = 'navigation'
): TransformReportCommandSchemaOriginGroup[] => {
  const groups = new Map<string, {
    origin: string;
    count: number;
    recordPaths: Set<string>;
    schemas: Set<string>;
    visibleSchemas: string[];
    hasMoreSchemas: boolean;
  }>();

  collectCommandSchemaOccurrences(records).forEach(({ schema, recordPath, kind: occurrenceKind }) => {
    if (occurrenceKind !== kind) return;

    const origin = getCommandSchemaOrigin(schema);
    let group = groups.get(origin);
    if (!group) {
      group = {
        origin,
        count: 0,
        recordPaths: new Set(),
        schemas: new Set(),
        visibleSchemas: [],
        hasMoreSchemas: false,
      };
      groups.set(origin, group);
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    if (!group.schemas.has(schema)) {
      group.schemas.add(schema);
      if (group.visibleSchemas.length < DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT) {
        group.visibleSchemas.push(schema);
      } else {
        group.hasMoreSchemas = true;
      }
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.origin.localeCompare(right.origin))
    .slice(0, limit)
    .map(group => ({
      origin: group.origin,
      count: group.count,
      schemaCount: group.schemas.size,
      recordCount: group.recordPaths.size,
      schemas: group.visibleSchemas,
      hasMoreSchemas: group.hasMoreSchemas,
    }));
};

export const buildTransformContextReport = (
  context: TransformContext
): TransformContextReport => {
	  const records: TransformReportRecord[] = Array.from(context.records.values()).map(record => {
    const {
      decodedPaths,
      decodedPathCount,
      isDecodedPathCountTruncated,
      hasMoreDecodedPaths,
    } = buildDecodedPaths(record);
    const decodedSearchData = buildDecodedSearchData(record);
	    const cmdStructureSource = getRecordCmdStructureSource(record);
	    const insightData = buildRecordInsightData(record);
	    const commandSchema = getRecordCommandSchema(record);
	    const schemeParamStageSummary = getRecordSchemeParamStageSummary(record);
    const commandSchemaRows = cmdStructureSource
      ? collectCmdHandlerCommandSchemaRows(
          cmdStructureSource.decodedValue,
          cmdStructureSource.source
        ).map(row => ({
          ...row,
          path: joinJsonPath(record.path, row.path),
        }))
      : [];

    return {
      path: record.path,
      sourceLabel: record.sourceLabel,
      ...(commandSchema ? { commandSchema } : {}),
      ...(commandSchemaRows.length > 0 ? { commandSchemaRows } : {}),
      ...(cmdStructureSource ? buildCommandParamSummary(cmdStructureSource.decodedValue) : {}),
      labels: record.steps.map(getStepLabel),
      ...insightData,
      originalValue: record.originalValue,
      originalPreview: formatOriginalPreview(record.originalValue),
      decodedPreview: getDecodedPreview(record),
      ...decodedSearchData,
      decodedPaths,
      decodedPathCount,
      isDecodedPathCountTruncated,
      indexedDecodedPathCount: decodedSearchData.decodedSearchPaths?.length || decodedPaths.length,
      hasMoreDecodedPaths,
      hasCmdStructure: Boolean(cmdStructureSource),
      ...(cmdStructureSource
        ? { getCmdStructureCopyText: createRecordCmdStructureCopyTextGetter(cmdStructureSource, record.path) }
        : {}),
	      stepCount: record.steps.length,
	      hasNonReversibleScheme: record.steps.some(
	        step => step.type === 'scheme_decode' && step.originalSchemeReversible === false
	      ),
	      ...(schemeParamStageSummary ? { schemeParamStageSummary } : {}),
	    };
	  });
  const cmdStructureCount = records.filter(record => record.hasCmdStructure).length;
  const nestedCommandFieldCount = records.reduce((count, record) => (
    count + record.nestedCommandFieldCount
  ), 0);
  const nestedResourceFieldCount = records.reduce((count, record) => (
    count + (record.nestedResourceFieldCount || 0)
  ), 0);
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
    cmdStructureCount,
    nestedCommandFieldCount,
    nestedResourceFieldCount,
    topCommandSchemaOrigins: buildTopCommandSchemaOriginGroups(records),
    topCommandSchemas: buildTopCommandSchemaGroups(records),
    topResourceSchemas: buildTopCommandSchemaGroups(records, DEFAULT_TOP_COMMAND_SCHEMA_LIMIT, 'resource'),
    topResourceTypes: buildTopResourceTypeGroups(records),
    topNestedCommandFields: buildTopNestedCommandFieldGroups(records),
    topNestedResourceFields: buildTopNestedResourceFieldGroups(records),
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
    `工具版本: ${APP_VERSION_LABEL}`,
    report.coverage.label,
    `覆盖说明: ${report.coverage.description}`,
    ...report.coverage.items.map(item => `- ${item}`),
    '',
  ];

  appendCommandSchemaOriginSummarySection(lines, report.topCommandSchemaOrigins || []);
  appendCommandSchemaSummarySection(lines, report.topCommandSchemas || []);
  appendResourceTypeSummarySection(lines, report.topResourceTypes || []);
  appendResourceSchemaSummarySection(lines, report.topResourceSchemas || []);
  appendNestedCommandFieldSummarySection(lines, report.topNestedCommandFields || []);
  appendNestedResourceFieldSummarySection(lines, report.topNestedResourceFields || []);
  lines.push('展开记录:');
  appendReportRecordLines(lines, report.records);
  appendReportWarningSection(lines, report.warnings);
  appendReportUnresolvedSection(lines, report.unresolvedCandidates);
  appendReportPlaceholderSection(lines, report.runtimePlaceholderGroups, report.runtimePlaceholders);

  return lines.join('\n');
};

const appendCommandSchemaOriginSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaOriginGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('CMD 来源分布:');
  groups.forEach(group => {
    lines.push(`- ${group.origin} ×${group.count}（Schema ${group.schemaCount} / 来源记录 ${group.recordCount}）`);
    lines.push(`  示例Schema: ${group.schemas.join('；')}${group.hasMoreSchemas ? '；...' : ''}`);
  });
  lines.push('');
};

const appendCommandSchemaSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('CMD Schema 分布:');
  groups.forEach(group => {
    lines.push(`- ${group.schema} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

const formatResourceSchemaGroupTitle = (group: TransformReportCommandSchemaGroup): string => (
  group.resourceTypeLabel ? `[${group.resourceTypeLabel}] ${group.schema}` : group.schema
);

const appendResourceTypeSummarySection = (
  lines: string[],
  groups: TransformReportResourceTypeGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源类型分布:');
  groups.forEach(group => {
    lines.push(
      `- ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}（URL ${group.schemaCount} / 来源记录 ${group.recordCount}）`
    );
    lines.push(`  示例URL: ${group.schemas.join('；')}${group.hasMoreSchemas ? '；...' : ''}`);
  });
  lines.push('');
};

const appendResourceSchemaSummarySection = (
  lines: string[],
  groups: TransformReportCommandSchemaGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源 URL 分布:');
  groups.forEach(group => {
    lines.push(`- ${formatResourceSchemaGroupTitle(group)} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

const appendNestedCommandFieldSummarySection = (
  lines: string[],
  groups: TransformReportNestedCommandFieldGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('内部CMD字段分布:');
  groups.forEach(group => {
    lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
};

const appendNestedResourceFieldSummarySection = (
  lines: string[],
  groups: TransformReportNestedCommandFieldGroup[]
) => {
  if (groups.length === 0) return;

  lines.push('静态资源字段分布:');
  groups.forEach(group => {
    lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    lines.push(`  示例路径: ${group.paths.join('；')}${group.hasMorePaths ? '；...' : ''}`);
  });
  lines.push('');
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
        lines.push(`  ${formatSourceLabelText(record.sourceLabel)}`);
      }
      if (record.decodedPreview) {
        lines.push(`  解析结果: ${record.decodedPreview}`);
      }
      if (record.insights.length > 0) {
        lines.push(`  解析线索: ${record.insights.join('；')}`);
      }
	      if (record.commandParamCount !== undefined) {
	        const visibleKeys = record.commandParamKeys || [];
	        const hiddenKeyCount = Math.max(record.commandParamCount - visibleKeys.length, 0);
	        lines.push(
	          `  cmdParams: ${record.commandParamCount} 个顶层参数${
	            visibleKeys.length > 0
	              ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
	              : ''
	          }`
	        );
	      }
	      if (record.schemeParamStageSummary) {
	        const visibleKeys = record.schemeParamStageSummary.keys.map(bucket => bucket.key);
	        const hiddenKeyCount = Math.max(record.schemeParamStageSummary.total - visibleKeys.length, 0);
	        lines.push(
	          `  参数分层: ${record.schemeParamStageSummary.total} 个${
	            visibleKeys.length > 0
	              ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
	              : ''
	          }`
	        );
	        if (record.schemeParamStageSummary.repairHints > 0) {
	          lines.push(`  参数修复提示: ${record.schemeParamStageSummary.repairHints}`);
	        }
	        if (record.schemeParamStageSummary.nonReversible > 0) {
	          lines.push(`  参数不可回写: ${record.schemeParamStageSummary.nonReversible}`);
	        }
	      }
      if (record.commandSchemaRows?.length) {
        const rows = record.commandSchemaRows.slice(0, DEFAULT_COMMAND_SCHEMA_ROW_LIMIT);
        lines.push(`  CMD Schema路径: ${rows.map(row => `${row.path}=${row.schema}`).join('；')}`);
        if (record.commandSchemaRows.length > rows.length) {
          lines.push(`  CMD Schema路径: 还有更多未展示（总计 ${record.commandSchemaRows.length} 条）`);
        }
      }
      if (record.nestedCommandFields.length > 0) {
        lines.push(`  内部CMD字段: ${record.nestedCommandFields.map(row => `${row.path}=${row.preview}`).join('；')}`);
      }
      if (record.hasMoreNestedCommandFields) {
        lines.push(
          `  内部CMD字段: 还有更多未展示（总计 ${record.nestedCommandFieldCount} 个，已索引 ${record.indexedNestedCommandFieldCount} 个）`
        );
      }
      if (record.nestedResourceFields?.length) {
        lines.push(`  资源URL字段: ${record.nestedResourceFields.map(row => `${row.path}=${row.preview}`).join('；')}`);
      }
      if (record.hasMoreNestedResourceFields) {
        lines.push(
          `  资源URL字段: 还有更多未展示（总计 ${record.nestedResourceFieldCount || 0} 个，已索引 ${record.indexedNestedResourceFieldCount || 0} 个）`
        );
      }
      if (record.decodedPaths.length > 0) {
        lines.push(`  内部路径: ${record.decodedPaths.map(row => `${row.path}=${row.preview}`).join('；')}`);
      }
      if (record.hasMoreDecodedPaths) {
        lines.push(`  内部路径: 还有更多未展示（总计 ${formatDecodedPathCount(record)} 条）`);
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
        lines.push(`  ${formatSourceLabelText(warning.sourceLabel)}`);
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
        lines.push(`  ${formatSourceLabelText(candidate.sourceLabel)}`);
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
        `${source.sourceLabel ? `${getSourceLabelDisplayValue(source.sourceLabel)} ` : ''}${source.sourcePath} ×${source.count}`
      )).join('；')}`);
    });

    lines.push('', '运行时占位符明细:');
    runtimePlaceholders.forEach(placeholder => {
      lines.push(`- ${placeholder.path}: ${placeholder.value}`);
      lines.push(`  来源: ${placeholder.sourcePath}`);
      if (placeholder.sourceLabel) {
        lines.push(`  ${formatSourceLabelText(placeholder.sourceLabel)}`);
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
  const cmdStructureLimit = options?.cmdStructureLimit ?? DEFAULT_TRANSFORM_REPORT_CMD_STRUCTURE_LIMIT;
  const filteredRecords = report.records.filter(record => matchesReportRecord(record, normalizedQuery));
  const filteredWarnings = report.warnings.filter(warning => matchesReportWarning(warning, normalizedQuery));
  const filteredUnresolved = report.unresolvedCandidates.filter(
    candidate => matchesUnresolvedCandidate(candidate, normalizedQuery)
  );
  const filteredPlaceholders = report.runtimePlaceholders.filter(
    placeholder => matchesRuntimePlaceholder(placeholder, normalizedQuery)
  );
  const filteredRecordViews = filteredRecords.map(record => (
    buildFilteredRecordView(record, normalizedQuery)
  ));
  const filteredCmdStructureRecords = filteredRecordViews.filter(record => record.hasCmdStructure);
  const filteredCmdStructureCount = filteredCmdStructureRecords.length;
  const filteredNestedCommandFieldCount = filteredRecordViews.reduce((count, record) => (
    count + record.nestedCommandFieldCount
  ), 0);
  const filteredNestedResourceFieldCount = filteredRecordViews.reduce((count, record) => (
    count + (record.nestedResourceFieldCount || 0)
  ), 0);
  const filteredSchemeParamStageCount = sumSchemeParamStageCount(filteredRecordViews);
  const filteredSchemeParamStageRepairHintCount = sumSchemeParamStageRepairHintCount(filteredRecordViews);
  const filteredNonReversibleParamStageCount = sumNonReversibleParamStageCount(filteredRecordViews);
  const totalSchemeParamStageCount = sumSchemeParamStageCount(report.records);
  const totalSchemeParamStageRepairHintCount = sumSchemeParamStageRepairHintCount(report.records);
  const totalNonReversibleParamStageCount = sumNonReversibleParamStageCount(report.records);

  return {
    records: filteredRecordViews.slice(0, recordLimit),
    cmdStructureRecords: filteredCmdStructureRecords.slice(0, cmdStructureLimit),
    warnings: filteredWarnings.slice(0, warningLimit),
    unresolvedCandidates: filteredUnresolved.slice(0, unresolvedLimit),
    runtimePlaceholderGroups: buildRuntimePlaceholderGroups(filteredPlaceholders),
    runtimePlaceholders: filteredPlaceholders.slice(0, placeholderLimit),
    filteredRecordCount: filteredRecords.length,
    filteredWarningCount: filteredWarnings.length,
    filteredUnresolvedCount: filteredUnresolved.length,
    filteredPlaceholderCount: filteredPlaceholders.length,
    filteredSchemeParamStageCount,
    filteredSchemeParamStageRepairHintCount,
    filteredNonReversibleParamStageCount,
    filteredCmdStructureCount,
    filteredNestedCommandFieldCount,
    filteredNestedResourceFieldCount,
    totalRecordCount: report.records.length,
    totalWarningCount: report.warnings.length,
    totalUnresolvedCount: report.unresolvedCandidates.length,
    totalPlaceholderCount: report.runtimePlaceholders.length,
    totalSchemeParamStageCount,
    totalSchemeParamStageRepairHintCount,
    totalNonReversibleParamStageCount,
    totalCmdStructureCount: report.cmdStructureCount,
    totalNestedCommandFieldCount: report.nestedCommandFieldCount,
    totalNestedResourceFieldCount: report.nestedResourceFieldCount || 0,
    isRecordTruncated: filteredRecords.length > recordLimit,
    isCmdStructureTruncated: filteredCmdStructureRecords.length > cmdStructureLimit,
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
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${normalizedQuery || '全部'}`,
    `筛选结果: 展开 ${reportView.filteredRecordCount}/${reportView.totalRecordCount}，内部CMD字段 ${reportView.filteredNestedCommandFieldCount}/${reportView.totalNestedCommandFieldCount}，资源字段 ${reportView.filteredNestedResourceFieldCount}/${reportView.totalNestedResourceFieldCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}，参数层 ${reportView.filteredSchemeParamStageCount}/${reportView.totalSchemeParamStageCount}，参数修复 ${reportView.filteredSchemeParamStageRepairHintCount}/${reportView.totalSchemeParamStageRepairHintCount}，待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}`,
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

export const formatTransformDiagnosticSummaryText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    '深度解析诊断摘要',
    `工具版本: ${APP_VERSION_LABEL}`,
    report.summaryText || '深度解析: 无展开记录',
    `筛选: ${normalizedQuery || '全部'}`,
    `覆盖: ${report.coverage.label}，${report.coverage.description}`,
    `规模: 展开 ${reportView.filteredRecordCount}/${reportView.totalRecordCount}，CMD结构 ${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount}，内部CMD字段 ${reportView.filteredNestedCommandFieldCount}/${reportView.totalNestedCommandFieldCount}，资源字段 ${reportView.filteredNestedResourceFieldCount}/${reportView.totalNestedResourceFieldCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}，参数层 ${reportView.filteredSchemeParamStageCount}/${reportView.totalSchemeParamStageCount}，参数修复 ${reportView.filteredSchemeParamStageRepairHintCount}/${reportView.totalSchemeParamStageRepairHintCount}，待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}`,
  ];

  if (report.topCommandSchemas?.length) {
    lines.push('', '全量 CMD Schema Top:');
    report.topCommandSchemas.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.schema} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topResourceSchemas?.length) {
    lines.push('', '全量静态资源 URL Top:');
    report.topResourceSchemas.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${formatResourceSchemaGroupTitle(group)} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topResourceTypes?.length) {
    lines.push('', '全量静态资源类型 Top:');
    report.topResourceTypes.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}（URL ${group.schemaCount} / 来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topNestedCommandFields?.length) {
    lines.push('', '全量内部 CMD 字段 Top:');
    report.topNestedCommandFields.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topNestedResourceFields?.length) {
    lines.push('', '全量静态资源字段 Top:');
    report.topNestedResourceFields.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (reportView.runtimePlaceholderGroups.length > 0) {
    lines.push('', '当前占位符 Top:');
    reportView.runtimePlaceholderGroups.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.value} ×${group.count}（来源 ${group.sourceCount}）`);
    });
  }

  const paramStageRepairHintBuckets = buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.repairHintLabels
  );
  const paramStageKeyBuckets = buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.keys
  );
  if (paramStageRepairHintBuckets.length > 0) {
    lines.push('', '当前参数分层修复 Top:');
    paramStageRepairHintBuckets.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(bucket => {
      lines.push(`- ${bucket.key} ×${bucket.count}（来源 ${bucket.paths.length}）`);
    });
  } else if (paramStageKeyBuckets.length > 0) {
    lines.push('', '当前参数分层 Key Top:');
    paramStageKeyBuckets.slice(0, DEFAULT_DIAGNOSTIC_TOP_LIMIT).forEach(bucket => {
      lines.push(`- ${bucket.key} ×${bucket.count}（来源 ${bucket.paths.length}）`);
    });
  }

  if (reportView.unresolvedCandidates.length > 0) {
    lines.push('', '当前待检查样例:');
    reportView.unresolvedCandidates.slice(0, DEFAULT_DIAGNOSTIC_SAMPLE_LIMIT).forEach(candidate => {
      const sourceLabel = candidate.sourceLabel ? ` · ${getSourceLabelDisplayValue(candidate.sourceLabel)}` : '';
      const detectedType = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${sourceLabel}${detectedType}: ${candidate.reasonLabel}`);
    });
    if (reportView.isUnresolvedTruncated) {
      lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条待检查未列出`);
    }
  }

  if (reportView.warnings.length > 0) {
    lines.push('', '当前跳过样例:');
    reportView.warnings.slice(0, DEFAULT_DIAGNOSTIC_SAMPLE_LIMIT).forEach(warning => {
      const sourceLabel = warning.sourceLabel ? ` · ${getSourceLabelDisplayValue(warning.sourceLabel)}` : '';
      lines.push(`- ${warning.path}${sourceLabel}: ${warning.reasonLabel} (${warning.length}/${warning.limit})`);
    });
    if (reportView.isWarningTruncated) {
      lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未列出`);
    }
  }

  lines.push('', '建议:');
  if (reportView.filteredWarningCount > 0) {
    lines.push('- 先处理跳过记录，超长字段可单独粘贴到 Scheme 面板或缩小 response 后再解析');
  }
  if (reportView.filteredUnresolvedCount > 0) {
    lines.push('- 对待检查项判断是否为规则缺口；确认后可复制样本 JSON 并生成回归模板');
  }
  if (reportView.filteredPlaceholderCount > 0) {
    lines.push('- 运行时占位符通常不是解析失败，可按来源路径确认实际替换链路');
  }
  if (reportView.filteredSchemeParamStageRepairHintCount > 0) {
    lines.push('- 参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
  }
  if (reportView.filteredNonReversibleParamStageCount > 0) {
    lines.push('- 存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');
  }
  if (
    reportView.filteredWarningCount === 0 &&
    reportView.filteredUnresolvedCount === 0 &&
    reportView.filteredPlaceholderCount === 0 &&
    reportView.filteredSchemeParamStageRepairHintCount === 0 &&
    reportView.filteredNonReversibleParamStageCount === 0
  ) {
    lines.push('- 当前筛选未发现跳过、待检查或运行时占位符，可重点核对 CMD Schema 与业务预期是否一致');
  }

  return lines.join('\n');
};

const buildQualitySnapshotBuckets = <T>(
  items: T[],
  getKey: (item: T) => string | undefined,
  getPath: (item: T) => string
): TransformQualitySnapshotBucket[] => {
  const bucketMap = new Map<string, { count: number; paths: string[] }>();

  items.forEach(item => {
    const key = getKey(item);
    if (!key) return;

    const bucket = bucketMap.get(key) || { count: 0, paths: [] };
    bucket.count++;
    const path = getPath(item);
    if (bucket.paths.length < DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT && !bucket.paths.includes(path)) {
      bucket.paths.push(path);
    }
    bucketMap.set(key, bucket);
  });

  return Array.from(bucketMap.entries())
    .map(([key, bucket]) => ({ key, count: bucket.count, paths: bucket.paths }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT);
};

const buildQualitySnapshotRecommendations = (
  reportView: TransformReportView
): string[] => {
  const recommendations: string[] = [];

  if (reportView.filteredWarningCount > 0) {
    recommendations.push('先处理性能保护跳过记录，必要时单独粘贴字段到 Scheme 面板或缩小 response 后再解析');
  }
  if (reportView.filteredUnresolvedCount > 0) {
    recommendations.push('将待检查项按原因分组，确认规则缺口后复制脱敏样本并沉淀回归模板');
  }
  if (reportView.filteredPlaceholderCount > 0) {
    recommendations.push('运行时占位符按来源路径确认真实替换链路，避免误判为解析失败');
  }
  if (reportView.filteredSchemeParamStageRepairHintCount > 0) {
    recommendations.push('参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
  }
  if (reportView.filteredNonReversibleParamStageCount > 0) {
    recommendations.push('存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');
  }
  if (reportView.filteredCmdStructureCount > 0) {
    recommendations.push('对关键 CMD 结构粘贴 cmdHandler 输出做页面内对比，优先补齐缺失路径和值差异');
  }
  if (recommendations.length === 0) {
    recommendations.push('当前筛选未发现待处理风险，可将该快照作为解析质量基线保存');
  }

  return recommendations;
};

const formatTransformExportFilter = (filter?: string): string => filter?.trim() || '全部';

export const buildTransformQualitySnapshot = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): TransformQualitySnapshot => ({
  schemaVersion: 1,
  kind: 'json-helper-transform-quality-snapshot',
  tool: APP_VERSION_METADATA,
  filter: formatTransformExportFilter(query),
  coverage: report.coverage,
  totals: {
    records: reportView.totalRecordCount,
    cmdStructures: reportView.totalCmdStructureCount,
    nestedCommandFields: reportView.totalNestedCommandFieldCount,
	    nestedResourceFields: reportView.totalNestedResourceFieldCount,
	    runtimePlaceholders: reportView.totalPlaceholderCount,
	    schemeParamStages: reportView.totalSchemeParamStageCount,
	    schemeParamStageRepairHints: reportView.totalSchemeParamStageRepairHintCount,
	    nonReversibleParamStages: reportView.totalNonReversibleParamStageCount,
	    unresolved: reportView.totalUnresolvedCount,
	    warnings: reportView.totalWarningCount,
  },
  filtered: {
    records: reportView.filteredRecordCount,
    cmdStructures: reportView.filteredCmdStructureCount,
    nestedCommandFields: reportView.filteredNestedCommandFieldCount,
	    nestedResourceFields: reportView.filteredNestedResourceFieldCount,
	    runtimePlaceholders: reportView.filteredPlaceholderCount,
	    schemeParamStages: reportView.filteredSchemeParamStageCount,
	    schemeParamStageRepairHints: reportView.filteredSchemeParamStageRepairHintCount,
	    nonReversibleParamStages: reportView.filteredNonReversibleParamStageCount,
	    unresolved: reportView.filteredUnresolvedCount,
	    warnings: reportView.filteredWarningCount,
  },
  hotspots: {
    topCommandSchemas: (report.topCommandSchemas || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    topCommandSchemaOrigins: (report.topCommandSchemaOrigins || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    topResourceSchemas: (report.topResourceSchemas || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    topResourceTypes: (report.topResourceTypes || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    topNestedCommandFields: (report.topNestedCommandFields || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    topNestedResourceFields: (report.topNestedResourceFields || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
    unresolvedReasons: buildQualitySnapshotBuckets(
      reportView.unresolvedCandidates,
      candidate => candidate.reasonLabel,
      candidate => candidate.path
    ),
    warningReasons: buildQualitySnapshotBuckets(
      reportView.warnings,
      warning => warning.reasonLabel,
      warning => warning.path
    ),
    warningTypes: buildQualitySnapshotBuckets(
      reportView.warnings,
      warning => warning.type,
      warning => warning.path
    ),
	    runtimePlaceholders: reportView.runtimePlaceholderGroups
	      .slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT)
	      .map(group => ({
	        key: group.value,
	        count: group.count,
	        paths: group.sources.slice(0, DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT).map(source => source.sourcePath),
	      })),
	    schemeParamStageSources: buildSchemeParamStageQualityBuckets(
	      reportView.records,
	      summary => summary.sources
	    ),
	    schemeParamStageKeys: buildSchemeParamStageQualityBuckets(
	      reportView.records,
	      summary => summary.keys
	    ),
	    schemeParamStageRepairHints: buildSchemeParamStageQualityBuckets(
	      reportView.records,
	      summary => summary.repairHintLabels
	    ),
	  },
  truncation: {
    records: reportView.isRecordTruncated,
    cmdStructures: reportView.isCmdStructureTruncated,
    runtimePlaceholders: reportView.isPlaceholderTruncated,
    unresolved: reportView.isUnresolvedTruncated,
    warnings: reportView.isWarningTruncated,
  },
  recommendations: buildQualitySnapshotRecommendations(reportView),
});

export const formatTransformQualitySnapshotJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => JSON.stringify(buildTransformQualitySnapshot(report, reportView, query), null, 2);

const QUALITY_DELTA_METRICS: Array<{
  key: TransformQualitySnapshotMetricKey;
  label: string;
}> = [
  { key: 'records', label: '展开记录' },
  { key: 'cmdStructures', label: 'CMD结构' },
  { key: 'nestedCommandFields', label: '内部CMD字段' },
  { key: 'nestedResourceFields', label: '资源字段' },
  { key: 'runtimePlaceholders', label: '占位符' },
  { key: 'schemeParamStages', label: '参数层' },
  { key: 'schemeParamStageRepairHints', label: '参数修复' },
  { key: 'nonReversibleParamStages', label: '参数不可回写' },
  { key: 'unresolved', label: '待检查' },
  { key: 'warnings', label: '跳过' },
];

const formatMetricDelta = (before: number, after: number): string => {
  const delta = after - before;
  if (delta === 0) return `${before} -> ${after}`;

  return `${before} -> ${after} (${delta > 0 ? '+' : ''}${delta})`;
};

export const formatTransformQualitySnapshotDeltaText = (
  beforeSnapshot: TransformQualitySnapshot,
  afterSnapshot: TransformQualitySnapshot
): string => {
  const lines = [
    '深度解析质量对比',
    `覆盖率: ${beforeSnapshot.coverage.score} -> ${afterSnapshot.coverage.score} (${afterSnapshot.coverage.level})`,
    '指标变化:',
  ];

  QUALITY_DELTA_METRICS.forEach(metric => {
    lines.push(`- ${metric.label}: ${formatMetricDelta(
      beforeSnapshot.totals[metric.key],
      afterSnapshot.totals[metric.key]
    )}`);
  });

  const beforeLeadSchema = beforeSnapshot.hotspots.topCommandSchemas[0]?.schema || '(无)';
  const afterLeadSchema = afterSnapshot.hotspots.topCommandSchemas[0]?.schema || '(无)';
  lines.push(`Top CMD Schema: ${beforeLeadSchema} -> ${afterLeadSchema}`);

  if (afterSnapshot.recommendations.length > 0) {
    lines.push('应用后建议:');
    afterSnapshot.recommendations.forEach(recommendation => {
      lines.push(`- ${recommendation}`);
    });
  }

  return lines.join('\n');
};

export const formatTransformCollaborationReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformCollaborationReportOptions = {}
): string => {
  const normalizedQuery = query.trim();
  const qualitySnapshot = buildTransformQualitySnapshot(report, reportView, query);
  const diagnosticLines = formatTransformDiagnosticSummaryText(report, reportView, query)
    .split('\n')
    .slice(2);
  const cmdComparisonReportText = options.cmdComparisonReportText?.trim();
  const cmdComparisonCandidateText = options.cmdComparisonCandidateText?.trim();
  const lines = [
    '深度解析协作排查报告',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${normalizedQuery || '全部'}`,
    '',
    '一、诊断摘要',
    ...diagnosticLines,
    '',
    '二、质量快照要点',
    `- 覆盖: ${qualitySnapshot.coverage.score} (${qualitySnapshot.coverage.level})，${qualitySnapshot.coverage.description}`,
    `- 全量规模: 展开 ${qualitySnapshot.totals.records}，CMD结构 ${qualitySnapshot.totals.cmdStructures}，内部CMD字段 ${qualitySnapshot.totals.nestedCommandFields}，资源字段 ${qualitySnapshot.totals.nestedResourceFields}，占位符 ${qualitySnapshot.totals.runtimePlaceholders}，参数层 ${qualitySnapshot.totals.schemeParamStages}，参数修复 ${qualitySnapshot.totals.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.totals.unresolved}，跳过 ${qualitySnapshot.totals.warnings}`,
    `- 当前筛选: 展开 ${qualitySnapshot.filtered.records}，CMD结构 ${qualitySnapshot.filtered.cmdStructures}，内部CMD字段 ${qualitySnapshot.filtered.nestedCommandFields}，资源字段 ${qualitySnapshot.filtered.nestedResourceFields}，占位符 ${qualitySnapshot.filtered.runtimePlaceholders}，参数层 ${qualitySnapshot.filtered.schemeParamStages}，参数修复 ${qualitySnapshot.filtered.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.filtered.unresolved}，跳过 ${qualitySnapshot.filtered.warnings}`,
  ];

  if (qualitySnapshot.hotspots.topCommandSchemas.length > 0) {
    lines.push('- CMD Schema Top:');
    qualitySnapshot.hotspots.topCommandSchemas.slice(0, 5).forEach(group => {
      lines.push(`  - ${group.schema} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topResourceSchemas.length > 0) {
    lines.push('- 静态资源 URL Top:');
    qualitySnapshot.hotspots.topResourceSchemas.slice(0, 5).forEach(group => {
      lines.push(`  - ${formatResourceSchemaGroupTitle(group)} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topResourceTypes.length > 0) {
    lines.push('- 静态资源类型 Top:');
    qualitySnapshot.hotspots.topResourceTypes.slice(0, 5).forEach(group => {
      lines.push(`  - ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topNestedCommandFields.length > 0) {
    lines.push('- 内部 CMD 字段 Top:');
    qualitySnapshot.hotspots.topNestedCommandFields.slice(0, 5).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.schemeParamStageRepairHints.length > 0) {
    lines.push('- 参数分层修复 Top:');
    qualitySnapshot.hotspots.schemeParamStageRepairHints.slice(0, 5).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  } else if (qualitySnapshot.hotspots.schemeParamStageKeys.length > 0) {
    lines.push('- 参数分层 Key Top:');
    qualitySnapshot.hotspots.schemeParamStageKeys.slice(0, 5).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  }

  if (qualitySnapshot.recommendations.length > 0) {
    lines.push('- 建议动作:');
    qualitySnapshot.recommendations.forEach(recommendation => {
      lines.push(`  - ${recommendation}`);
    });
  }

  lines.push('', '三、cmdHandler 对齐');
  if (cmdComparisonReportText) {
    lines.push('- 已附当前页面内 cmdHandler 差异报告:');
    lines.push('```text', cmdComparisonReportText, '```');
    if (cmdComparisonCandidateText) {
      lines.push('- actual 候选推荐:');
      lines.push('```text', cmdComparisonCandidateText, '```');
    }
  } else if (reportView.filteredCmdStructureCount > 0) {
    lines.push(`- 待对比: 当前筛选有 ${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount} 条可复制 CMD 结构，可粘贴内部 cmdHandler 输出后再次复制本报告。`);
    reportView.cmdStructureRecords.slice(0, 5).forEach(record => {
      const schema = record.commandSchema || record.commandSchemaRows?.[0]?.schema || '(未知 schema)';
      lines.push(`  - ${record.path}: ${schema}`);
    });
    if (reportView.isCmdStructureTruncated) {
      lines.push(`  - 还有 ${reportView.filteredCmdStructureCount - reportView.cmdStructureRecords.length} 条 CMD 结构未列出`);
    }
  } else {
    lines.push('- 当前筛选未识别可复制 CMD 结构，优先确认输入中是否包含 CMD/Scheme 字段。');
  }

  return lines.join('\n');
};

export const formatTransformPathValueReportText = (
  reportView: TransformReportView
): string => {
  const lines: string[] = [];

  reportView.records.forEach(record => {
    const isFocusedNestedCommandCopy = record.cmdStructureFocusLabel === '内部 CMD 字段' &&
      Boolean(record.nestedCommandSearchFields?.length);
    const copiedRows = getTransformPathValueCopyRows(record);
    copiedRows.forEach(row => {
      lines.push(getTransformDecodedPathCopyText(row));
    });

    if (
      !isFocusedNestedCommandCopy &&
      (record.indexedDecodedPathCount > copiedRows.length || record.decodedPathCount > copiedRows.length)
    ) {
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
  const records = reportView.cmdStructureRecords;
  if (records.length === 0) return '';

  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    `工具版本: ${APP_VERSION_LABEL}`,
    ...(normalizedQuery ? [`筛选: ${normalizedQuery}`] : []),
    reportView.isCmdStructureTruncated
      ? `CMD 结构: ${records.length}/${reportView.filteredCmdStructureCount} 条`
      : `CMD 结构: ${records.length} 条`,
  ];

  records.forEach(record => {
    lines.push('', `路径: ${record.path}`);
    if (record.sourceLabel) {
      lines.push(formatSourceLabelText(record.sourceLabel));
    }
    if (record.insights.length > 0) {
      lines.push(`解析线索: ${record.insights.join('；')}`);
    }
    if (record.commandParamCount !== undefined) {
      const visibleKeys = record.commandParamKeys || [];
      const hiddenKeyCount = Math.max(record.commandParamCount - visibleKeys.length, 0);
      lines.push(
        `cmdParams: ${record.commandParamCount} 个顶层参数${
          visibleKeys.length > 0
            ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
            : ''
        }`
      );
    }
    if (record.cmdStructureFocusPaths?.length) {
      lines.push(
        `聚焦复制: 已按筛选命中的 ${record.cmdStructureFocusCount || record.cmdStructureFocusPaths.length} 个${record.cmdStructureFocusLabel || '内部路径'}裁剪 cmdParams`
      );
    }
    if (record.nestedCommandFieldCount > 0) {
      lines.push(`内部CMD字段: ${record.nestedCommandFieldCount}`);
      record.nestedCommandFields.forEach(row => {
        lines.push(`内部CMD字段路径: ${row.path} = ${row.preview}`);
      });
      if (record.hasMoreNestedCommandFields) {
        lines.push(`内部CMD字段路径: 还有更多未展示（已索引 ${record.indexedNestedCommandFieldCount} 个）`);
      }
    }
    lines.push(getTransformRecordCmdStructureCopyText(record));
  });

  if (reportView.isCmdStructureTruncated) {
    lines.push(`... 还有 ${reportView.filteredCmdStructureCount - records.length} 条 CMD 结构未复制`);
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
    `工具版本: ${APP_VERSION_LABEL}`,
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

interface PlaceholderReplacementCandidate {
  replacement: string;
  sourcePath: string;
  sourceLabel: string;
}

const PLACEHOLDER_REPLACEMENT_SOURCE_LABELS: Record<string, readonly string[]> = {
  __AD_EXTRA_PARAM_ENCODE_1__: ['extraParam', 'ad_extra_param'],
  __EXT_RENDER_AFD__: ['extRenderAfd', 'ext_render_afd'],
  __REWARD_NUM__: ['rewardNum', 'reward_num'],
  __CLICK_ID__: ['clickId', 'click_id'],
  __SIGN__: ['sign'],
  __CALLBACK_URL__: ['callbackUrl', 'callback_url'],
};

const normalizeReplacementSourceLabel = (value: string): string => (
  value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
);

const isSafePlaceholderReplacement = (replacement: string, placeholderValue: string): boolean => {
  const trimmed = replacement.trim();
  return Boolean(trimmed) && trimmed !== placeholderValue && !trimmed.includes(placeholderValue);
};

const buildPlaceholderReplacementSuggestions = (
  reportView: TransformReportView,
  suggestionSourceView = reportView
): Map<string, TransformPlaceholderFillTemplateSuggestion> => {
  const suggestions = new Map<string, TransformPlaceholderFillTemplateSuggestion>();
  if (suggestionSourceView.isRecordTruncated) return suggestions;

  reportView.runtimePlaceholderGroups.forEach(group => {
    const aliases = PLACEHOLDER_REPLACEMENT_SOURCE_LABELS[group.value]?.map(normalizeReplacementSourceLabel) || [];
    if (aliases.length === 0) return;

    const candidates: PlaceholderReplacementCandidate[] = suggestionSourceView.records.flatMap(record => {
      if (!record.sourceLabel || !record.originalValue) return [];

      const normalizedSourceLabel = normalizeReplacementSourceLabel(record.sourceLabel);
      if (!aliases.includes(normalizedSourceLabel) || !isSafePlaceholderReplacement(record.originalValue, group.value)) {
        return [];
      }

      return [{
        replacement: record.originalValue,
        sourcePath: record.path,
        sourceLabel: record.sourceLabel,
      }];
    });

    const uniqueCandidates = Array.from(new Map(
      candidates.map(candidate => [candidate.replacement, candidate])
    ).values());
    if (uniqueCandidates.length !== 1) return;

    const candidate = uniqueCandidates[0];
    suggestions.set(group.value, {
      replacement: candidate.replacement,
      sourcePath: candidate.sourcePath,
      sourceLabel: candidate.sourceLabel,
      reason: `业务字段 ${candidate.sourceLabel} 与 ${group.value} 强匹配`,
    });
  });

  return suggestions;
};

export const buildTransformPlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = '',
  suggestionSourceView = reportView
): TransformPlaceholderFillTemplate | null => {
  if (reportView.filteredPlaceholderCount === 0) return null;

  const replacementSuggestions = buildPlaceholderReplacementSuggestions(reportView, suggestionSourceView);
  const placeholderDetails = reportView.runtimePlaceholderGroups.map(group => {
    const suggestion = replacementSuggestions.get(group.value);

    return {
      value: group.value,
      replacement: suggestion?.replacement || '',
      ...(suggestion ? { suggestion } : {}),
      description: group.description,
      count: group.count,
      sourceCount: group.sourceCount,
      sources: group.sources.map(source => ({
        sourcePath: source.sourcePath,
        ...(source.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
        count: source.count,
        ...(source.sourceOriginalPreview ? { sourceOriginalPreview: source.sourceOriginalPreview } : {}),
      })),
    };
  });

  return {
    schemaVersion: 1,
    kind: 'json-helper-runtime-placeholder-fill-template',
    tool: APP_VERSION_METADATA,
    filter: formatTransformExportFilter(filter),
    summary: {
      groups: placeholderDetails.length,
      visibleOccurrences: reportView.runtimePlaceholders.length,
      filteredOccurrences: reportView.filteredPlaceholderCount,
      totalOccurrences: reportView.totalPlaceholderCount,
      truncated: reportView.isPlaceholderTruncated,
    },
    placeholders: Object.fromEntries(
      placeholderDetails.map(detail => [detail.value, detail.replacement])
    ),
    placeholderDetails,
  };
};

export const formatTransformPlaceholderFillTemplateJsonText = (
  reportView: TransformReportView,
  filter = '',
  suggestionSourceView = reportView
): string => {
  const fillTemplate = buildTransformPlaceholderFillTemplate(reportView, filter, suggestionSourceView);
  return fillTemplate ? JSON.stringify(fillTemplate, null, 2) : '';
};

export const buildTransformIssueSampleExport = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): TransformIssueSampleExport | null => {
  const placeholderSamples = reportView.runtimePlaceholders.filter(
    placeholder => Boolean(placeholder.sourceOriginalValue)
  );
  const samples: TransformIssueSampleExportItem[] = [
    ...reportView.unresolvedCandidates.map(candidate => ({
      type: 'unresolved' as const,
      path: candidate.path,
      ...(candidate.sourceLabel ? { sourceLabel: candidate.sourceLabel } : {}),
      originalValue: candidate.originalValue,
      reasonLabel: candidate.reasonLabel,
      nextAction: candidate.nextAction,
      message: candidate.message,
      ...(candidate.detectedType ? { detectedType: candidate.detectedType } : {}),
      reasonLevel: candidate.reasonLevel,
      length: candidate.length,
    })),
    ...placeholderSamples.map(placeholder => ({
      type: 'runtime_placeholder' as const,
      path: placeholder.path,
      sourcePath: placeholder.sourcePath,
      ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
      originalValue: placeholder.sourceOriginalValue || '',
      reasonLabel: '运行时占位符',
      message: placeholder.description,
      value: placeholder.value,
    })),
    ...reportView.warnings.map(warning => ({
      type: 'warning' as const,
      path: warning.path,
      ...(warning.sourceLabel ? { sourceLabel: warning.sourceLabel } : {}),
      originalValue: warning.originalValue,
      reasonLabel: warning.reasonLabel,
      nextAction: warning.nextAction,
      message: warning.message,
      length: warning.length,
      limit: warning.limit,
      warningType: warning.type,
    })),
  ];

  if (samples.length === 0) {
    return null;
  }

  const outputSamples = options.redactSensitiveValues
    ? redactSensitiveIssueSamples(samples)
    : samples;

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-issue-samples',
    tool: APP_VERSION_METADATA,
    filter: formatTransformExportFilter(options.filter),
    suggestedCommands: buildIssueSampleSuggestedCommands(),
    summary: {
      unresolved: {
        copied: reportView.unresolvedCandidates.length,
        filtered: reportView.filteredUnresolvedCount,
        total: reportView.totalUnresolvedCount,
        truncated: reportView.isUnresolvedTruncated,
      },
      runtimePlaceholders: {
        copied: placeholderSamples.length,
        filtered: reportView.filteredPlaceholderCount,
        total: reportView.totalPlaceholderCount,
        truncated: reportView.isPlaceholderTruncated,
      },
      warnings: {
        copied: reportView.warnings.length,
        filtered: reportView.filteredWarningCount,
        total: reportView.totalWarningCount,
        truncated: reportView.isWarningTruncated,
      },
    },
    samples: outputSamples,
  };
};

export const formatTransformIssueSampleJsonText = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): string => {
  const sampleExport = buildTransformIssueSampleExport(reportView, options);
  return sampleExport ? JSON.stringify(sampleExport, null, 2) : '';
};

export const formatTransformIssueRegressionTemplateText = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = { redactSensitiveValues: true }
): string => {
  const rawSampleExport = buildTransformIssueSampleExport(reportView, { filter: options.filter });
  if (!rawSampleExport) return '';

  const sampleExport = options.redactSensitiveValues
    ? buildTransformIssueSampleExport(reportView, options)
    : rawSampleExport;
  if (!sampleExport || sampleExport.samples.length === 0) return '';

  const sensitiveHints = collectIssueSampleSensitiveHints(rawSampleExport.samples);
  const hasRedactedValues = sampleExport.samples.some(sample => sample.redactionHint);
  const sensitiveHintText = sensitiveHints
    .slice(0, 5)
    .map(formatIssueSampleSensitiveHint)
    .join('；');
  const sensitiveHintLines = sensitiveHints.length > 0
    ? (hasRedactedValues
        ? [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 已脱敏命中的 originalValue，当前命中: ${sensitiveHintText}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '// 补断言前请用脱敏后的等价样本还原结构。',
            '',
          ]
        : [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 提交前请先脱敏 originalValue，当前命中: ${sensitiveHintText}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '',
          ])
    : [];

  return [
    "import { describe, expect, it } from 'vitest';",
    "import { deepParseWithContext } from './transformations';",
    '',
    '// 由深度解析报告「复制回归模板」生成；先跑 smoke，再把 it.todo 改成 it 补充解析断言。',
    `// 工具版本: ${sampleExport.tool.versionLabel}`,
    `// 筛选: ${sampleExport.filter}`,
    ...sensitiveHintLines,
    `const issueSamples = ${JSON.stringify(sampleExport.samples, null, 2)} as const;`,
    '',
    'const getOriginalValue = (sample: (typeof issueSamples)[number]): string | undefined => (',
    "  'originalValue' in sample && typeof sample.originalValue === 'string'",
    '    ? sample.originalValue',
    '    : undefined',
    ');',
    '',
    "describe('深度解析问题样本回归', () => {",
    "  it('样本原始值可被深度解析入口安全处理', () => {",
    '    expect(issueSamples.length).toBeGreaterThan(0);',
    '    issueSamples.forEach(sample => {',
    "      expect(sample.path).toMatch(/^\\$/);",
    '      const originalValue = getOriginalValue(sample);',
    '      if (!originalValue) return;',
    "      expect(() => deepParseWithContext(originalValue, { autoExpandScheme: true })).not.toThrow();",
    '    });',
    '  });',
    '',
    '  issueSamples.forEach(sample => {',
    '    it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);',
    '  });',
    '});',
    '',
  ].join('\n');
};

export const formatTransformIssueSampleReportText = (
  reportView: TransformReportView,
  filter = ''
): string => {
  const lines = [
    '深度解析问题样本',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${formatTransformExportFilter(filter)}`,
    `待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}`,
  ];
  let sampleCount = 0;

  if (reportView.unresolvedCandidates.length > 0) {
    lines.push('', '未展开线索:');
    reportView.unresolvedCandidates.forEach(candidate => {
      sampleCount++;
      const typeText = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${typeText}`);
      if (candidate.sourceLabel) {
        lines.push(`  ${formatSourceLabelText(candidate.sourceLabel)}`);
      }
      lines.push(`  原因: ${candidate.reasonLabel}`);
      lines.push(`  下一步: ${candidate.nextAction}`);
      lines.push('  原始值:');
      lines.push(candidate.originalValue);
    });
    if (reportView.isUnresolvedTruncated) {
      lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条未展开线索未复制`);
    }
  }

  const placeholderSamples = reportView.runtimePlaceholders.filter(
    placeholder => Boolean(placeholder.sourceOriginalValue)
  );
  if (placeholderSamples.length > 0) {
    lines.push('', '运行时占位符来源:');
    placeholderSamples.forEach(placeholder => {
      sampleCount++;
      lines.push(`- ${placeholder.path}: ${placeholder.value}`);
      lines.push(`  来源: ${placeholder.sourcePath}`);
      if (placeholder.sourceLabel) {
        lines.push(`  ${formatSourceLabelText(placeholder.sourceLabel)}`);
      }
      lines.push(`  说明: ${placeholder.description}`);
      lines.push('  来源原始值:');
      lines.push(placeholder.sourceOriginalValue || '');
    });
    if (reportView.isPlaceholderTruncated) {
      lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
    }
  }

  if (reportView.warnings.length > 0) {
    lines.push('', '跳过记录:');
    reportView.warnings.forEach(warning => {
      sampleCount++;
      lines.push(`- ${warning.path}: ${warning.reasonLabel}`);
      if (warning.sourceLabel) {
        lines.push(`  ${formatSourceLabelText(warning.sourceLabel)}`);
      }
      lines.push(`  下一步: ${warning.nextAction}`);
      lines.push(`  长度: ${warning.length}/${warning.limit}`);
      lines.push('  原始值:');
      lines.push(warning.originalValue);
    });
    if (reportView.isWarningTruncated) {
      lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未复制`);
    }
  }

  if (sampleCount === 0) {
    return '';
  }

  return lines.join('\n');
};

const buildArchiveIssueSampleExport = (
  reportView: TransformReportView,
  filter = ''
): TransformIssueSampleExport | null => {
  const sampleExport = buildTransformIssueSampleExport(reportView, {
    redactSensitiveValues: true,
    filter,
  });
  if (!sampleExport) return null;

  return {
    ...sampleExport,
    samples: sampleExport.samples.map(sample => ({
      ...sample,
      originalValue: sample.redactionHint ? sample.originalValue : ARCHIVE_OMITTED_ORIGINAL_VALUE,
      redactionHint: sample.redactionHint || '归档包默认省略原始值，沉淀 corpus 前请从已脱敏 response 补齐',
    })),
  };
};

const buildArchivePlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = ''
): TransformPlaceholderFillTemplate | null => {
  const fillTemplate = buildTransformPlaceholderFillTemplate(reportView, filter);
  if (!fillTemplate) return null;

  return {
    ...fillTemplate,
    placeholders: Object.fromEntries(
      fillTemplate.placeholderDetails.map(detail => [detail.value, ''])
    ),
    placeholderDetails: fillTemplate.placeholderDetails.map(detail => ({
      value: detail.value,
      replacement: '',
      description: detail.description,
      count: detail.count,
      sourceCount: detail.sourceCount,
      sources: detail.sources.map(source => ({
        sourcePath: source.sourcePath,
        ...(source.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
        count: source.count,
      })),
    })),
  };
};

const createRecipeStep = (
  step: TransformTroubleshootingRecipeStep
): TransformTroubleshootingRecipeStep => step;

const uniqueSuggestedCommands = (
  commands: TransformSuggestedCommand[]
): TransformSuggestedCommand[] => (
  Array.from(new Map(commands.map(command => [command.id, command])).values())
);

export const buildTransformTroubleshootingRecipe = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): TransformTroubleshootingRecipe => {
  const filter = formatTransformExportFilter(query);
  const steps: TransformTroubleshootingRecipeStep[] = [
    createRecipeStep({
      id: 'deep-format-report',
      label: '生成深度解析报告',
      action: 'open-transform-report',
      description: '从 SOURCE 执行嵌套解析，生成展开记录、CMD 结构、资源字段、占位符、待检查和跳过记录。',
      input: 'SOURCE 当前 JSON / JSON Lines / response 文本',
      output: 'TransformContextReport',
      dependsOn: [],
      enabled: true,
    }),
  ];

  if (filter !== '全部') {
    steps.push(createRecipeStep({
      id: 'apply-report-filter',
      label: `筛选 ${filter}`,
      action: 'set-transform-report-filter',
      description: '复用当前报告筛选词，只查看命中的记录、待检查、占位符和跳过项。',
      input: 'TransformContextReport',
      output: 'TransformReportView',
      dependsOn: ['deep-format-report'],
      enabled: true,
    }));
  }

  if (reportView.filteredCmdStructureCount > 0) {
    steps.push(createRecipeStep({
      id: 'compare-cmd-handler',
      label: '对比 cmdHandler',
      action: 'copy-cmd-structure-and-diff',
      description: '复制当前筛选下的 CMD 结构，粘贴 cmdHandler 输出后对比 cmdSchema、source 和 cmdParams 路径差异。',
      input: 'TransformReportView.cmdStructureRecords + cmdHandler expected',
      output: 'CMD 结构差异报告',
      dependsOn: [filter === '全部' ? 'deep-format-report' : 'apply-report-filter'],
      enabled: true,
    }));
  }

  if (reportView.filteredPlaceholderCount > 0) {
    steps.push(createRecipeStep({
      id: 'fill-runtime-placeholders',
      label: '回填运行时占位符',
      action: 'copy-placeholder-fill-template',
      description: '导出占位符回填模板，补齐服务端或客户端运行时值后重新深度解析，并用质量快照对比变化。',
      input: 'TransformReportView.runtimePlaceholderGroups',
      output: 'json-helper-runtime-placeholder-fill-template',
      dependsOn: [filter === '全部' ? 'deep-format-report' : 'apply-report-filter'],
      enabled: true,
    }));
  }

  if (reportView.filteredUnresolvedCount > 0 || reportView.filteredWarningCount > 0) {
    steps.push(createRecipeStep({
      id: 'promote-issue-samples',
      label: '沉淀问题样本',
      action: 'copy-redacted-issue-samples-and-regression-template',
      description: '复制脱敏问题样本和 Vitest TODO 模板，把待检查或跳过记录沉淀成可复现回归。',
      input: 'TransformReportView.unresolvedCandidates + TransformReportView.warnings',
      output: 'json-helper-transform-issue-samples + Vitest regression template',
      dependsOn: [filter === '全部' ? 'deep-format-report' : 'apply-report-filter'],
      enabled: true,
    }));
  }

  steps.push(
    createRecipeStep({
      id: 'save-quality-snapshot',
      label: '保存质量快照',
      action: 'copy-quality-snapshot',
      description: '复制不含原始值的质量指标，作为后续优化、占位符回填或规则迭代前后的对比基线。',
      input: 'TransformReportView',
      output: 'json-helper-transform-quality-snapshot',
      dependsOn: [filter === '全部' ? 'deep-format-report' : 'apply-report-filter'],
      enabled: true,
    }),
    createRecipeStep({
      id: 'archive-safe-artifacts',
      label: '归档安全材料',
      action: 'copy-archive-package',
      description: '复制诊断摘要、协作报告、质量快照、脱敏问题样本和 corpus 清单，不携带原始 response。',
      input: 'TransformReportView',
      output: 'json-helper-transform-archive-package',
      dependsOn: ['save-quality-snapshot'],
      enabled: true,
    })
  );

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-troubleshooting-recipe',
    tool: APP_VERSION_METADATA,
    filter,
    safety: {
      containsRawResponse: false,
      containsOriginalValues: false,
      notes: [
        'recipe 只描述排查步骤和可导出的安全材料，不携带 SOURCE 原文或字段原始值。',
        '运行 recipe 时请从已脱敏 response 或当前 SOURCE 重新生成报告。',
        'cmdHandler expected、问题样本和 corpus 文件在提交前仍需按业务规则脱敏。',
      ],
    },
    summary: {
      coverageLabel: report.coverage.label,
      coverageScore: report.coverage.score,
      records: reportView.filteredRecordCount,
      cmdStructures: reportView.filteredCmdStructureCount,
      nestedCommandFields: reportView.filteredNestedCommandFieldCount,
      nestedResourceFields: reportView.filteredNestedResourceFieldCount,
      runtimePlaceholders: reportView.filteredPlaceholderCount,
      unresolved: reportView.filteredUnresolvedCount,
      warnings: reportView.filteredWarningCount,
      truncated: reportView.isRecordTruncated ||
        reportView.isCmdStructureTruncated ||
        reportView.isPlaceholderTruncated ||
        reportView.isUnresolvedTruncated ||
        reportView.isWarningTruncated,
    },
    steps,
    suggestedCommands: uniqueSuggestedCommands([
      ...(reportView.filteredCmdStructureCount > 0 ? buildCmdComparisonSuggestedCommands() : []),
      ...(reportView.filteredUnresolvedCount > 0 || reportView.filteredWarningCount > 0
        ? buildIssueSampleSuggestedCommands()
        : []),
      ...buildArchiveSuggestedCommands(),
    ]),
  };
};

export const formatTransformTroubleshootingRecipeJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => JSON.stringify(buildTransformTroubleshootingRecipe(report, reportView, query), null, 2);

export const buildTransformArchivePackage = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformArchivePackageOptions = {}
): TransformArchivePackage => {
  const normalizedQuery = query.trim();
  const sampleName = options.sampleName?.trim() || 'sample-name';
  const cmdComparisonReportText = options.cmdComparisonReportText?.trim();
  const cmdComparisonCandidateText = options.cmdComparisonCandidateText?.trim();
  const qualitySnapshot = buildTransformQualitySnapshot(report, reportView, query);
  const collaborationOptions = {
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };
  const artifacts: TransformArchivePackage['artifacts'] = {
    diagnosticSummaryText: formatTransformDiagnosticSummaryText(report, reportView, query),
    collaborationReportText: formatTransformCollaborationReportText(report, reportView, query, collaborationOptions),
    qualitySnapshot,
    issueSamples: buildArchiveIssueSampleExport(reportView, query),
    placeholderFillTemplate: buildArchivePlaceholderFillTemplate(reportView, query),
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-archive-package',
    tool: APP_VERSION_METADATA,
    filter: normalizedQuery || '全部',
    safety: {
      containsRawResponse: false,
      issueSampleOriginalValues: 'omitted-or-redacted',
      placeholderSourcePreviews: false,
      cmdComparisonMayContainValues: Boolean(cmdComparisonReportText || cmdComparisonCandidateText),
      notes: [
        '归档包默认不携带原始 response；保存 corpus 前请单独提供已脱敏的 response 文件。',
        '问题样本 originalValue 已省略或脱敏，避免把 token/sign/cookie/设备标识带入协作材料。',
        '如包含 cmdHandler 差异报告，提交前仍需确认其中 actual/expected 值是否需要脱敏。',
      ],
    },
    artifacts,
    suggestedCommands: buildArchiveSuggestedCommands(),
    corpusCandidate: {
      recommendedFiles: [
        `${sampleName}.redacted.json`,
        `${sampleName}.expected.snapshot.json`,
        `${sampleName}.cmdhandler.expected.json`,
      ],
      checklist: [
        `将已脱敏原始 response 保存为 ${sampleName}.redacted.json`,
        `将 artifacts.qualitySnapshot 转写为 ${sampleName}.expected.snapshot.json`,
        `如已粘贴 cmdHandler 输出，将稳定子集保存为 ${sampleName}.cmdhandler.expected.json`,
        '把 artifacts.issueSamples 中仍有价值的路径补成单测或 corpus 阈值断言',
      ],
    },
  };
};

export const formatTransformArchivePackageJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformArchivePackageOptions = {}
): string => JSON.stringify(buildTransformArchivePackage(report, reportView, query, options), null, 2);

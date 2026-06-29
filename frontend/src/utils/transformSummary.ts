import type {
  JsonValue,
  TransformContext,
  TransformSchemeParamStageSummary,
  TransformWarning,
} from '../types';
import { APP_VERSION_METADATA, APP_VERSION_LABEL, type AppVersionMetadata } from './appVersion';
import { collectCmdHandlerCommandSchemaRows } from './schemeMetadata';
import { formatSourceLabelText, getSourceLabelDisplayValue } from './sourceLabels';
import type { StaticResourceType } from './staticResourceSchema';
import {
  formatTransformContextSummary,
  summarizeTransformContext,
  type TransformContextSummary,
} from './transformContextSummary';
import {
  buildTransformReportCoverage,
  type TransformReportCoverage,
} from './transformReportCoverage';
import {
  buildArchiveSuggestedCommands,
  type TransformSuggestedCommand,
} from './transformSuggestedCommands';
import {
  formatJsonValuePreview,
  formatOriginalPreview,
} from './transformValuePreview';
import {
  getTransformDecodedPreview,
  getTransformDecodedValue,
} from './transformReportDecodedValue';
import {
  buildTransformCommandParamSummary,
  createTransformRecordCmdStructureCopyTextGetter,
  getTransformRecordCmdStructureSource,
  getTransformRecordCommandSchema,
} from './transformReportCmdStructureSource';
import {
  DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT,
  buildTransformRecordInsightData,
} from './transformReportRecordInsights';
import {
  DEFAULT_DECODED_PATH_LIMIT,
  buildTransformDecodedPaths,
  buildTransformDecodedSearchData,
} from './transformReportDecodedPaths';
import {
  buildTransformQualitySnapshot,
  formatTransformQualitySnapshotJsonText,
} from './transformQualitySnapshot';
import {
  buildTransformIssueSampleExport,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
} from './transformIssueSamples';
import { formatTransformIssueRegressionTemplateText } from './transformIssueRegressionTemplate';
import {
  buildTransformPlaceholderFillTemplate,
  formatTransformPlaceholderFillTemplateJsonText,
} from './transformPlaceholderFillTemplate';
import {
  sanitizeTransformIssueSampleExportForArchive,
  sanitizeTransformPlaceholderFillTemplateForArchive,
} from './transformArchiveSanitizers';
import {
  classifyTransformUnresolvedCandidate,
  classifyTransformWarning,
} from './transformIssueClassification';
import {
  buildFilteredRecordView,
  matchesReportRecord,
  type TransformReportFilterOptions,
} from './transformReportFilters';
import {
  buildRuntimePlaceholderGroups,
  matchesRuntimePlaceholder,
} from './transformRuntimePlaceholders';
import {
  buildTopCommandSchemaGroups,
  buildTopCommandSchemaOriginGroups,
  buildTopResourceTypeGroups,
  getCommandSchemaOrigin,
} from './transformReportCommandSchemaGroups';
import { buildTransformReportNestedFieldGroups } from './transformReportNestedFieldGroups';
import { joinTransformJsonPath } from './transformReportJsonPath';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';
import {
  matchesReportWarning,
  matchesUnresolvedCandidate,
} from './transformIssueFilters';
import {
  buildSchemeParamStageQualityBuckets,
  getRecordSchemeParamStageSummary,
  getSchemeParamStageSearchText,
  getTransformStepLabel,
  sumNonReversibleParamStageCount,
  sumSchemeParamStageCount,
  sumSchemeParamStageRepairHintCount,
} from './transformSchemeParamStages';
import {
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from './transformReportCopyPayloads';
import {
  appendCommandSchemaOriginSummarySection,
  appendCommandSchemaSummarySection,
  appendNestedCommandFieldSummarySection,
  appendNestedResourceFieldSummarySection,
  appendReportPlaceholderSection,
  appendReportRecordLines,
  appendReportUnresolvedSection,
  appendReportWarningSection,
  appendResourceSchemaSummarySection,
  appendResourceTypeSummarySection,
  formatResourceSchemaGroupTitle,
} from './transformReportTextSections';

export { formatTransformContextSummary, summarizeTransformContext };
export type { TransformContextSummary };
export type { TransformReportCoverage } from './transformReportCoverage';
export type { TransformSuggestedCommand } from './transformSuggestedCommands';
export type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
  TransformReportRuntimePlaceholderSourceGroup,
} from './transformRuntimePlaceholderTypes';
export type {
  TransformTroubleshootingRecipe,
  TransformTroubleshootingRecipeStep,
} from './transformTroubleshootingRecipe';
export { formatTransformQualitySnapshotDeltaText } from './transformQualityDelta';
export {
  formatTransformCmdStructureComparisonPackageText,
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from './transformReportCopyPayloads';
export {
  buildTransformTroubleshootingRecipe,
  formatTransformTroubleshootingRecipeJsonText,
} from './transformTroubleshootingRecipe';
export {
  buildTransformQualitySnapshot,
  formatTransformQualitySnapshotJsonText,
};
export {
  buildTransformIssueSampleExport,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
};
export { formatTransformIssueRegressionTemplateText };
export {
  buildTransformPlaceholderFillTemplate,
  formatTransformPlaceholderFillTemplateJsonText,
};

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

export type TransformReportResourceType = StaticResourceType;

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

const DEFAULT_DIAGNOSTIC_TOP_LIMIT = 8;
const DEFAULT_DIAGNOSTIC_SAMPLE_LIMIT = 5;
export const DEFAULT_TRANSFORM_REPORT_RECORD_LIMIT = 200;
export const DEFAULT_TRANSFORM_REPORT_WARNING_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_UNRESOLVED_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_PLACEHOLDER_LIMIT = 100;
export const DEFAULT_TRANSFORM_REPORT_CMD_STRUCTURE_LIMIT = 200;
const DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT = 8;
const DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT = 4;
const DEFAULT_COMMAND_SCHEMA_ROW_LIMIT = 8;

const formatDecodedPathCount = (record: Pick<TransformReportRecord, 'decodedPathCount' | 'isDecodedPathCountTruncated'>): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

const buildTopNestedCommandFieldGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT
): TransformReportNestedCommandFieldGroup[] => buildTransformReportNestedFieldGroups(records, {
  limit,
  pathLimit: DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT,
  getRows: record => record.nestedCommandSearchFields,
});

const buildTopNestedResourceFieldGroups = (
  records: TransformReportRecord[],
  limit = DEFAULT_TOP_NESTED_COMMAND_FIELD_LIMIT
): TransformReportNestedCommandFieldGroup[] => buildTransformReportNestedFieldGroups(records, {
  limit,
  pathLimit: DEFAULT_TOP_NESTED_COMMAND_FIELD_PATH_LIMIT,
  getRows: record => record.nestedResourceSearchFields,
});

const TRANSFORM_REPORT_FILTER_OPTIONS: TransformReportFilterOptions = {
  decodedPathLimit: DEFAULT_DECODED_PATH_LIMIT,
  nestedCommandFieldLimit: DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT,
  getCommandSchemaOrigin,
  getSchemeParamStageSearchText,
};

export const buildTransformContextReport = (
  context: TransformContext
): TransformContextReport => {
	  const records: TransformReportRecord[] = Array.from(context.records.values()).map(record => {
    const decodedValue = getTransformDecodedValue(record);
    const {
      decodedPaths,
      decodedPathCount,
      isDecodedPathCountTruncated,
      hasMoreDecodedPaths,
    } = buildTransformDecodedPaths(record.path, decodedValue);
    const decodedSearchData = buildTransformDecodedSearchData(record.path, decodedValue);
	    const cmdStructureSource = getTransformRecordCmdStructureSource(record);
	    const insightData = buildTransformRecordInsightData(record);
	    const commandSchema = getTransformRecordCommandSchema(record);
	    const schemeParamStageSummary = getRecordSchemeParamStageSummary(record);
    const commandSchemaRows = cmdStructureSource
      ? collectCmdHandlerCommandSchemaRows(
          cmdStructureSource.decodedValue,
          cmdStructureSource.source
        ).map(row => ({
          ...row,
          path: joinTransformJsonPath(record.path, row.path),
        }))
      : [];

    return {
      path: record.path,
      sourceLabel: record.sourceLabel,
      ...(commandSchema ? { commandSchema } : {}),
      ...(commandSchemaRows.length > 0 ? { commandSchemaRows } : {}),
      ...(cmdStructureSource ? buildTransformCommandParamSummary(cmdStructureSource.decodedValue) : {}),
      labels: record.steps.map(getTransformStepLabel),
      ...insightData,
      originalValue: record.originalValue,
      originalPreview: formatOriginalPreview(record.originalValue),
      decodedPreview: getTransformDecodedPreview(record),
      ...decodedSearchData,
      decodedPaths,
      decodedPathCount,
      isDecodedPathCountTruncated,
      indexedDecodedPathCount: decodedSearchData.decodedSearchPaths?.length || decodedPaths.length,
      hasMoreDecodedPaths,
      hasCmdStructure: Boolean(cmdStructureSource),
      ...(cmdStructureSource
        ? { getCmdStructureCopyText: createTransformRecordCmdStructureCopyTextGetter(cmdStructureSource, record.path) }
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
    topResourceSchemas: buildTopCommandSchemaGroups(records, { kind: 'resource' }),
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
      ...classifyTransformWarning(warning),
    })),
    unresolvedCandidates: (context.unresolvedCandidates || []).map(candidate => ({
      path: candidate.path,
      ...(candidate.sourceLabel ? { sourceLabel: candidate.sourceLabel } : {}),
      originalValue: candidate.originalValue,
      message: candidate.message,
      length: candidate.length,
      preview: candidate.preview,
      detectedType: candidate.detectedType,
      ...classifyTransformUnresolvedCandidate(candidate),
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
  appendReportRecordLines(lines, report.records, {
    commandSchemaRowLimit: DEFAULT_COMMAND_SCHEMA_ROW_LIMIT,
    formatDecodedPathCount,
  });
  appendReportWarningSection(lines, report.warnings);
  appendReportUnresolvedSection(lines, report.unresolvedCandidates);
  appendReportPlaceholderSection(lines, report.runtimePlaceholderGroups, report.runtimePlaceholders);

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
  const cmdStructureLimit = options?.cmdStructureLimit ?? DEFAULT_TRANSFORM_REPORT_CMD_STRUCTURE_LIMIT;
  const filteredRecords = report.records.filter(record => (
    matchesReportRecord(record, normalizedQuery, TRANSFORM_REPORT_FILTER_OPTIONS)
  ));
  const filteredWarnings = report.warnings.filter(warning => matchesReportWarning(warning, normalizedQuery));
  const filteredUnresolved = report.unresolvedCandidates.filter(
    candidate => matchesUnresolvedCandidate(candidate, normalizedQuery)
  );
  const filteredPlaceholders = report.runtimePlaceholders.filter(
    placeholder => matchesRuntimePlaceholder(placeholder, normalizedQuery)
  );
  const filteredRecordViews = filteredRecords.map(record => (
    buildFilteredRecordView(record, normalizedQuery, TRANSFORM_REPORT_FILTER_OPTIONS)
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
    appendReportRecordLines(lines, reportView.records, {
      commandSchemaRowLimit: DEFAULT_COMMAND_SCHEMA_ROW_LIMIT,
      formatDecodedPathCount,
    });
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

const formatTransformExportFilter = (filter?: string): string => filter?.trim() || '全部';

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

const buildArchiveIssueSampleExport = (
  reportView: TransformReportView,
  filter = ''
): TransformIssueSampleExport | null => {
  return sanitizeTransformIssueSampleExportForArchive(buildTransformIssueSampleExport(reportView, {
    redactSensitiveValues: true,
    filter,
  }));
};

const buildArchivePlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = ''
): TransformPlaceholderFillTemplate | null => (
  sanitizeTransformPlaceholderFillTemplateForArchive(buildTransformPlaceholderFillTemplate(reportView, filter))
);

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

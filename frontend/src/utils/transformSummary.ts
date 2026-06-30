import type {
  TransformContext,
} from '../types';
import { APP_VERSION_LABEL } from './appVersion';
import { collectCmdHandlerCommandSchemaRows } from './schemeMetadata';
import {
  formatTransformContextSummary,
  summarizeTransformContext,
  type TransformContextSummary,
} from './transformContextSummary';
import {
  buildTransformReportCoverage,
} from './transformReportCoverage';
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
import { formatTransformIssueRegressionTemplateText } from './transformIssueRegressionTemplate';
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
  TransformContextReport,
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportDecodedPath,
  TransformReportNestedCommandFieldGroup,
  TransformReportRecord,
  TransformReportResourceTypeGroup,
  TransformReportUnresolvedCandidate,
  TransformReportView,
  TransformReportViewOptions,
  TransformReportWarning,
} from './transformSummaryTypes';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';
import {
  matchesReportWarning,
  matchesUnresolvedCandidate,
} from './transformIssueFilters';
import {
  getRecordSchemeParamStageSummary,
  getSchemeParamStageSearchText,
  getTransformStepLabel,
  sumNonReversibleParamStageCount,
  sumSchemeParamStageCount,
  sumSchemeParamStageRepairHintCount,
} from './transformSchemeParamStages';
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
} from './transformReportTextSections';

export { formatTransformContextSummary, summarizeTransformContext };
export type { TransformContextSummary };
export type { TransformReportCoverage } from './transformReportCoverage';
export type { TransformSuggestedCommand } from './transformSuggestedCommands';
export type {
  TransformArchivePackage,
  TransformArchivePackageOptions,
  TransformCollaborationReportOptions,
  TransformContextReport,
  TransformIssueSampleExport,
  TransformIssueSampleExportItem,
  TransformIssueSampleJsonOptions,
  TransformIssueSampleType,
  TransformPlaceholderFillTemplate,
  TransformPlaceholderFillTemplateDetail,
  TransformPlaceholderFillTemplateSource,
  TransformPlaceholderFillTemplateSuggestion,
  TransformQualitySnapshot,
  TransformQualitySnapshotBucket,
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportCommandSchemaRow,
  TransformReportDecodedPath,
  TransformReportNestedCommandFieldGroup,
  TransformReportRecord,
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
  TransformReportUnresolvedCandidate,
  TransformReportView,
  TransformReportViewOptions,
  TransformReportWarning,
} from './transformSummaryTypes';
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
  formatTransformCmdStructureReportText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderReportText,
} from './transformReportCopyTexts';
export {
  formatTransformDiagnosticSummaryText,
  formatTransformReportViewText,
} from './transformReportDiagnosticText';
export {
  buildTransformTroubleshootingRecipe,
  formatTransformTroubleshootingRecipeJsonText,
} from './transformTroubleshootingRecipe';
export {
  buildTransformQualitySnapshot,
  formatTransformQualitySnapshotJsonText,
} from './transformQualitySnapshot';
export {
  formatTransformCollaborationReportText,
} from './transformCollaborationReport';
export {
  buildTransformArchivePackage,
  formatTransformArchivePackageJsonText,
} from './transformArchivePackage';
export {
  buildTransformIssueSampleExport,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
} from './transformIssueSamples';
export { formatTransformIssueRegressionTemplateText };
export {
  buildTransformPlaceholderFillTemplate,
  formatTransformPlaceholderFillTemplateJsonText,
} from './transformPlaceholderFillTemplate';

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

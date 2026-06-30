import type {
  JsonValue,
  TransformSchemeParamStageSummary,
  TransformWarning,
} from '../types';
import type { TransformContextSummary } from './transformContextSummary';
import type { TransformReportCoverage } from './transformReportCoverage';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
} from './transformSummaryGroupTypes';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';

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

export type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
} from './transformSummaryGroupTypes';

export type {
  TransformArchivePackage,
  TransformArchivePackageOptions,
  TransformCollaborationReportOptions,
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
} from './transformSummaryArtifactTypes';

import type { TransformWarning } from '../types';
import type { AppVersionMetadata } from './appVersion';
import type { TransformReportCoverage } from './transformReportCoverage';
import type { TransformSuggestedCommand } from './transformSuggestedCommands';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceTypeGroup,
} from './transformSummaryGroupTypes';

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

import type { TransformContextSummary } from './transformContextSummary';
import type { TransformReportCoverage } from './transformReportCoverage';
import type {
  TransformReportRecord,
  TransformReportWarning,
  TransformReportUnresolvedCandidate,
} from './transformSummaryRecordTypes';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceTypeGroup,
} from './transformSummaryGroupTypes';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';

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

export type {
  TransformReportCommandSchemaRow,
  TransformReportDecodedPath,
} from './transformSummaryDecodedPathTypes';

export type {
  TransformReportView,
  TransformReportViewOptions,
} from './transformSummaryViewTypes';

export type {
  TransformReportRecord,
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummaryRecordTypes';

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

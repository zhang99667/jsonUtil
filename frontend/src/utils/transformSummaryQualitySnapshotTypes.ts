import type { AppVersionMetadata } from './appVersion';
import type { TransformReportCoverage } from './transformReportCoverage';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportNestedCommandFieldGroup,
  TransformReportResourceTypeGroup,
} from './transformSummaryGroupTypes';

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

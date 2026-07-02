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

export interface TransformQualitySnapshotHotspots {
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
}

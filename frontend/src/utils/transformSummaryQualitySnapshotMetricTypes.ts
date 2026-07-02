export interface TransformQualitySnapshotMetrics {
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
}

export interface TransformQualitySnapshotTruncation {
  records: boolean;
  cmdStructures: boolean;
  runtimePlaceholders: boolean;
  unresolved: boolean;
  warnings: boolean;
}

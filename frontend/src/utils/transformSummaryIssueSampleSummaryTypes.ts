export interface TransformIssueSampleExportSummaryBucket {
  copied: number;
  filtered: number;
  total: number;
  truncated: boolean;
}

export interface TransformIssueSampleExportSummary {
  unresolved: TransformIssueSampleExportSummaryBucket;
  runtimePlaceholders: TransformIssueSampleExportSummaryBucket;
  warnings: TransformIssueSampleExportSummaryBucket;
}

import type { AppVersionMetadata } from './appVersion';
import type { TransformReportCoverage } from './transformReportCoverage';
import type { TransformQualitySnapshotHotspots } from './transformSummaryQualitySnapshotHotspotTypes';
import type {
  TransformQualitySnapshotMetrics,
  TransformQualitySnapshotTruncation,
} from './transformSummaryQualitySnapshotMetricTypes';

export interface TransformQualitySnapshot {
  schemaVersion: 1;
  kind: 'json-helper-transform-quality-snapshot';
  tool: AppVersionMetadata;
  filter: string;
  coverage: TransformReportCoverage;
  totals: TransformQualitySnapshotMetrics;
  filtered: TransformQualitySnapshotMetrics;
  hotspots: TransformQualitySnapshotHotspots;
  truncation: TransformQualitySnapshotTruncation;
  recommendations: string[];
}

export type {
  TransformQualitySnapshotBucket,
  TransformQualitySnapshotHotspots,
} from './transformSummaryQualitySnapshotHotspotTypes';

export type {
  TransformQualitySnapshotMetrics,
  TransformQualitySnapshotTruncation,
} from './transformSummaryQualitySnapshotMetricTypes';

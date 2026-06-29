import { APP_VERSION_METADATA } from './appVersion';
import { buildQualitySnapshotHotspots } from './transformQualitySnapshotHotspots';
import {
  buildQualitySnapshotFiltered,
  buildQualitySnapshotTotals,
  buildQualitySnapshotTruncation,
} from './transformQualitySnapshotMetrics';
import { buildQualitySnapshotRecommendations } from './transformQualityRecommendations';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportView,
} from './transformSummary';

const formatQualitySnapshotFilter = (filter?: string): string => filter?.trim() || '全部';

export const buildTransformQualitySnapshot = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): TransformQualitySnapshot => ({
  schemaVersion: 1,
  kind: 'json-helper-transform-quality-snapshot',
  tool: APP_VERSION_METADATA,
  filter: formatQualitySnapshotFilter(query),
  coverage: report.coverage,
  totals: buildQualitySnapshotTotals(reportView),
  filtered: buildQualitySnapshotFiltered(reportView),
  hotspots: buildQualitySnapshotHotspots(report, reportView),
  truncation: buildQualitySnapshotTruncation(reportView),
  recommendations: buildQualitySnapshotRecommendations(reportView),
});

export const formatTransformQualitySnapshotJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => JSON.stringify(buildTransformQualitySnapshot(report, reportView, query), null, 2);

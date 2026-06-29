import { buildQualitySnapshotBuckets } from './transformQualityBuckets';
import { buildSchemeParamStageQualityBuckets } from './transformSchemeParamStages';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportView,
} from './transformSummary';

const DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT = 8;
const DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT = 4;

export const buildQualitySnapshotHotspots = (
  report: TransformContextReport,
  reportView: TransformReportView
): TransformQualitySnapshot['hotspots'] => ({
  topCommandSchemas: (report.topCommandSchemas || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  topCommandSchemaOrigins: (report.topCommandSchemaOrigins || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  topResourceSchemas: (report.topResourceSchemas || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  topResourceTypes: (report.topResourceTypes || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  topNestedCommandFields: (report.topNestedCommandFields || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  topNestedResourceFields: (report.topNestedResourceFields || []).slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT),
  unresolvedReasons: buildQualitySnapshotBuckets(
    reportView.unresolvedCandidates,
    candidate => candidate.reasonLabel,
    candidate => candidate.path
  ),
  warningReasons: buildQualitySnapshotBuckets(
    reportView.warnings,
    warning => warning.reasonLabel,
    warning => warning.path
  ),
  warningTypes: buildQualitySnapshotBuckets(
    reportView.warnings,
    warning => warning.type,
    warning => warning.path
  ),
  runtimePlaceholders: reportView.runtimePlaceholderGroups
    .slice(0, DEFAULT_QUALITY_SNAPSHOT_TOP_LIMIT)
    .map(group => ({
      key: group.value,
      count: group.count,
      paths: group.sources.slice(0, DEFAULT_QUALITY_SNAPSHOT_PATH_LIMIT).map(source => source.sourcePath),
    })),
  schemeParamStageSources: buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.sources
  ),
  schemeParamStageKeys: buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.keys
  ),
  schemeParamStageRepairHints: buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.repairHintLabels
  ),
});

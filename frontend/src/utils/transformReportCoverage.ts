import {
  buildTransformReportPlaceholderCoverage,
  buildTransformReportSuccessCoverage,
  buildTransformReportUnresolvedCoverage,
  buildTransformReportWarningCoverage,
} from './transformReportCoverageDetails';
import { buildTransformReportCoverageScore } from './transformReportCoverageScore';
import type {
  TransformReportCoverage,
  TransformReportCoverageSummary,
} from './transformReportCoverageTypes';

export type { TransformReportCoverage } from './transformReportCoverageTypes';

export const buildTransformReportCoverage = (
  summary: TransformReportCoverageSummary
): TransformReportCoverage => {
  const score = buildTransformReportCoverageScore(summary);

  if (summary.warningCount > 0) {
    return buildTransformReportWarningCoverage(score, summary.warningCount);
  }

  if (summary.unresolvedCount > 0) {
    return buildTransformReportUnresolvedCoverage(score, summary.unresolvedCount);
  }

  if (summary.placeholderCount > 0) {
    return buildTransformReportPlaceholderCoverage(score, summary);
  }

  return buildTransformReportSuccessCoverage(score, summary.recordCount);
};

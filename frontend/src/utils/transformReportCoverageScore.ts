import type { TransformReportCoverageSummary } from './transformReportCoverageTypes';

export const buildTransformReportCoverageScore = ({
  recordCount,
  unresolvedCount,
  warningCount,
}: TransformReportCoverageSummary): number => {
  const attentionCount = unresolvedCount + warningCount;
  const totalCount = recordCount + attentionCount;

  return totalCount === 0
    ? 100
    : Math.round((recordCount / totalCount) * 100);
};

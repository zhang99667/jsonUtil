import { APP_VERSION_METADATA } from './appVersion';
import { buildTransformArchivePackageArtifacts } from './transformArchivePackageArtifacts';
import { buildArchiveSuggestedCommands } from './transformSuggestedCommands';
import {
  buildTransformArchiveCorpusCandidate,
  buildTransformArchivePackageSafety,
} from './transformArchivePackageMetadata';
import type {
  TransformArchivePackage,
  TransformArchivePackageOptions,
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

export const buildTransformArchivePackage = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformArchivePackageOptions = {}
): TransformArchivePackage => {
  const normalizedQuery = query.trim();
  const sampleName = options.sampleName?.trim() || 'sample-name';
  const cmdComparisonReportText = options.cmdComparisonReportText?.trim();
  const cmdComparisonCandidateText = options.cmdComparisonCandidateText?.trim();
  const hasCmdComparisonContext = Boolean(cmdComparisonReportText || cmdComparisonCandidateText);

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-archive-package',
    tool: APP_VERSION_METADATA,
    filter: normalizedQuery || '全部',
    safety: buildTransformArchivePackageSafety(hasCmdComparisonContext),
    artifacts: buildTransformArchivePackageArtifacts({
      report,
      reportView,
      query,
      cmdComparisonReportText,
      cmdComparisonCandidateText,
    }),
    suggestedCommands: buildArchiveSuggestedCommands(),
    corpusCandidate: buildTransformArchiveCorpusCandidate(sampleName),
  };
};

export const formatTransformArchivePackageJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformArchivePackageOptions = {}
): string => JSON.stringify(buildTransformArchivePackage(report, reportView, query, options), null, 2);

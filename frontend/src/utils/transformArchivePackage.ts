import { APP_VERSION_METADATA } from './appVersion';
import {
  sanitizeTransformIssueSampleExportForArchive,
  sanitizeTransformPlaceholderFillTemplateForArchive,
} from './transformArchiveSanitizers';
import { formatTransformCollaborationReportText } from './transformCollaborationReport';
import { buildTransformIssueSampleExport } from './transformIssueSamples';
import { buildTransformPlaceholderFillTemplate } from './transformPlaceholderFillTemplate';
import { formatTransformDiagnosticSummaryText } from './transformReportDiagnosticText';
import { buildArchiveSuggestedCommands } from './transformSuggestedCommands';
import { buildTransformQualitySnapshot } from './transformQualitySnapshot';
import {
  buildTransformArchiveCorpusCandidate,
  buildTransformArchivePackageSafety,
} from './transformArchivePackageMetadata';
import type {
  TransformArchivePackage,
  TransformArchivePackageOptions,
  TransformContextReport,
  TransformIssueSampleExport,
  TransformPlaceholderFillTemplate,
  TransformReportView,
} from './transformSummary';

const formatTransformExportFilter = (filter?: string): string => filter?.trim() || '全部';

const buildArchiveIssueSampleExport = (
  reportView: TransformReportView,
  filter = ''
): TransformIssueSampleExport | null => {
  return sanitizeTransformIssueSampleExportForArchive(buildTransformIssueSampleExport(reportView, {
    redactSensitiveValues: true,
    filter,
  }));
};

const buildArchivePlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = ''
): TransformPlaceholderFillTemplate | null => (
  sanitizeTransformPlaceholderFillTemplateForArchive(buildTransformPlaceholderFillTemplate(reportView, filter))
);

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
  const qualitySnapshot = buildTransformQualitySnapshot(report, reportView, query);
  const collaborationOptions = {
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };
  const artifacts: TransformArchivePackage['artifacts'] = {
    diagnosticSummaryText: formatTransformDiagnosticSummaryText(report, reportView, query),
    collaborationReportText: formatTransformCollaborationReportText(report, reportView, query, collaborationOptions),
    qualitySnapshot,
    issueSamples: buildArchiveIssueSampleExport(reportView, query),
    placeholderFillTemplate: buildArchivePlaceholderFillTemplate(reportView, query),
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-archive-package',
    tool: APP_VERSION_METADATA,
    filter: normalizedQuery || '全部',
    safety: buildTransformArchivePackageSafety(hasCmdComparisonContext),
    artifacts,
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

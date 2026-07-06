import {
  sanitizeTransformIssueSampleExportForArchive,
  sanitizeTransformPlaceholderFillTemplateForArchive,
} from './transformArchiveSanitizers';
import { formatTransformCollaborationReportText } from './transformCollaborationReport';
import { buildTransformIssueSampleExport } from './transformIssueSamples';
import { buildTransformPlaceholderFillTemplate } from './transformPlaceholderFillTemplate';
import { buildTransformQualitySnapshot } from './transformQualitySnapshot';
import { formatTransformDiagnosticSummaryText } from './transformReportDiagnosticText';
import type { TransformArchivePackage, TransformContextReport, TransformIssueSampleExport, TransformPlaceholderFillTemplate, TransformReportView } from './transformSummary';

interface TransformArchivePackageArtifactsInput {
  report: TransformContextReport;
  reportView: TransformReportView;
  query: string;
  cmdComparisonReportText?: string;
  cmdComparisonCandidateText?: string;
}

const buildArchiveIssueSampleExport = (
  reportView: TransformReportView,
  filter = ''
): TransformIssueSampleExport | null => (
  sanitizeTransformIssueSampleExportForArchive(buildTransformIssueSampleExport(reportView, {
    redactSensitiveValues: true,
    filter,
  }))
);

const buildArchivePlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = ''
): TransformPlaceholderFillTemplate | null => (
  sanitizeTransformPlaceholderFillTemplateForArchive(buildTransformPlaceholderFillTemplate(reportView, filter))
);

export const buildTransformArchivePackageArtifacts = ({
  report,
  reportView,
  query,
  cmdComparisonReportText,
  cmdComparisonCandidateText,
}: TransformArchivePackageArtifactsInput): TransformArchivePackage['artifacts'] => {
  const collaborationOptions = {
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };

  return {
    diagnosticSummaryText: formatTransformDiagnosticSummaryText(report, reportView, query),
    collaborationReportText: formatTransformCollaborationReportText(report, reportView, query, collaborationOptions),
    qualitySnapshot: buildTransformQualitySnapshot(report, reportView, query),
    issueSamples: buildArchiveIssueSampleExport(reportView, query),
    placeholderFillTemplate: buildArchivePlaceholderFillTemplate(reportView, query),
    ...(cmdComparisonReportText ? { cmdComparisonReportText } : {}),
    ...(cmdComparisonCandidateText ? { cmdComparisonCandidateText } : {}),
  };
};

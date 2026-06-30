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
    safety: {
      containsRawResponse: false,
      issueSampleOriginalValues: 'omitted-or-redacted',
      placeholderSourcePreviews: false,
      cmdComparisonMayContainValues: Boolean(cmdComparisonReportText || cmdComparisonCandidateText),
      notes: [
        '归档包默认不携带原始 response；保存 corpus 前请单独提供已脱敏的 response 文件。',
        '问题样本 originalValue 已省略或脱敏，避免把 token/sign/cookie/设备标识带入协作材料。',
        '如包含 cmdHandler 差异报告，提交前仍需确认其中 actual/expected 值是否需要脱敏。',
      ],
    },
    artifacts,
    suggestedCommands: buildArchiveSuggestedCommands(),
    corpusCandidate: {
      recommendedFiles: [
        `${sampleName}.redacted.json`,
        `${sampleName}.expected.snapshot.json`,
        `${sampleName}.cmdhandler.expected.json`,
      ],
      checklist: [
        `将已脱敏原始 response 保存为 ${sampleName}.redacted.json`,
        `将 artifacts.qualitySnapshot 转写为 ${sampleName}.expected.snapshot.json`,
        `如已粘贴 cmdHandler 输出，将稳定子集保存为 ${sampleName}.cmdhandler.expected.json`,
        '把 artifacts.issueSamples 中仍有价值的路径补成单测或 corpus 阈值断言',
      ],
    },
  };
};

export const formatTransformArchivePackageJsonText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformArchivePackageOptions = {}
): string => JSON.stringify(buildTransformArchivePackage(report, reportView, query, options), null, 2);

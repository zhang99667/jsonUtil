import { APP_VERSION_LABEL } from './appVersion';
import { buildCollaborationCmdHandlerLines } from './transformCollaborationCmdHandlerLines';
import { buildCollaborationQualitySnapshotLines } from './transformCollaborationQualitySnapshotLines';
import { formatTransformDiagnosticSummaryText } from './transformReportDiagnosticText';
import { buildTransformQualitySnapshot } from './transformQualitySnapshot';
import type {
  TransformCollaborationReportOptions,
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

export const formatTransformCollaborationReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string,
  options: TransformCollaborationReportOptions = {}
): string => {
  const normalizedQuery = query.trim();
  const qualitySnapshot = buildTransformQualitySnapshot(report, reportView, query);
  const diagnosticLines = formatTransformDiagnosticSummaryText(report, reportView, query)
    .split('\n')
    .slice(2);
  const lines = [
    '深度解析协作排查报告',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${normalizedQuery || '全部'}`,
    '',
    '一、诊断摘要',
    ...diagnosticLines,
    '',
    '二、质量快照要点',
    ...buildCollaborationQualitySnapshotLines(qualitySnapshot),
    '',
    '三、cmdHandler 对齐',
    ...buildCollaborationCmdHandlerLines(reportView, options),
  ];

  return lines.join('\n');
};

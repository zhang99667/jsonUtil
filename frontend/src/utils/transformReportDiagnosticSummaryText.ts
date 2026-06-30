import { APP_VERSION_LABEL } from './appVersion';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummaryTypes';
import {
  appendDiagnosticSummaryRecommendationSection,
  appendDiagnosticSummarySampleSections,
  appendDiagnosticSummaryTopSections,
} from './transformReportDiagnosticSummarySections';

export const formatTransformDiagnosticSummaryText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    '深度解析诊断摘要',
    `工具版本: ${APP_VERSION_LABEL}`,
    report.summaryText || '深度解析: 无展开记录',
    `筛选: ${normalizedQuery || '全部'}`,
    `覆盖: ${report.coverage.label}，${report.coverage.description}`,
    `规模: 展开 ${reportView.filteredRecordCount}/${reportView.totalRecordCount}，CMD结构 ${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount}，内部CMD字段 ${reportView.filteredNestedCommandFieldCount}/${reportView.totalNestedCommandFieldCount}，资源字段 ${reportView.filteredNestedResourceFieldCount}/${reportView.totalNestedResourceFieldCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}，参数层 ${reportView.filteredSchemeParamStageCount}/${reportView.totalSchemeParamStageCount}，参数修复 ${reportView.filteredSchemeParamStageRepairHintCount}/${reportView.totalSchemeParamStageRepairHintCount}，待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}`,
  ];

  appendDiagnosticSummaryTopSections(lines, report, reportView);
  appendDiagnosticSummarySampleSections(lines, reportView);
  appendDiagnosticSummaryRecommendationSection(lines, reportView);

  return lines.join('\n');
};

import { APP_VERSION_LABEL } from './appVersion';
import { formatTransformDiagnosticSummaryText } from './transformReportDiagnosticText';
import { formatResourceSchemaGroupTitle } from './transformReportTextSections';
import { buildTransformQualitySnapshot } from './transformQualitySnapshot';
import type {
  TransformCollaborationReportOptions,
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

const COLLABORATION_TOP_LIMIT = 5;

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
  const cmdComparisonReportText = options.cmdComparisonReportText?.trim();
  const cmdComparisonCandidateText = options.cmdComparisonCandidateText?.trim();
  const lines = [
    '深度解析协作排查报告',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${normalizedQuery || '全部'}`,
    '',
    '一、诊断摘要',
    ...diagnosticLines,
    '',
    '二、质量快照要点',
    `- 覆盖: ${qualitySnapshot.coverage.score} (${qualitySnapshot.coverage.level})，${qualitySnapshot.coverage.description}`,
    `- 全量规模: 展开 ${qualitySnapshot.totals.records}，CMD结构 ${qualitySnapshot.totals.cmdStructures}，内部CMD字段 ${qualitySnapshot.totals.nestedCommandFields}，资源字段 ${qualitySnapshot.totals.nestedResourceFields}，占位符 ${qualitySnapshot.totals.runtimePlaceholders}，参数层 ${qualitySnapshot.totals.schemeParamStages}，参数修复 ${qualitySnapshot.totals.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.totals.unresolved}，跳过 ${qualitySnapshot.totals.warnings}`,
    `- 当前筛选: 展开 ${qualitySnapshot.filtered.records}，CMD结构 ${qualitySnapshot.filtered.cmdStructures}，内部CMD字段 ${qualitySnapshot.filtered.nestedCommandFields}，资源字段 ${qualitySnapshot.filtered.nestedResourceFields}，占位符 ${qualitySnapshot.filtered.runtimePlaceholders}，参数层 ${qualitySnapshot.filtered.schemeParamStages}，参数修复 ${qualitySnapshot.filtered.schemeParamStageRepairHints}，待检查 ${qualitySnapshot.filtered.unresolved}，跳过 ${qualitySnapshot.filtered.warnings}`,
  ];

  if (qualitySnapshot.hotspots.topCommandSchemas.length > 0) {
    lines.push('- CMD Schema Top:');
    qualitySnapshot.hotspots.topCommandSchemas.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${group.schema} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topResourceSchemas.length > 0) {
    lines.push('- 静态资源 URL Top:');
    qualitySnapshot.hotspots.topResourceSchemas.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${formatResourceSchemaGroupTitle(group)} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topResourceTypes.length > 0) {
    lines.push('- 静态资源类型 Top:');
    qualitySnapshot.hotspots.topResourceTypes.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.topNestedCommandFields.length > 0) {
    lines.push('- 内部 CMD 字段 Top:');
    qualitySnapshot.hotspots.topNestedCommandFields.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  }

  if (qualitySnapshot.hotspots.schemeParamStageRepairHints.length > 0) {
    lines.push('- 参数分层修复 Top:');
    qualitySnapshot.hotspots.schemeParamStageRepairHints.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  } else if (qualitySnapshot.hotspots.schemeParamStageKeys.length > 0) {
    lines.push('- 参数分层 Key Top:');
    qualitySnapshot.hotspots.schemeParamStageKeys.slice(0, COLLABORATION_TOP_LIMIT).forEach(group => {
      lines.push(`  - ${group.key} ×${group.count}`);
    });
  }

  if (qualitySnapshot.recommendations.length > 0) {
    lines.push('- 建议动作:');
    qualitySnapshot.recommendations.forEach(recommendation => {
      lines.push(`  - ${recommendation}`);
    });
  }

  lines.push('', '三、cmdHandler 对齐');
  if (cmdComparisonReportText) {
    lines.push('- 已附当前页面内 cmdHandler 差异报告:');
    lines.push('```text', cmdComparisonReportText, '```');
    if (cmdComparisonCandidateText) {
      lines.push('- actual 候选推荐:');
      lines.push('```text', cmdComparisonCandidateText, '```');
    }
  } else if (reportView.filteredCmdStructureCount > 0) {
    lines.push(`- 待对比: 当前筛选有 ${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount} 条可复制 CMD 结构，可粘贴内部 cmdHandler 输出后再次复制本报告。`);
    reportView.cmdStructureRecords.slice(0, COLLABORATION_TOP_LIMIT).forEach(record => {
      const schema = record.commandSchema || record.commandSchemaRows?.[0]?.schema || '(未知 schema)';
      lines.push(`  - ${record.path}: ${schema}`);
    });
    if (reportView.isCmdStructureTruncated) {
      lines.push(`  - 还有 ${reportView.filteredCmdStructureCount - reportView.cmdStructureRecords.length} 条 CMD 结构未列出`);
    }
  } else {
    lines.push('- 当前筛选未识别可复制 CMD 结构，优先确认输入中是否包含 CMD/Scheme 字段。');
  }

  return lines.join('\n');
};

import type {
  TransformCollaborationReportOptions,
  TransformReportView,
} from './transformSummary';

const COLLABORATION_TOP_LIMIT = 5;

export const buildCollaborationCmdHandlerLines = (
  reportView: TransformReportView,
  options: TransformCollaborationReportOptions = {}
): string[] => {
  const cmdComparisonReportText = options.cmdComparisonReportText?.trim();
  const cmdComparisonCandidateText = options.cmdComparisonCandidateText?.trim();

  if (cmdComparisonReportText) {
    return [
      '- 已附当前页面内 cmdHandler 差异报告:',
      '```text',
      cmdComparisonReportText,
      '```',
      ...(cmdComparisonCandidateText ? [
        '- actual 候选推荐:',
        '```text',
        cmdComparisonCandidateText,
        '```',
      ] : []),
    ];
  }

  if (reportView.filteredCmdStructureCount === 0) {
    return ['- 当前筛选未识别可复制 CMD 结构，优先确认输入中是否包含 CMD/Scheme 字段。'];
  }

  const lines = [
    `- 待对比: 当前筛选有 ${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount} 条可复制 CMD 结构，可粘贴内部 cmdHandler 输出后再次复制本报告。`,
  ];

  const listedRecords = reportView.cmdStructureRecords.slice(0, COLLABORATION_TOP_LIMIT);
  listedRecords.forEach(record => {
    const schema = record.commandSchema || record.commandSchemaRows?.[0]?.schema || '(未知 schema)';
    lines.push(`  - ${record.path}: ${schema}`);
  });
  if (reportView.isCmdStructureTruncated) {
    const hiddenRecordCount = Math.max(reportView.filteredCmdStructureCount - listedRecords.length, 0);
    lines.push(`  - 还有 ${hiddenRecordCount} 条 CMD 结构未列出`);
  }

  return lines;
};

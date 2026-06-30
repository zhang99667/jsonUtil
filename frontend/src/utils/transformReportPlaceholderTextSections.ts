import {
  formatSourceLabelText,
  getSourceLabelDisplayValue,
} from './sourceLabels';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformSummary';

export const appendReportPlaceholderSection = (
  lines: string[],
  placeholderGroups: TransformReportRuntimePlaceholderGroup[],
  runtimePlaceholders: TransformReportRuntimePlaceholder[]
) => {
  if (runtimePlaceholders.length === 0) return;

  lines.push('', '运行时占位符汇总:');
  placeholderGroups.forEach(group => {
    lines.push(`- ${group.value} ×${group.count}: ${group.description}`);
    lines.push(`  来源数: ${group.sourceCount}`);
    lines.push(`  主要来源: ${group.sources.map(source => (
      `${source.sourceLabel ? `${getSourceLabelDisplayValue(source.sourceLabel)} ` : ''}${source.sourcePath} ×${source.count}`
    )).join('；')}`);
  });

  lines.push('', '运行时占位符明细:');
  runtimePlaceholders.forEach(placeholder => {
    lines.push(`- ${placeholder.path}: ${placeholder.value}`);
    lines.push(`  来源: ${placeholder.sourcePath}`);
    if (placeholder.sourceLabel) {
      lines.push(`  ${formatSourceLabelText(placeholder.sourceLabel)}`);
    }
    if (placeholder.sourceOriginalPreview) {
      lines.push(`  来源预览: ${placeholder.sourceOriginalPreview}`);
    }
    lines.push(`  说明: ${placeholder.description}`);
  });
};

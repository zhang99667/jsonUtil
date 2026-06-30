import { formatSourceLabelText, getSourceLabelDisplayValue } from './sourceLabels';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummary';
export type { TransformReportRecordTextOptions } from './transformReportRecordTextLines';
export { appendReportRecordLines } from './transformReportRecordTextLines';
export {
  appendCommandSchemaOriginSummarySection,
  appendCommandSchemaSummarySection,
  appendNestedCommandFieldSummarySection,
  appendNestedResourceFieldSummarySection,
  appendResourceSchemaSummarySection,
  appendResourceTypeSummarySection,
  formatResourceSchemaGroupTitle,
} from './transformReportTextDistributionSections';

export const appendReportWarningSection = (
  lines: string[],
  warnings: TransformReportWarning[]
) => {
  if (warnings.length === 0) return;

  lines.push('', '跳过记录:');
  warnings.forEach(warning => {
    lines.push(`- ${warning.path}: ${warning.message} (${warning.length}/${warning.limit})`);
    if (warning.sourceLabel) {
      lines.push(`  ${formatSourceLabelText(warning.sourceLabel)}`);
    }
    lines.push(`  原因: ${warning.reasonLabel}`);
    lines.push(`  下一步: ${warning.nextAction}`);
  });
};

export const appendReportUnresolvedSection = (
  lines: string[],
  unresolvedCandidates: TransformReportUnresolvedCandidate[]
) => {
  if (unresolvedCandidates.length === 0) return;

  lines.push('', '未展开线索:');
  unresolvedCandidates.forEach(candidate => {
    const typeText = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
    lines.push(`- ${candidate.path}${typeText}: ${candidate.message} (${candidate.length} 字符)`);
    if (candidate.sourceLabel) {
      lines.push(`  ${formatSourceLabelText(candidate.sourceLabel)}`);
    }
    lines.push(`  原因: ${candidate.reasonLabel}`);
    lines.push(`  下一步: ${candidate.nextAction}`);
    lines.push(`  预览: ${candidate.preview}`);
  });
};

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

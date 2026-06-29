import { APP_VERSION_LABEL } from './appVersion';
import { formatSourceLabelText } from './sourceLabels';
import type { TransformReportView } from './transformSummary';

export const formatIssueSampleFilter = (filter?: string): string => filter?.trim() || '全部';

export const formatTransformIssueSampleReportText = (
  reportView: TransformReportView,
  filter = ''
): string => {
  const lines = [
    '深度解析问题样本',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${formatIssueSampleFilter(filter)}`,
    `待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}`,
  ];
  let sampleCount = 0;

  if (reportView.unresolvedCandidates.length > 0) {
    lines.push('', '未展开线索:');
    reportView.unresolvedCandidates.forEach(candidate => {
      sampleCount++;
      const typeText = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${typeText}`);
      if (candidate.sourceLabel) lines.push(`  ${formatSourceLabelText(candidate.sourceLabel)}`);
      lines.push(`  原因: ${candidate.reasonLabel}`);
      lines.push(`  下一步: ${candidate.nextAction}`);
      lines.push('  原始值:');
      lines.push(candidate.originalValue);
    });
    if (reportView.isUnresolvedTruncated) {
      lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条未展开线索未复制`);
    }
  }

  const placeholderSamples = reportView.runtimePlaceholders.filter(
    placeholder => Boolean(placeholder.sourceOriginalValue)
  );
  if (placeholderSamples.length > 0) {
    lines.push('', '运行时占位符来源:');
    placeholderSamples.forEach(placeholder => {
      sampleCount++;
      lines.push(`- ${placeholder.path}: ${placeholder.value}`);
      lines.push(`  来源: ${placeholder.sourcePath}`);
      if (placeholder.sourceLabel) lines.push(`  ${formatSourceLabelText(placeholder.sourceLabel)}`);
      lines.push(`  说明: ${placeholder.description}`);
      lines.push('  来源原始值:');
      lines.push(placeholder.sourceOriginalValue || '');
    });
    if (reportView.isPlaceholderTruncated) {
      lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
    }
  }

  if (reportView.warnings.length > 0) {
    lines.push('', '跳过记录:');
    reportView.warnings.forEach(warning => {
      sampleCount++;
      lines.push(`- ${warning.path}: ${warning.reasonLabel}`);
      if (warning.sourceLabel) lines.push(`  ${formatSourceLabelText(warning.sourceLabel)}`);
      lines.push(`  下一步: ${warning.nextAction}`);
      lines.push(`  长度: ${warning.length}/${warning.limit}`);
      lines.push('  原始值:');
      lines.push(warning.originalValue);
    });
    if (reportView.isWarningTruncated) {
      lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未复制`);
    }
  }

  return sampleCount > 0 ? lines.join('\n') : '';
};

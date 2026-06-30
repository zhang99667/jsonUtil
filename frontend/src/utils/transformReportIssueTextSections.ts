import { formatSourceLabelText } from './sourceLabels';
import type {
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummary';

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

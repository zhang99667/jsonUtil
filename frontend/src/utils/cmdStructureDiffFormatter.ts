import type {
  CmdStructureDiff,
  CmdStructureDiffContext,
} from './cmdStructureDiff';
import {
  appendCmdStructureDiffContextLines,
  appendCmdStructurePathDiffLines,
  formatCmdStructureSourceValue,
} from './cmdStructureDiffReportSections';
import { formatCmdStructureValuePreview } from './cmdStructureValueFormatter';

export const formatCmdStructureDiff = (
  diff: CmdStructureDiff,
  context: CmdStructureDiffContext = {}
): string => {
  const lines = ['CMD 结构差异报告'];
  appendCmdStructureDiffContextLines(lines, context);

  if (!diff.hasDifferences) {
    lines.push('- 结构一致');
    if (diff.ignoredExtraPaths.length > 0) {
      appendCmdStructurePathDiffLines(lines, '已忽略 actual 额外路径', diff.ignoredExtraPaths);
    }
    return lines.join('\n');
  }

  if (diff.schemaDiff) {
    lines.push(`- cmdSchema 不一致: actual=${diff.schemaDiff.actual || '(空)'} expected=${diff.schemaDiff.expected || '(空)'}`);
  }

  if (diff.sourceDiff) {
    lines.push('- source 不一致');
    lines.push(`  actual: ${formatCmdStructureSourceValue(diff.sourceDiff.actual)}`);
    lines.push(`  expected: ${formatCmdStructureSourceValue(diff.sourceDiff.expected)}`);
  }

  if (diff.missingPaths.length > 0) {
    appendCmdStructurePathDiffLines(lines, '缺失路径', diff.missingPaths);
  }

  if (diff.extraPaths.length > 0) {
    appendCmdStructurePathDiffLines(lines, '额外路径', diff.extraPaths);
  }

  if (diff.ignoredExtraPaths.length > 0) {
    appendCmdStructurePathDiffLines(lines, '已忽略 actual 额外路径', diff.ignoredExtraPaths);
  }

  if (diff.valueDiffs.length > 0) {
    lines.push(`- 值不一致 ${diff.valueDiffs.length} 个:`);
    diff.valueDiffs.slice(0, 20).forEach(item => {
      lines.push(`  - ${item.path}: actual=${formatCmdStructureValuePreview(item.actual)} expected=${formatCmdStructureValuePreview(item.expected)}`);
    });
    if (diff.valueDiffs.length > 20) lines.push(`  - ... 还有 ${diff.valueDiffs.length - 20} 个`);
  }

  return lines.join('\n');
};

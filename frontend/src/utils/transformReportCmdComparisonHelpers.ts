import type { JsonValue } from '../types';
import {
  countCmdStructurePathBranches,
  hasRecognizableCmdStructure,
  type RankedCmdStructureCandidate,
} from './cmdStructureDiff';

export const assertRecognizableCmdComparisonExpected = (value: JsonValue) => {
  if (!hasRecognizableCmdStructure(value)) {
    throw new Error('cmdHandler 输出未识别到 CMD 结构，请粘贴解析后的 result、树形文本或包含主 CMD 字段的 response');
  }
};

export const formatCmdPathCountSummary = (label: string, paths: string[]): string => {
  const branchCount = countCmdStructurePathBranches(paths);
  return branchCount < paths.length
    ? `${label}分支 ${branchCount}`
    : `${label} ${paths.length}`;
};

export const formatCmdCandidateSummary = (candidate: RankedCmdStructureCandidate): string => {
  const { diff } = candidate;
  if (!diff.hasDifferences) {
    return `结构一致${diff.ignoredExtraPaths.length ? `，${formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)}` : ''}`;
  }

  return [
    `Schema ${diff.schemaDiff ? 1 : 0}`,
    `Source ${diff.sourceDiff ? 1 : 0}`,
    formatCmdPathCountSummary('缺失', diff.missingPaths),
    formatCmdPathCountSummary('额外', diff.extraPaths),
    `值 ${diff.valueDiffs.length}`,
    ...(diff.ignoredExtraPaths.length ? [formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)] : []),
  ].join('，');
};

export const rebaseCmdStructureCandidatePath = (recordPath: string, candidatePath: string): string => {
  if (candidatePath === '$' || candidatePath === '$.result') return recordPath;
  if (candidatePath.startsWith('$.result.cmdParams')) {
    return `${recordPath}.cmdParams${candidatePath.slice('$.result.cmdParams'.length)}`;
  }
  if (candidatePath.startsWith('$.cmdParams')) {
    return `${recordPath}.cmdParams${candidatePath.slice('$.cmdParams'.length)}`;
  }
  if (candidatePath.startsWith('$.result')) {
    return `${recordPath}${candidatePath.slice('$.result'.length)}`;
  }
  if (candidatePath.startsWith('$')) return `${recordPath}${candidatePath.slice(1)}`;
  return `${recordPath}.${candidatePath}`;
};

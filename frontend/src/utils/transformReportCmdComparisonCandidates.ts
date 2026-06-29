import type { JsonValue } from '../types';
import {
  collectActualCmdStructureCandidates,
  parseCmdStructureJson,
  rankCmdStructureCandidates,
} from './cmdStructureDiff';
import {
  formatCmdCandidateSummary,
  rebaseCmdStructureCandidatePath,
} from './transformReportCmdComparisonHelpers';
import {
  getTransformRecordCmdStructureCopyText,
  type TransformReportRecord,
} from './transformSummary';
import type {
  CmdComparisonCandidateInput,
  RankedCmdComparisonCandidate,
} from './transformReportCmdComparisonTypes';

export const buildCmdComparisonCandidates = (
  candidateRecords: TransformReportRecord[],
  expected: JsonValue,
  ignoreExtraPaths: boolean,
  activeRecord?: TransformReportRecord | null
): RankedCmdComparisonCandidate[] => {
  const candidateRecordMap = new Map<string, TransformReportRecord>();
  candidateRecords.forEach(candidateRecord => {
    candidateRecordMap.set(candidateRecord.path, candidateRecord);
  });
  if (activeRecord) {
    candidateRecordMap.set(activeRecord.path, activeRecord);
  }

  const candidateInputs = Array.from(candidateRecordMap.values()).reduce<CmdComparisonCandidateInput[]>((items, candidateRecord) => {
    const candidateText = getTransformRecordCmdStructureCopyText(candidateRecord);
    if (!candidateText) return items;

    try {
      const actual = parseCmdStructureJson(candidateText, '本工具 CMD 结构');
      items.push({
        id: candidateRecord.path,
        label: candidateRecord.path,
        sourceLabel: candidateRecord.sourceLabel,
        commandSchema: candidateRecord.commandSchema,
        actual,
        recordPath: candidateRecord.path,
      });
      collectActualCmdStructureCandidates(actual).forEach(candidate => {
        const id = rebaseCmdStructureCandidatePath(candidateRecord.path, candidate.id);
        if (id === candidateRecord.path) return;

        items.push({
          id,
          label: id,
          sourceLabel: candidate.sourceLabel || candidateRecord.sourceLabel,
          commandSchema: candidate.commandSchema,
          actual: candidate.actual,
          recordPath: candidateRecord.path,
        });
      });
    } catch {
      // 单条候选解析失败不影响其他 CMD 的推荐排序。
    }

    return items;
  }, []);
  const candidateInputMap = new Map(candidateInputs.map(candidate => [candidate.id, candidate]));

  return rankCmdStructureCandidates(candidateInputs, expected, {
    ignoreExtraPaths,
    limit: 3,
  }).map(candidate => {
    const input = candidateInputMap.get(candidate.id);
    return {
      ...candidate,
      actual: input?.actual ?? {},
      recordPath: input?.recordPath ?? candidate.id,
    };
  });
};

export const formatCmdComparisonCandidateText = (
  candidates: RankedCmdComparisonCandidate[],
  activeCandidateId: string
): string => {
  if (candidates.length <= 1) return '';

  const bestCandidate = candidates[0];
  const lines = [
    'cmdHandler actual 候选推荐',
    bestCandidate.id === activeCandidateId
      ? '- 当前 actual 已是最匹配候选'
      : `- 可能拿错 actual，建议优先切到 ${bestCandidate.label}`,
  ];

  candidates.forEach((candidate, index) => {
    const schema = candidate.commandSchema ? ` · ${candidate.commandSchema}` : '';
    const current = candidate.id === activeCandidateId ? ' · 当前' : '';
    lines.push(`- #${index + 1} ${candidate.label}${schema}${current}: ${formatCmdCandidateSummary(candidate)}`);
  });

  return lines.join('\n');
};

export const toCmdComparisonCandidateInput = (
  candidate: RankedCmdComparisonCandidate
): CmdComparisonCandidateInput => ({
  id: candidate.id,
  label: candidate.label,
  sourceLabel: candidate.sourceLabel,
  commandSchema: candidate.commandSchema,
  actual: candidate.actual,
  recordPath: candidate.recordPath,
});

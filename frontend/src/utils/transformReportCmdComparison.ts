import { APP_VERSION_METADATA } from './appVersion';
import {
  diffCmdStructures,
  parseCmdStructureJson,
} from './cmdStructureDiff';
import { formatUnknownError } from './errors';
import {
  assertRecognizableCmdComparisonExpected,
} from './transformReportCmdComparisonHelpers';
import {
  getTransformRecordCmdStructureCopyText,
  type TransformReportRecord,
} from './transformSummary';
import {
  buildCmdComparisonCandidates,
  formatCmdComparisonCandidateText,
  toCmdComparisonCandidateInput,
} from './transformReportCmdComparisonCandidates';
import {
  buildCmdComparisonDiffSummary,
  formatCmdComparisonDiffReport,
} from './transformReportCmdComparisonSummary';
import type {
  CmdComparisonCandidateInput,
  CmdComparisonPanelState,
} from './transformReportCmdComparisonTypes';

export {
  buildCmdComparisonCandidates,
  formatCmdComparisonCandidateText,
  toCmdComparisonCandidateInput,
} from './transformReportCmdComparisonCandidates';

export type {
  CmdComparisonCandidateInput,
  CmdComparisonDiffSummary,
  CmdComparisonPanelState,
  RankedCmdComparisonCandidate,
} from './transformReportCmdComparisonTypes';

export const buildCmdComparisonReportText = (
  record: TransformReportRecord,
  expectedText: string,
  ignoreExtraPaths: boolean,
  actualCandidate?: CmdComparisonCandidateInput | null
): string => {
  const actualText = actualCandidate ? '' : getTransformRecordCmdStructureCopyText(record);
  if ((!actualCandidate && !actualText) || !expectedText.trim()) return '';

  const actual = actualCandidate?.actual || parseCmdStructureJson(actualText, '本工具 CMD 结构');
  const expected = parseCmdStructureJson(expectedText, 'cmdHandler 输出');
  assertRecognizableCmdComparisonExpected(expected);
  const diff = diffCmdStructures(actual, expected, { ignoreExtraPaths });

  return formatCmdComparisonDiffReport(diff, {
    path: actualCandidate?.id || record.path,
    sourceLabel: actualCandidate?.sourceLabel || record.sourceLabel,
    tool: APP_VERSION_METADATA,
    ignoreExtraPaths,
  });
};

export const buildCmdComparisonPanelState = (
  record: TransformReportRecord,
  candidateRecords: TransformReportRecord[],
  expectedText: string,
  ignoreExtraPaths: boolean,
  activeCandidate?: CmdComparisonCandidateInput | null
): CmdComparisonPanelState => {
  const trimmedExpectedText = expectedText.trim();
  if (!trimmedExpectedText) {
    return {
      diffReportText: '',
      diffSummary: null,
      errorText: '',
      candidateRecommendations: [],
    };
  }

  try {
    const actual = activeCandidate?.actual || parseCmdStructureJson(
      getTransformRecordCmdStructureCopyText(record),
      '本工具 CMD 结构'
    );
    const expected = parseCmdStructureJson(trimmedExpectedText, 'cmdHandler 输出');
    assertRecognizableCmdComparisonExpected(expected);
    const diff = diffCmdStructures(actual, expected, { ignoreExtraPaths });
    const diffReportText = formatCmdComparisonDiffReport(diff, {
      path: activeCandidate?.id || record.path,
      sourceLabel: activeCandidate?.sourceLabel || record.sourceLabel,
      tool: APP_VERSION_METADATA,
      ignoreExtraPaths,
    });

    return {
      diffReportText,
      diffSummary: buildCmdComparisonDiffSummary(diffReportText, diff),
      errorText: '',
      candidateRecommendations: buildCmdComparisonCandidates(
        candidateRecords,
        expected,
        ignoreExtraPaths,
        record
      ),
    };
  } catch (error) {
    return {
      diffReportText: '',
      diffSummary: null,
      errorText: formatUnknownError(error),
      candidateRecommendations: [],
    };
  }
};

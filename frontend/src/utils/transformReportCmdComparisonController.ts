import {
  toCmdComparisonCandidateInput,
  type CmdComparisonCandidateInput,
  type RankedCmdComparisonCandidate,
} from './transformReportCmdComparison';
import type { TransformReportRecord } from './transformSummary';

export interface TransformReportCmdComparisonState {
  recordPath: string | null;
  expectedText: string;
  ignoreExtraPaths: boolean;
  actualCandidate: CmdComparisonCandidateInput | null;
}

export interface TransformReportCmdComparisonOpenPlan {
  query: string;
  state: TransformReportCmdComparisonState;
}

export const createInitialTransformReportCmdComparisonState = (): TransformReportCmdComparisonState => ({
  recordPath: null,
  expectedText: '',
  ignoreExtraPaths: false,
  actualCandidate: null,
});

export const resetTransformReportCmdComparisonState = createInitialTransformReportCmdComparisonState;

const clearCmdComparisonSelection = (
  state: TransformReportCmdComparisonState,
  recordPath: string | null
): TransformReportCmdComparisonState => ({
  ...state,
  recordPath,
  expectedText: '',
  actualCandidate: null,
});

export const toggleTransformReportCmdComparisonRecord = (
  state: TransformReportCmdComparisonState,
  record: TransformReportRecord
): TransformReportCmdComparisonState => (
  clearCmdComparisonSelection(state, state.recordPath === record.path ? null : record.path)
);

export const buildOpenFirstTransformReportCmdComparisonPlan = (
  state: TransformReportCmdComparisonState,
  firstRecord: TransformReportRecord | null | undefined
): TransformReportCmdComparisonOpenPlan | null => {
  if (!firstRecord) return null;

  return {
    query: 'CMD结构',
    state: clearCmdComparisonSelection(state, firstRecord.path),
  };
};

export const switchTransformReportCmdComparisonCandidate = (
  state: TransformReportCmdComparisonState,
  candidate: RankedCmdComparisonCandidate
): TransformReportCmdComparisonOpenPlan => ({
  query: candidate.recordPath,
  state: {
    ...state,
    recordPath: candidate.recordPath,
    actualCandidate: candidate.id === candidate.recordPath
      ? null
      : toCmdComparisonCandidateInput(candidate),
  },
});

export const updateTransformReportCmdComparisonExpectedText = (
  state: TransformReportCmdComparisonState,
  expectedText: string
): TransformReportCmdComparisonState => ({ ...state, expectedText });

export const updateTransformReportCmdComparisonIgnoreExtraPaths = (
  state: TransformReportCmdComparisonState,
  ignoreExtraPaths: boolean
): TransformReportCmdComparisonState => ({ ...state, ignoreExtraPaths });

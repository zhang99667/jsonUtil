import {
  buildCmdComparisonPanelState,
  buildCmdComparisonReportText,
  formatCmdComparisonCandidateText,
  type CmdComparisonCandidateInput,
} from './transformReportCmdComparison';
import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from './transformSummary';

interface ActiveCmdComparisonSources {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  fullReportView: TransformReportView | null;
}

interface ActiveCmdComparisonState extends ActiveCmdComparisonSources {
  recordPath: string | null;
  expectedText: string;
  ignoreExtraPaths: boolean;
  actualCandidate: CmdComparisonCandidateInput | null;
}

export const findActiveCmdComparisonRecord = ({
  recordPath,
  report,
  reportView,
  fullReportView,
}: ActiveCmdComparisonSources & { recordPath: string | null }): TransformReportRecord | null => {
  if (!recordPath) return null;

  return reportView?.records.find(record => record.path === recordPath && record.hasCmdStructure) ||
    reportView?.cmdStructureRecords.find(record => record.path === recordPath) ||
    fullReportView?.records.find(record => record.path === recordPath && record.hasCmdStructure) ||
    fullReportView?.cmdStructureRecords.find(record => record.path === recordPath) ||
    report?.records.find(record => record.path === recordPath && record.hasCmdStructure) ||
    null;
};

export const getCmdComparisonCandidateRecords = ({
  report,
  reportView,
  fullReportView,
}: ActiveCmdComparisonSources): TransformReportRecord[] => (
  report?.records.filter(record => record.hasCmdStructure) ||
  fullReportView?.cmdStructureRecords ||
  reportView?.cmdStructureRecords ||
  []
);

export const buildActiveCmdComparisonReportText = (state: ActiveCmdComparisonState): string => {
  if (!state.expectedText.trim()) return '';

  const record = findActiveCmdComparisonRecord(state);
  if (!record) return '';

  return buildCmdComparisonReportText(record, state.expectedText, state.ignoreExtraPaths, state.actualCandidate);
};

export const buildActiveCmdComparisonCandidateText = (state: ActiveCmdComparisonState): string => {
  if (!state.recordPath || !state.expectedText.trim()) return '';

  const activeRecord = findActiveCmdComparisonRecord(state);
  if (!activeRecord) return '';

  const activeCandidateId = state.actualCandidate?.id || state.recordPath;
  const comparisonState = buildCmdComparisonPanelState(
    activeRecord,
    getCmdComparisonCandidateRecords(state),
    state.expectedText,
    state.ignoreExtraPaths,
    state.actualCandidate
  );
  return formatCmdComparisonCandidateText(comparisonState.candidateRecommendations, activeCandidateId);
};

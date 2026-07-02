import {
  buildCmdComparisonPanelState,
  buildCmdComparisonReportText,
  formatCmdComparisonCandidateText,
  type CmdComparisonCandidateInput,
} from './transformReportCmdComparison';
import type { TransformContextReport, TransformReportRecord, TransformReportView } from './transformSummary';

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

const resolveActiveCmdComparisonRecord = (state: ActiveCmdComparisonState): TransformReportRecord | null => (
  state.expectedText.trim() ? findActiveCmdComparisonRecord(state) : null
);

export const buildActiveCmdComparisonReportText = (state: ActiveCmdComparisonState): string => {
  const record = resolveActiveCmdComparisonRecord(state);
  return record
    ? buildCmdComparisonReportText(record, state.expectedText, state.ignoreExtraPaths, state.actualCandidate)
    : '';
};

export const buildActiveCmdComparisonCandidateText = (state: ActiveCmdComparisonState): string => {
  const activeRecord = resolveActiveCmdComparisonRecord(state);
  if (!activeRecord || !state.recordPath) return '';

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

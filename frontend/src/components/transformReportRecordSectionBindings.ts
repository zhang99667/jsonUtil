import type { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import type { TransformReportPanelCopyWorkflow } from '../utils/transformReportPanelCopyWorkflow';
import type { RankedCmdComparisonCandidate } from '../utils/transformReportCmdComparison';
import {
  buildOpenFirstTransformReportCmdComparisonPlan,
  switchTransformReportCmdComparisonCandidate,
  toggleTransformReportCmdComparisonRecord,
  updateTransformReportCmdComparisonExpectedText,
  updateTransformReportCmdComparisonIgnoreExtraPaths,
  type TransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import type { TransformReportRecord } from '../utils/transformSummary';
import type {
  TransformReportRecordActions,
  TransformReportRecordCmdComparisonState,
} from './TransformReportRecordSectionContracts';

interface TransformReportRecordSectionBindingsInput {
  copyWorkflow: TransformReportPanelCopyWorkflow;
  cmdComparisonState: TransformReportCmdComparisonState;
  setCmdComparisonState: Dispatch<SetStateAction<TransformReportCmdComparisonState>>;
  setQuery: Dispatch<SetStateAction<string>>;
  firstCmdStructureRecord?: TransformReportRecord | null;
  getCandidateRecords: () => TransformReportRecord[];
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

interface TransformReportRecordSectionBindings {
  openFirstCmdComparison: () => void;
  recordActions: TransformReportRecordActions;
  recordCmdComparison: TransformReportRecordCmdComparisonState;
}

export const buildTransformReportRecordSectionBindings = ({
  copyWorkflow,
  cmdComparisonState,
  setCmdComparisonState,
  setQuery,
  firstCmdStructureRecord,
  getCandidateRecords,
  onLocatePath,
  onOpenSchemeValue,
}: TransformReportRecordSectionBindingsInput): TransformReportRecordSectionBindings => {
  const toggleCmdComparison = (record: TransformReportRecord) => {
    setCmdComparisonState(currentState => toggleTransformReportCmdComparisonRecord(currentState, record));
  };
  const openFirstCmdComparison = () => {
    const plan = buildOpenFirstTransformReportCmdComparisonPlan(cmdComparisonState, firstCmdStructureRecord);
    if (!plan) return;

    setQuery(plan.query);
    setCmdComparisonState(plan.state);
  };
  const switchCmdComparisonCandidate = (candidate: RankedCmdComparisonCandidate) => {
    const plan = switchTransformReportCmdComparisonCandidate(cmdComparisonState, candidate);
    setQuery(plan.query);
    setCmdComparisonState(plan.state);
  };
  const locatePath = (path: string) => {
    if (!onLocatePath) return;

    onLocatePath(path);
    toast.success('已填入 JSONPath 查询', { duration: 1600 });
  };
  const openSchemeValue = (value: string) => {
    if (!onOpenSchemeValue) return;

    onOpenSchemeValue(value);
    toast.success('已填入 Scheme 解析', { duration: 1600 });
  };
  const recordActions = {
    onCopyPath: copyWorkflow.copyPath,
    onCopyOriginalValue: copyWorkflow.copyOriginalValue,
    onCopyDecodedPathValue: copyWorkflow.copyDecodedPathValue,
    onCopyCmdStructure: copyWorkflow.copyCmdStructure,
    onCopyCmdComparisonPackage: copyWorkflow.copyCmdComparisonPackage,
    onToggleCmdComparison: toggleCmdComparison,
    onCopyCmdComparisonDiff: copyWorkflow.copyCmdComparisonDiff,
    onSwitchCmdComparisonCandidate: switchCmdComparisonCandidate,
    onCmdComparisonExpectedTextChange: (expectedText: string) => setCmdComparisonState(currentState => (
      updateTransformReportCmdComparisonExpectedText(currentState, expectedText)
    )),
    onCmdComparisonIgnoreExtraPathsChange: (ignoreExtraPaths: boolean) => setCmdComparisonState(currentState => (
      updateTransformReportCmdComparisonIgnoreExtraPaths(currentState, ignoreExtraPaths)
    )),
    ...(onLocatePath ? { onLocatePath: locatePath } : {}),
    ...(onOpenSchemeValue ? { onOpenSchemeValue: openSchemeValue } : {}),
  } satisfies TransformReportRecordActions;

  return {
    openFirstCmdComparison,
    recordActions,
    recordCmdComparison: {
      recordPath: cmdComparisonState.recordPath,
      actualCandidate: cmdComparisonState.actualCandidate,
      expectedText: cmdComparisonState.expectedText,
      ignoreExtraPaths: cmdComparisonState.ignoreExtraPaths,
      getCandidateRecords,
    },
  };
};

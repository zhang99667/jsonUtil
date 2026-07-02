import type { TransformContext } from '../types';
import type { CmdComparisonCandidateInput } from './transformReportCmdComparison';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportView,
} from './transformSummary';

export interface TransformReportQualityBaseline {
  snapshot: TransformQualitySnapshot;
  filter: string;
}

export interface TransformReportPanelCopyWorkflowState {
  activeContext: TransformContext | null;
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  deferredQuery: string;
  isFilterPending: boolean;
  qualitySnapshot: TransformQualitySnapshot | null;
  qualityBaselineDeltaText: string;
  placeholderFillTemplateJsonText: string;
  issueSampleCopyText: string;
  issueSampleJsonCopyText: string;
  redactedIssueSampleJsonCopyText: string;
  issueRegressionTemplateCopyText: string;
  hasPathValueCopyItems: boolean;
  hasCmdStructureCopyItems: boolean;
  hasFocusedCmdStructureCopyItems: boolean;
  cmdComparisonExpectedText: string;
  cmdComparisonIgnoreExtraPaths: boolean;
  cmdComparisonActualCandidate: CmdComparisonCandidateInput | null;
}

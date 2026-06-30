import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import type { TransformReportSectionVisibility } from '../utils/transformReportSectionVisibility';
import type {
  CmdComparisonCandidateInput,
  RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
import type { TransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import type {
  TransformReportIssueTriageAction,
  TransformReportIssueTriageItem,
  TransformReportNextAction,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';

export interface TransformReportPanelSectionsProps {
  report: TransformContextReport;
  reportView: TransformReportView | null;
  query: string;
  issuePriorityCount: number;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  placeholderFillTemplateJsonText: string;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
  placeholderFillPanelTitle: string;
  nextActions: TransformReportNextActionItem[];
  issueTriageItems: TransformReportIssueTriageItem[];
  sectionVisibility: TransformReportSectionVisibility;
  placeholderToolbarState: TransformReportPlaceholderToolbarState | null;
  cmdComparisonRecordPath: string | null;
  cmdComparisonActualCandidate: CmdComparisonCandidateInput | null;
  cmdComparisonExpectedText: string;
  cmdComparisonIgnoreExtraPaths: boolean;
  getCmdComparisonCandidateRecords: () => TransformReportRecord[];
  onFilter: (query: string) => void;
  onOpenFirstCmdComparison: () => void;
  onOpenPlaceholderFillTemplate: () => void;
  onCopyPlaceholderFillTemplate: () => void | Promise<void>;
  onCopyPlaceholderReport: () => void | Promise<void>;
  onRunNextAction: (action: TransformReportNextAction) => void;
  onRunIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onCopyDecodedPathValue: (text: string) => void | Promise<void>;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
  onCopyCmdComparisonDiff: (record: TransformReportRecord) => void | Promise<void>;
  onSwitchCmdComparisonCandidate: (candidate: RankedCmdComparisonCandidate) => void;
  onCmdComparisonExpectedTextChange: (text: string) => void;
  onCmdComparisonIgnoreExtraPathsChange: (ignoreExtraPaths: boolean) => void;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

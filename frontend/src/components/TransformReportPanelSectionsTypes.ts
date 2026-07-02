import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import type { TransformReportSectionVisibility } from '../utils/transformReportSectionVisibility';
import type { TransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import type {
  TransformReportIssueTriageAction,
  TransformReportIssueTriageItem,
  TransformReportNextAction,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';
import type {
  TransformReportRecordActions,
  TransformReportRecordCmdComparisonState,
} from './TransformReportRecordSectionContracts';

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
  recordActions: TransformReportRecordActions;
  recordCmdComparison: TransformReportRecordCmdComparisonState;
  onFilter: (query: string) => void;
  onOpenFirstCmdComparison: () => void;
  onOpenPlaceholderFillTemplate: () => void;
  onCopyPlaceholderFillTemplate: () => void | Promise<void>;
  onCopyPlaceholderReport: () => void | Promise<void>;
  onRunNextAction: (action: TransformReportNextAction) => void;
  onRunIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
}

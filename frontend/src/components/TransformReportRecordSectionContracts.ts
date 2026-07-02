import type { TransformReportRecord } from '../utils/transformSummary';
import type {
  CmdComparisonCandidateInput,
  RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';

export interface TransformReportRecordPathActions {
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyDecodedPathValue: (text: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export interface TransformReportRecordActions extends TransformReportRecordPathActions {
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
  onCopyCmdComparisonDiff: (record: TransformReportRecord) => void | Promise<void>;
  onSwitchCmdComparisonCandidate: (candidate: RankedCmdComparisonCandidate) => void;
  onCmdComparisonExpectedTextChange: (text: string) => void;
  onCmdComparisonIgnoreExtraPathsChange: (ignoreExtraPaths: boolean) => void;
}

export interface TransformReportRecordCmdComparisonState {
  recordPath: string | null;
  actualCandidate: CmdComparisonCandidateInput | null;
  expectedText: string;
  ignoreExtraPaths: boolean;
  getCandidateRecords: () => TransformReportRecord[];
}

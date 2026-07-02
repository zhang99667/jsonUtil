import type {
  TransformReportRecord,
  TransformReportWarning,
  TransformReportUnresolvedCandidate,
} from './transformSummaryRecordTypes';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';

export interface TransformReportView {
  records: TransformReportRecord[];
  cmdStructureRecords: TransformReportRecord[];
  warnings: TransformReportWarning[];
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
  runtimePlaceholders: TransformReportRuntimePlaceholder[];
  filteredRecordCount: number;
  filteredWarningCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  filteredSchemeParamStageCount: number;
  filteredSchemeParamStageRepairHintCount: number;
  filteredNonReversibleParamStageCount: number;
  filteredCmdStructureCount: number;
  filteredNestedCommandFieldCount: number;
  filteredNestedResourceFieldCount: number;
  totalRecordCount: number;
  totalWarningCount: number;
  totalUnresolvedCount: number;
  totalPlaceholderCount: number;
  totalSchemeParamStageCount: number;
  totalSchemeParamStageRepairHintCount: number;
  totalNonReversibleParamStageCount: number;
  totalCmdStructureCount: number;
  totalNestedCommandFieldCount: number;
  totalNestedResourceFieldCount: number;
  isRecordTruncated: boolean;
  isCmdStructureTruncated: boolean;
  isWarningTruncated: boolean;
  isUnresolvedTruncated: boolean;
  isPlaceholderTruncated: boolean;
}

export interface TransformReportViewOptions {
  recordLimit?: number;
  warningLimit?: number;
  unresolvedLimit?: number;
  placeholderLimit?: number;
  cmdStructureLimit?: number;
}

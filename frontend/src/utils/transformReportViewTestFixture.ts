import type { TransformReportRecord, TransformReportView } from './transformSummary';

export const createTransformReportView = (
  overrides: Partial<TransformReportView> = {}
): TransformReportView => ({
  records: [],
  cmdStructureRecords: [],
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  filteredRecordCount: 0,
  filteredWarningCount: 0,
  filteredUnresolvedCount: 0,
  filteredPlaceholderCount: 0,
  filteredSchemeParamStageCount: 0,
  filteredSchemeParamStageRepairHintCount: 0,
  filteredNonReversibleParamStageCount: 0,
  filteredCmdStructureCount: 0,
  filteredNestedCommandFieldCount: 0,
  filteredNestedResourceFieldCount: 0,
  totalRecordCount: 0,
  totalWarningCount: 0,
  totalUnresolvedCount: 0,
  totalPlaceholderCount: 0,
  totalSchemeParamStageCount: 0,
  totalSchemeParamStageRepairHintCount: 0,
  totalNonReversibleParamStageCount: 0,
  totalCmdStructureCount: 0,
  totalNestedCommandFieldCount: 0,
  totalNestedResourceFieldCount: 0,
  isRecordTruncated: false,
  isCmdStructureTruncated: false,
  isWarningTruncated: false,
  isUnresolvedTruncated: false,
  isPlaceholderTruncated: false,
  ...overrides,
});

export const createTransformReportViewWithRecords = (
  records: TransformReportRecord[]
): TransformReportView => createTransformReportView({
  // 仅设置记录集合；计数/截断语义测试应显式覆盖对应字段。
  records,
  cmdStructureRecords: records.filter(record => record.hasCmdStructure),
});

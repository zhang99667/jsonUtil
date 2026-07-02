import { describe, expect, it } from 'vitest';
import {
  buildQualitySnapshotFiltered,
  buildQualitySnapshotTotals,
  buildQualitySnapshotTruncation,
} from './transformQualitySnapshotMetrics';
import { createTransformReportView } from './transformReportViewTestFixture';

const buildReportView = () => createTransformReportView({
  filteredRecordCount: 11,
  filteredWarningCount: 12,
  filteredUnresolvedCount: 13,
  filteredPlaceholderCount: 14,
  filteredSchemeParamStageCount: 15,
  filteredSchemeParamStageRepairHintCount: 16,
  filteredNonReversibleParamStageCount: 17,
  filteredCmdStructureCount: 18,
  filteredNestedCommandFieldCount: 19,
  filteredNestedResourceFieldCount: 20,
  totalRecordCount: 21,
  totalWarningCount: 22,
  totalUnresolvedCount: 23,
  totalPlaceholderCount: 24,
  totalSchemeParamStageCount: 25,
  totalSchemeParamStageRepairHintCount: 26,
  totalNonReversibleParamStageCount: 27,
  totalCmdStructureCount: 28,
  totalNestedCommandFieldCount: 29,
  totalNestedResourceFieldCount: 30,
  isRecordTruncated: true,
  isCmdStructureTruncated: false,
  isWarningTruncated: true,
  isUnresolvedTruncated: false,
  isPlaceholderTruncated: true,
});

describe('transformQualitySnapshotMetrics', () => {
  it('从报告视图映射全量指标', () => {
    expect(buildQualitySnapshotTotals(buildReportView())).toEqual({
      records: 21,
      cmdStructures: 28,
      nestedCommandFields: 29,
      nestedResourceFields: 30,
      runtimePlaceholders: 24,
      schemeParamStages: 25,
      schemeParamStageRepairHints: 26,
      nonReversibleParamStages: 27,
      unresolved: 23,
      warnings: 22,
    });
  });

  it('从报告视图映射筛选后指标', () => {
    expect(buildQualitySnapshotFiltered(buildReportView())).toEqual({
      records: 11,
      cmdStructures: 18,
      nestedCommandFields: 19,
      nestedResourceFields: 20,
      runtimePlaceholders: 14,
      schemeParamStages: 15,
      schemeParamStageRepairHints: 16,
      nonReversibleParamStages: 17,
      unresolved: 13,
      warnings: 12,
    });
  });

  it('从报告视图映射截断状态', () => {
    expect(buildQualitySnapshotTruncation(buildReportView())).toEqual({
      records: true,
      cmdStructures: false,
      runtimePlaceholders: true,
      unresolved: false,
      warnings: true,
    });
  });
});

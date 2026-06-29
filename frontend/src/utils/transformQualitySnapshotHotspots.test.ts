import { describe, expect, it } from 'vitest';
import type {
  TransformContextReport,
  TransformReportView,
  TransformReportWarning,
  TransformReportUnresolvedCandidate,
} from './transformSummary';
import { buildQualitySnapshotHotspots } from './transformQualitySnapshotHotspots';

const buildUnresolvedCandidate = (
  path: string,
  reasonLabel: string
): TransformReportUnresolvedCandidate => ({
  path,
  sourceLabel: 'scheme',
  originalValue: 'redacted',
  message: reasonLabel,
  length: 8,
  preview: 'redacted',
  reasonLabel,
  reasonLevel: 'warning',
  nextAction: '检查规则',
});

const buildWarning = (
  path: string,
  reasonLabel: string
): TransformReportWarning => ({
  type: 'string_decode_skipped',
  path,
  sourceLabel: 'scheme',
  originalValue: 'redacted',
  message: reasonLabel,
  length: 100,
  limit: 20,
  reasonLabel,
  nextAction: '缩短样本',
});

const buildReport = (): TransformContextReport => ({
  summary: {} as TransformContextReport['summary'],
  coverage: {} as TransformContextReport['coverage'],
  cmdStructureCount: 0,
  nestedCommandFieldCount: 0,
  records: [],
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  topCommandSchemas: Array.from({ length: 9 }, (_, index) => ({
    schema: `schema-${index}`,
    count: 10 - index,
    recordCount: 1,
    paths: [`$.schema${index}`],
    hasMorePaths: false,
  })),
});

const buildReportView = (): TransformReportView => ({
  records: [{
    path: '$.scheme',
    schemeParamStageSummary: {
      total: 1,
      repairHints: 1,
      nonReversible: 0,
      sources: [{ key: 'query', count: 1 }],
      keys: [{ key: 'params', count: 1 }],
      repairHintLabels: [{ key: 'Loose JSON 已补齐字段引号/单引号/尾逗号', count: 1 }],
      samples: [],
    },
  } as TransformReportView['records'][number]],
  cmdStructureRecords: [],
  warnings: [
    buildWarning('$.warningA', '长度保护'),
    buildWarning('$.warningB', '长度保护'),
  ],
  unresolvedCandidates: [
    buildUnresolvedCandidate('$.unresolved', '已解码但未结构化'),
  ],
  runtimePlaceholderGroups: [{
    value: '__UID__',
    description: '用户 ID',
    count: 3,
    sourceCount: 5,
    sources: Array.from({ length: 5 }, (_, index) => ({
      sourcePath: `$.placeholder${index}`,
      sourceLabel: 'scheme',
      count: 1,
    })),
  }],
  runtimePlaceholders: [],
  filteredRecordCount: 1,
  filteredWarningCount: 2,
  filteredUnresolvedCount: 1,
  filteredPlaceholderCount: 3,
  filteredSchemeParamStageCount: 1,
  filteredSchemeParamStageRepairHintCount: 1,
  filteredNonReversibleParamStageCount: 0,
  filteredCmdStructureCount: 0,
  filteredNestedCommandFieldCount: 0,
  filteredNestedResourceFieldCount: 0,
  totalRecordCount: 1,
  totalWarningCount: 2,
  totalUnresolvedCount: 1,
  totalPlaceholderCount: 3,
  totalSchemeParamStageCount: 1,
  totalSchemeParamStageRepairHintCount: 1,
  totalNonReversibleParamStageCount: 0,
  totalCmdStructureCount: 0,
  totalNestedCommandFieldCount: 0,
  totalNestedResourceFieldCount: 0,
  isRecordTruncated: false,
  isCmdStructureTruncated: false,
  isWarningTruncated: false,
  isUnresolvedTruncated: false,
  isPlaceholderTruncated: false,
});

describe('transformQualitySnapshotHotspots', () => {
  it('聚合质量快照热点并限制 Top 数量与路径数量', () => {
    const hotspots = buildQualitySnapshotHotspots(buildReport(), buildReportView());

    expect(hotspots.topCommandSchemas).toHaveLength(8);
    expect(hotspots.topCommandSchemas[0].schema).toBe('schema-0');
    expect(hotspots.unresolvedReasons).toEqual([
      { key: '已解码但未结构化', count: 1, paths: ['$.unresolved'] },
    ]);
    expect(hotspots.warningReasons).toEqual([
      { key: '长度保护', count: 2, paths: ['$.warningA', '$.warningB'] },
    ]);
    expect(hotspots.warningTypes).toEqual([
      { key: 'string_decode_skipped', count: 2, paths: ['$.warningA', '$.warningB'] },
    ]);
    expect(hotspots.runtimePlaceholders).toEqual([{
      key: '__UID__',
      count: 3,
      paths: ['$.placeholder0', '$.placeholder1', '$.placeholder2', '$.placeholder3'],
    }]);
    expect(hotspots.schemeParamStageSources).toEqual([
      { key: 'query', count: 1, paths: ['$.scheme'] },
    ]);
    expect(hotspots.schemeParamStageKeys).toEqual([
      { key: 'params', count: 1, paths: ['$.scheme'] },
    ]);
    expect(hotspots.schemeParamStageRepairHints).toEqual([
      { key: 'Loose JSON 已补齐字段引号/单引号/尾逗号', count: 1, paths: ['$.scheme'] },
    ]);
  });
});

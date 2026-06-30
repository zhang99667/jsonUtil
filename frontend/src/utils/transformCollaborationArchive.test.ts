import { describe, expect, it } from 'vitest';
import { APP_VERSION_METADATA } from './appVersion';
import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from './transformSummary';
import { buildTransformArchivePackage } from './transformArchivePackage';
import { formatTransformCollaborationReportText } from './transformCollaborationReport';

const createRecord = (
  overrides: Partial<TransformReportRecord> = {}
): TransformReportRecord => ({
  path: '$.action_cmd',
  commandSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
  labels: ['CMD 参数 · 可回写'],
  insights: [],
  originalValue: '',
  originalPreview: '',
  decodedPaths: [],
  decodedPathCount: 0,
  isDecodedPathCountTruncated: false,
  indexedDecodedPathCount: 0,
  hasMoreDecodedPaths: false,
  nestedCommandFields: [],
  indexedNestedCommandFieldCount: 0,
  hasMoreNestedCommandFields: false,
  hasCmdStructure: true,
  nestedCommandFieldCount: 0,
  nestedExtFieldCount: 0,
  nestedBase64SuffixFieldCount: 0,
  stepCount: 1,
  hasNonReversibleScheme: false,
  ...overrides,
});

const createView = (
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

const createReport = (
  overrides: Partial<TransformContextReport> = {}
): TransformContextReport => ({
  summary: {} as TransformContextReport['summary'],
  summaryText: '深度解析: 展开 1 处',
  coverage: {
    score: 100,
    label: '解析覆盖 100%',
    level: 'success',
    description: '本次未发现待检查线索。',
    items: [],
  },
  cmdStructureCount: 0,
  nestedCommandFieldCount: 0,
  records: [],
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  ...overrides,
});

describe('transformCollaborationArchive', () => {
  it('协作报告在未粘贴 cmdHandler 时列出可对齐 CMD 结构', () => {
    const record = createRecord();
    const reportText = formatTransformCollaborationReportText(createReport({
      records: [record],
      cmdStructureCount: 1,
    }), createView({
      records: [record],
      cmdStructureRecords: [record],
      filteredRecordCount: 1,
      totalRecordCount: 1,
      filteredCmdStructureCount: 1,
      totalCmdStructureCount: 1,
    }), ' action ');

    expect(reportText).toContain('深度解析协作排查报告');
    expect(reportText).toContain('筛选: action');
    expect(reportText).toContain('三、cmdHandler 对齐');
    expect(reportText).toContain('待对比: 当前筛选有 1/1 条可复制 CMD 结构');
    expect(reportText).toContain('$.action_cmd: baiduboxapp://v7/vendor/ad/deeplink');
  });

  it('归档包组装安全清单、协作报告和推荐文件名', () => {
    const archivePackage = buildTransformArchivePackage(createReport(), createView(), '', {
      sampleName: 'reward-response',
      cmdComparisonReportText: 'CMD 结构差异报告',
      cmdComparisonCandidateText: 'actual 候选',
    });

    expect(archivePackage).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-transform-archive-package',
      tool: APP_VERSION_METADATA,
      filter: '全部',
      safety: {
        containsRawResponse: false,
        issueSampleOriginalValues: 'omitted-or-redacted',
        placeholderSourcePreviews: false,
        cmdComparisonMayContainValues: true,
      },
      corpusCandidate: {
        recommendedFiles: [
          'reward-response.redacted.json',
          'reward-response.expected.snapshot.json',
          'reward-response.cmdhandler.expected.json',
        ],
      },
    });
    expect(archivePackage.artifacts.diagnosticSummaryText).toContain('深度解析诊断摘要');
    expect(archivePackage.artifacts.collaborationReportText).toContain('CMD 结构差异报告');
    expect(archivePackage.artifacts.cmdComparisonCandidateText).toBe('actual 候选');
    expect(archivePackage.suggestedCommands.map(command => command.id)).toEqual([
      'issue-samples-to-regression-file',
      'corpus-snapshot-check',
    ]);
  });
});

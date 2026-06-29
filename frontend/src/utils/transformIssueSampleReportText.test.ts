import { describe, expect, it } from 'vitest';
import { formatTransformIssueSampleReportText } from './transformIssueSampleReportText';
import type { TransformReportView } from './transformSummary';

const buildReportView = (
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
  filteredCmdStructureCount: 0,
  filteredNestedCommandFieldCount: 0,
  filteredNestedResourceFieldCount: 0,
  filteredSchemeParamStageCount: 0,
  filteredSchemeParamStageRepairHintCount: 0,
  filteredNonReversibleParamStageCount: 0,
  totalRecordCount: 0,
  totalWarningCount: 0,
  totalUnresolvedCount: 0,
  totalPlaceholderCount: 0,
  totalCmdStructureCount: 0,
  totalNestedCommandFieldCount: 0,
  totalNestedResourceFieldCount: 0,
  totalSchemeParamStageCount: 0,
  totalSchemeParamStageRepairHintCount: 0,
  totalNonReversibleParamStageCount: 0,
  isRecordTruncated: false,
  isWarningTruncated: false,
  isUnresolvedTruncated: false,
  isPlaceholderTruncated: false,
  isCmdStructureTruncated: false,
  ...overrides,
});

describe('transformIssueSampleReportText', () => {
  it('没有问题样本时返回空文本', () => {
    expect(formatTransformIssueSampleReportText(buildReportView())).toBe('');
  });

  it('格式化未展开、占位符和跳过样本', () => {
    const text = formatTransformIssueSampleReportText(buildReportView({
      filteredUnresolvedCount: 2,
      totalUnresolvedCount: 3,
      filteredPlaceholderCount: 1,
      totalPlaceholderCount: 2,
      filteredWarningCount: 2,
      totalWarningCount: 3,
      isUnresolvedTruncated: true,
      isWarningTruncated: true,
      unresolvedCandidates: [{
        path: '$.tracking',
        sourceLabel: 'trackingParam',
        originalValue: 'raw=%7B%22nid%22%3A123%7D',
        message: 'URL 编码内容已解码',
        length: 31,
        preview: 'raw={"nid":123}',
        detectedType: 'url-encoded',
        reasonLabel: '已解码但未结构化',
        reasonLevel: 'info',
        nextAction: '把原始值加入 CMD 解析样本。',
      }],
      runtimePlaceholders: [{
        path: '$.button.cmd',
        sourcePath: '$.button',
        sourceLabel: 'buttonParam',
        sourceOriginalValue: 'button_cmd=__CONVERT_CMD__',
        sourceOriginalPreview: 'button_cmd=__CONVERT_CMD__',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符',
      }],
      warnings: [{
        type: 'string_decode_skipped',
        path: '$.huge',
        sourceLabel: 'hugeParam',
        originalValue: 'cmd=' + 'x'.repeat(40),
        message: '字符串过长',
        length: 44,
        limit: 20,
        reasonLabel: '单字段长度保护',
        nextAction: '单独粘贴到 Scheme 面板。',
      }],
    }), 'trackingParam');

    expect(text).toContain('筛选: trackingParam');
    expect(text).toContain('待检查 2/3，跳过 2/3，占位符 1/2');
    expect(text).toContain('$.tracking · url-encoded');
    expect(text).toContain('业务字段: trackingParam');
    expect(text).toContain('- 还有 1 条未展开线索未复制');
    expect(text).toContain('$.button.cmd: __CONVERT_CMD__');
    expect(text).toContain('来源: $.button');
    expect(text).toContain('$.huge: 单字段长度保护');
    expect(text).toContain('- 还有 1 条跳过记录未复制');
  });
});

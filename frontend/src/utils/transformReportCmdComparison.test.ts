import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import {
  buildCmdComparisonCandidates,
  buildCmdComparisonPanelState,
  buildCmdComparisonReportText,
  formatCmdComparisonCandidateText,
  toCmdComparisonCandidateInput,
} from './transformReportCmdComparison';
import type { TransformReportRecord } from './transformSummary';

const createCmdRecord = (
  path: string,
  cmdParams: JsonValue,
  overrides: Partial<TransformReportRecord> = {}
): TransformReportRecord => ({
  path,
  sourceLabel: 'scheme',
  commandSchema: 'baiduboxapp://v1/open',
  hasCmdStructure: true,
  cmdStructureCopyText: JSON.stringify({
    result: {
      cmdSchema: 'baiduboxapp://v1/open',
      source: 'baiduboxapp://v1/open',
      cmdParams,
    },
  }),
  ...overrides,
} as TransformReportRecord);

const expectedText = JSON.stringify({
  result: {
    cmdSchema: 'baiduboxapp://v1/open',
    source: 'baiduboxapp://v1/open',
    cmdParams: {
      id: 2,
      nested: {
        ok: true,
      },
    },
  },
});

describe('transformReportCmdComparison', () => {
  it('生成 CMD 差异报告并带上路径和工具上下文', () => {
    const record = createCmdRecord('$.actual', { id: 1 });
    const reportText = buildCmdComparisonReportText(record, expectedText, false);

    expect(reportText).toContain('CMD 结构差异报告');
    expect(reportText).toContain('对比路径: $.actual');
    expect(reportText).toContain('业务字段: scheme');
    expect(reportText).toContain('值不一致');
  });

  it('按 diff 结果推荐更匹配的 actual 候选并格式化说明', () => {
    const currentRecord = createCmdRecord('$.current', { id: 1 });
    const betterRecord = createCmdRecord('$.better', {
      id: 2,
      nested: {
        ok: true,
      },
    });
    const expected = JSON.parse(expectedText) as JsonValue;

    const candidates = buildCmdComparisonCandidates([currentRecord, betterRecord], expected, false, currentRecord);
    expect(candidates[0]).toMatchObject({
      id: '$.better',
      recordPath: '$.better',
      isExactMatch: true,
    });

    const candidateText = formatCmdComparisonCandidateText(candidates, '$.current');
    expect(candidateText).toContain('建议优先切到 $.better');
    expect(candidateText).toContain('#1 $.better');

    expect(toCmdComparisonCandidateInput(candidates[0])).toMatchObject({
      id: '$.better',
      recordPath: '$.better',
      actual: expect.any(Object),
    });
  });

  it('构建面板状态，包含摘要、候选和错误降级', () => {
    const currentRecord = createCmdRecord('$.current', { id: 1 });
    const betterRecord = createCmdRecord('$.better', {
      id: 2,
      nested: {
        ok: true,
      },
    });

    const state = buildCmdComparisonPanelState(
      currentRecord,
      [currentRecord, betterRecord],
      expectedText,
      false
    );
    expect(state.errorText).toBe('');
    expect(state.diffSummary).toMatchObject({
      hasDifferences: true,
      valueDiffCount: 1,
    });
    expect(state.diffSummary?.previewLines.length).toBeGreaterThan(0);
    expect(state.candidateRecommendations[0].id).toBe('$.better');

    const invalidState = buildCmdComparisonPanelState(currentRecord, [currentRecord], '{bad', false);
    expect(invalidState.diffReportText).toBe('');
    expect(invalidState.candidateRecommendations).toEqual([]);
    expect(invalidState.errorText).toContain('cmdHandler 输出不是有效 JSON');
  });
});

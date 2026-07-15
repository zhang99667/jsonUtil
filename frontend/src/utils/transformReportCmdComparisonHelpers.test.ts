import { describe, expect, it } from 'vitest';
import { diffCmdStructures } from './cmdStructureDiff';
import {
  assertRecognizableCmdComparisonExpected,
  formatCmdCandidateSummary,
  formatCmdPathCountSummary,
  rebaseCmdStructureCandidatePath,
} from './transformReportCmdComparisonHelpers';

describe('transformReportCmdComparisonHelpers', () => {
  it('校验 cmdHandler expected 是否可识别', () => {
    expect(() => assertRecognizableCmdComparisonExpected({
      result: {
        cmdSchema: 'sampleapp://v1/open',
        cmdParams: {},
      },
    })).not.toThrow();
    expect(() => assertRecognizableCmdComparisonExpected({ foo: 'bar' })).toThrow('cmdHandler 输出未识别到 CMD 结构');
  });

  it('格式化路径数量和候选 diff 摘要', () => {
    expect(formatCmdPathCountSummary('额外', [
      '$.a',
      '$.a.b',
      '$.c',
    ])).toBe('额外分支 2');

    const diff = diffCmdStructures(
      { result: { cmdSchema: 'a://open', cmdParams: { stable: 1, extra: 2 } } },
      { result: { cmdSchema: 'b://open', cmdParams: { stable: 2, missing: 3 } } }
    );
    expect(formatCmdCandidateSummary({
      id: 'candidate',
      label: '候选',
      diff,
      score: 0,
      isExactMatch: false,
    })).toContain('Schema 1');
  });

  it('重映射 cmdHandler 候选路径到当前记录路径', () => {
    expect(rebaseCmdStructureCandidatePath('$.scheme', '$')).toBe('$.scheme');
    expect(rebaseCmdStructureCandidatePath('$.scheme', '$.result.cmdParams.a')).toBe('$.scheme.cmdParams.a');
    expect(rebaseCmdStructureCandidatePath('$.scheme', '$.cmdParams.a')).toBe('$.scheme.cmdParams.a');
    expect(rebaseCmdStructureCandidatePath('$.scheme', '$.result.cmdSchema')).toBe('$.scheme.cmdSchema');
    expect(rebaseCmdStructureCandidatePath('$.scheme', 'plain')).toBe('$.scheme.plain');
  });
});

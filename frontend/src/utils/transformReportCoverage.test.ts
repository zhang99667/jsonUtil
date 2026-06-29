import { describe, expect, it } from 'vitest';
import { buildTransformReportCoverage } from './transformReportCoverage';

const buildSummary = (
  overrides: Partial<Parameters<typeof buildTransformReportCoverage>[0]> = {}
): Parameters<typeof buildTransformReportCoverage>[0] => ({
  recordCount: 2,
  unresolvedCount: 0,
  warningCount: 0,
  placeholderCount: 0,
  ...overrides,
});

describe('transformReportCoverage', () => {
  it('有性能保护跳过时输出 warning 覆盖率', () => {
    expect(buildTransformReportCoverage(buildSummary({
      recordCount: 3,
      warningCount: 1,
    }))).toMatchObject({
      score: 75,
      label: '解析覆盖 75%',
      level: 'warning',
      description: '有 1 条内容被性能保护跳过，真实 response 可能仍有未展开字段。',
    });
  });

  it('有未展开线索且无跳过时输出 info 覆盖率', () => {
    const coverage = buildTransformReportCoverage(buildSummary({
      recordCount: 3,
      unresolvedCount: 2,
    }));

    expect(coverage).toMatchObject({
      score: 60,
      label: '解析覆盖 60%',
      level: 'info',
    });
    expect(coverage.items).toContain('如果字段应继续拆解，可保留原始值补充解析样本');
  });

  it('只有运行时占位符时强调占位符不是解析失败', () => {
    expect(buildTransformReportCoverage(buildSummary({
      recordCount: 0,
      placeholderCount: 2,
    }))).toMatchObject({
      score: 100,
      label: '运行时占位符 2',
      level: 'info',
    });
  });

  it('没有风险线索时输出 success 覆盖率', () => {
    expect(buildTransformReportCoverage(buildSummary({
      recordCount: 0,
    }))).toEqual({
      score: 100,
      label: '解析覆盖 100%',
      level: 'success',
      description: '本次没有需要展开的嵌套字符串。',
      items: [],
    });
  });
});

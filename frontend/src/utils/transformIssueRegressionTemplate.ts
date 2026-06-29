import {
  collectIssueSampleSensitiveHints,
  formatIssueSampleSensitiveHint,
} from './issueSampleRedaction';
import { buildTransformIssueSampleExport } from './transformIssueSamples';
import type {
  TransformIssueSampleJsonOptions,
  TransformReportView,
} from './transformSummary';

export const formatTransformIssueRegressionTemplateText = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = { redactSensitiveValues: true }
): string => {
  const rawSampleExport = buildTransformIssueSampleExport(reportView, { filter: options.filter });
  if (!rawSampleExport) return '';

  const sampleExport = options.redactSensitiveValues
    ? buildTransformIssueSampleExport(reportView, options)
    : rawSampleExport;
  if (!sampleExport || sampleExport.samples.length === 0) return '';

  const sensitiveHints = collectIssueSampleSensitiveHints(rawSampleExport.samples);
  const hasRedactedValues = sampleExport.samples.some(sample => sample.redactionHint);
  const sensitiveHintText = sensitiveHints
    .slice(0, 5)
    .map(formatIssueSampleSensitiveHint)
    .join('；');
  const sensitiveHintLines = sensitiveHints.length > 0
    ? (hasRedactedValues
        ? [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 已脱敏命中的 originalValue，当前命中: ${sensitiveHintText}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '// 补断言前请用脱敏后的等价样本还原结构。',
            '',
          ]
        : [
            '// 注意: 检测到样本可能包含 token/sign/cookie/设备标识等敏感字段。',
            `// 提交前请先脱敏 originalValue，当前命中: ${sensitiveHintText}${sensitiveHints.length > 5 ? '；...' : ''}`,
            '',
          ])
    : [];

  return [
    "import { describe, expect, it } from 'vitest';",
    "import { deepParseWithContext } from './transformations';",
    '',
    '// 由深度解析报告「复制回归模板」生成；先跑 smoke，再把 it.todo 改成 it 补充解析断言。',
    `// 工具版本: ${sampleExport.tool.versionLabel}`,
    `// 筛选: ${sampleExport.filter}`,
    ...sensitiveHintLines,
    `const issueSamples = ${JSON.stringify(sampleExport.samples, null, 2)} as const;`,
    '',
    'const getOriginalValue = (sample: (typeof issueSamples)[number]): string | undefined => (',
    "  'originalValue' in sample && typeof sample.originalValue === 'string'",
    '    ? sample.originalValue',
    '    : undefined',
    ');',
    '',
    "describe('深度解析问题样本回归', () => {",
    "  it('样本原始值可被深度解析入口安全处理', () => {",
    '    expect(issueSamples.length).toBeGreaterThan(0);',
    '    issueSamples.forEach(sample => {',
    "      expect(sample.path).toMatch(/^\\$/);",
    '      const originalValue = getOriginalValue(sample);',
    '      if (!originalValue) return;',
    "      expect(() => deepParseWithContext(originalValue, { autoExpandScheme: true })).not.toThrow();",
    '    });',
    '  });',
    '',
    '  issueSamples.forEach(sample => {',
    '    it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);',
    '  });',
    '});',
    '',
  ].join('\n');
};

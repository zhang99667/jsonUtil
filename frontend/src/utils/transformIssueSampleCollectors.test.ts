import { describe, expect, it } from 'vitest';
import {
  buildTransformIssueSampleSummary,
  collectRuntimePlaceholderIssueSamples,
  collectTransformIssueSamples,
} from './transformIssueSampleCollectors';
import { createIssueSampleReportView } from './transformIssueSampleCollectorsTestFixture';

describe('transformIssueSampleCollectors', () => {
  it('只收集带原始值的运行时占位符样本', () => {
    const samples = collectRuntimePlaceholderIssueSamples(createIssueSampleReportView({
      runtimePlaceholders: [
        {
          path: '$.a',
          sourcePath: '$.source.a',
          sourceLabel: 'extra',
          sourceOriginalValue: 'token={{uid}}',
          value: '{{uid}}',
          description: '用户 ID 占位符',
        },
        {
          path: '$.b',
          sourcePath: '$.source.b',
          value: '{{empty}}',
          description: '无原始值',
        },
      ],
    }));

    expect(samples).toEqual([{
      type: 'runtime_placeholder',
      path: '$.a',
      sourcePath: '$.source.a',
      sourceLabel: 'extra',
      originalValue: 'token={{uid}}',
      reasonLabel: '运行时占位符',
      message: '用户 ID 占位符',
      value: '{{uid}}',
    }]);
  });

  it('按 unresolved、runtime placeholder、warning 顺序收集样本', () => {
    const samples = collectTransformIssueSamples(createIssueSampleReportView({
      unresolvedCandidates: [{
        path: '$.url',
        sourceLabel: 'url',
        originalValue: 'https://example.com',
        message: '未解析',
        length: 19,
        preview: 'https://example.com',
        detectedType: 'url',
        reasonLabel: '疑似 URL',
        reasonLevel: 'warning',
        nextAction: '检查编码',
      }],
      runtimePlaceholders: [{
        path: '$.tpl',
        sourcePath: '$.source.tpl',
        sourceOriginalValue: 'id={{id}}',
        value: '{{id}}',
        description: '占位符',
      }],
      warnings: [{
        type: 'string_decode_budget_exceeded',
        path: '$.big',
        originalValue: 'x'.repeat(10),
        message: '过长',
        length: 10,
        limit: 5,
        reasonLabel: '长度超限',
        nextAction: '缩短样本',
      }],
    }));

    expect(samples.map(sample => sample.type)).toEqual(['unresolved', 'runtime_placeholder', 'warning']);
    expect(samples[0]).toMatchObject({ path: '$.url', detectedType: 'url', reasonLevel: 'warning' });
    expect(samples[1]).toMatchObject({ path: '$.tpl', sourcePath: '$.source.tpl' });
    expect(samples[2]).toMatchObject({ path: '$.big', warningType: 'string_decode_budget_exceeded', limit: 5 });
  });

  it('根据视图计数构建样本导出摘要', () => {
    const summary = buildTransformIssueSampleSummary(createIssueSampleReportView({
      unresolvedCandidates: [{ path: '$.x', originalValue: '1', message: 'x', length: 1, preview: '1', reasonLabel: '未解析', reasonLevel: 'info', nextAction: '检查' }],
      warnings: [{ type: 'string_decode_skipped', path: '$.w', originalValue: 'w', message: '跳过', length: 1, limit: 10, reasonLabel: '跳过', nextAction: '忽略' }],
      filteredUnresolvedCount: 2,
      totalUnresolvedCount: 5,
      isUnresolvedTruncated: true,
      filteredPlaceholderCount: 3,
      totalPlaceholderCount: 7,
      isPlaceholderTruncated: true,
      filteredWarningCount: 4,
      totalWarningCount: 9,
      isWarningTruncated: true,
    }), 6);

    expect(summary).toEqual({
      unresolved: { copied: 1, filtered: 2, total: 5, truncated: true },
      runtimePlaceholders: { copied: 6, filtered: 3, total: 7, truncated: true },
      warnings: { copied: 1, filtered: 4, total: 9, truncated: true },
    });
  });
});

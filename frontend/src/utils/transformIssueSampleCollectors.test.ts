import { describe, expect, it } from 'vitest';
import {
  collectRuntimePlaceholderIssueSamples,
  collectTransformIssueSamples,
} from './transformIssueSampleCollectors';
import { createTransformReportView } from './transformReportViewTestFixture';

describe('transformIssueSampleCollectors', () => {
  it('只收集带原始值的运行时占位符样本', () => {
    const samples = collectRuntimePlaceholderIssueSamples(createTransformReportView({
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
    const samples = collectTransformIssueSamples(createTransformReportView({
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

});

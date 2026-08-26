import { describe, expect, it } from 'vitest';

import type { TransformContext } from '../types.ts';
import { createContextCollectors } from './transformContextCollectors.ts';

const createContext = (): TransformContext => ({
  mode: 'DEEP_FORMAT' as TransformContext['mode'],
  records: new Map(),
  timestamp: 0,
  originalIndentation: 0,
});

describe('createContextCollectors', () => {
  it('待检查候选保留原始值并生成有界预览', () => {
    const context = createContext();
    const collectors = createContextCollectors({ context });
    const value = 'x'.repeat(121);

    collectors.addUnresolvedCandidate('$.value', value, 'url-encoded', '解析失败', '业务来源');

    expect(context.unresolvedCandidates).toEqual([{
      path: '$.value',
      sourceLabel: '业务来源',
      originalValue: value,
      message: '解析失败',
      length: 121,
      preview: `${'x'.repeat(120)}...`,
      detectedType: 'url-encoded',
    }]);
  });

  it('占位符去重、绑定来源路径并限制数量', () => {
    const context = createContext();
    const collectors = createContextCollectors({ context });

    for (let index = 0; index < 101; index += 1) {
      collectors.addSchemeRuntimePlaceholders('$', [{
        path: `$.placeholder${index}`,
        value: `value-${index}`,
        description: '运行时替换',
      }], undefined, 'original');
    }

    expect(context.runtimePlaceholders).toHaveLength(100);
    expect(context.runtimePlaceholders?.[0]).toEqual({
      path: '$.placeholder0',
      sourcePath: '$',
      sourceLabel: undefined,
      sourceOriginalValue: 'original',
      value: 'value-0',
      description: '运行时替换',
    });

    collectors.addSchemeRuntimePlaceholders('$', [{
      path: '$.placeholder99',
      value: 'value-99',
      description: '运行时替换',
    }]);
    expect(context.runtimePlaceholders).toHaveLength(100);
  });

  it('字符串解码预算警告写入完整上下文字段', () => {
    const context = createContext();
    const collectors = createContextCollectors({ context });

    collectors.addStringDecodeWarning(
      'string_decode_budget_exceeded',
      '$.large',
      'payload',
      '预算用尽',
      1500,
      'HAR'
    );

    expect(context.warnings).toEqual([{
      type: 'string_decode_budget_exceeded',
      path: '$.large',
      sourceLabel: 'HAR',
      originalValue: 'payload',
      message: '预算用尽',
      length: 7,
      limit: 1500,
    }]);
  });
});

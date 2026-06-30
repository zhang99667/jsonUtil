import { describe, expect, it } from 'vitest';
import { compareCmdStructureValues } from './cmdStructureValueDiff';

describe('cmdStructureValueDiff', () => {
  it('展开对象和数组路径并保留需要转义的 key', () => {
    const diff = compareCmdStructureValues(
      {
        params: {
          list: ['a', 'b'],
          'a.b': 1,
        },
      },
      {
        params: {
          list: ['a', 'c'],
          'a.b': 2,
          missing: true,
        },
      }
    );

    expect(diff.valueDiffs).toEqual([
      { path: '$.params.list[1]', actual: 'b', expected: 'c' },
      { path: '$.params["a.b"]', actual: 1, expected: 2 },
    ]);
    expect(diff.missingPaths).toEqual(['$.params.missing']);
    expect(diff.extraPaths).toEqual([]);
  });

  it('允许字符串值与结构化 source 等价', () => {
    const source = 'https://example.com/landing?sku=101';
    const diff = compareCmdStructureValues(
      { url: source },
      {
        url: {
          cmdSchema: 'https://example.com/landing',
          cmdParams: { sku: '101' },
          source,
        },
      }
    );

    expect(diff.valueDiffs).toEqual([]);
    expect(diff.missingPaths).toEqual([
      '$.url.cmdSchema',
      '$.url.cmdParams',
      '$.url.cmdParams.sku',
      '$.url.source',
    ]);
  });

  it('类型不同且 source 不等价时记录值差异', () => {
    const diff = compareCmdStructureValues(
      { url: 'https://example.com/landing?sku=101' },
      {
        url: {
          cmdSchema: 'https://example.com/landing',
          source: 'https://example.com/landing?sku=202',
        },
      }
    );

    expect(diff.valueDiffs).toEqual([{
      path: '$.url',
      actual: 'https://example.com/landing?sku=101',
      expected: {
        cmdSchema: 'https://example.com/landing',
        source: 'https://example.com/landing?sku=202',
      },
    }]);
  });
});

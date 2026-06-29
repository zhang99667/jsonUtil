import { describe, expect, it } from 'vitest';
import { buildTransformDecodedSearchData } from './transformReportDecodedSearchData';

describe('transformReportDecodedSearchData', () => {
  it('生成 decoded 搜索文本和搜索路径索引', () => {
    const result = buildTransformDecodedSearchData('$.cmd', {
      id: 1,
      empty: {},
    });

    expect(result.decodedSearchText).toContain('$.cmd.id 1');
    expect(result.decodedSearchText).toContain('$.cmd.empty 对象: 空');
    expect(result.decodedSearchPaths).toEqual([
      { path: '$.cmd.id', preview: '1', value: 1 },
      { path: '$.cmd.empty', preview: '对象: 空', value: {} },
    ]);
  });

  it('限制搜索文本长度和索引路径数量', () => {
    const result = buildTransformDecodedSearchData('$.cmd', {
      a: 1,
      b: 2,
      c: 3,
    }, 8, 2);

    expect(result.decodedSearchText).toBe('$.cmd.a ');
    expect(result.decodedSearchPaths).toEqual([
      { path: '$.cmd.a', preview: '1', value: 1 },
      { path: '$.cmd.b', preview: '2', value: 2 },
    ]);
  });

  it('非对象 decoded 值不生成搜索数据', () => {
    expect(buildTransformDecodedSearchData('$.cmd', 'plain')).toEqual({});
  });
});

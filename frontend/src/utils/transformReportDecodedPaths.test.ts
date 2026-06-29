import { describe, expect, it } from 'vitest';
import {
  buildTransformDecodedPaths,
  buildTransformDecodedSearchData,
} from './transformReportDecodedPaths';

describe('transformReportDecodedPaths', () => {
  it('收集 decoded leaf 路径并按报告路径重定位', () => {
    expect(buildTransformDecodedPaths('$.cmd', {
      id: 1,
      list: [],
      'unsafe-key': { done: true },
    })).toMatchObject({
      decodedPaths: [
        { path: '$.cmd.id', preview: '1', copyText: '$.cmd.id = 1' },
        { path: '$.cmd.list', preview: '数组 0 项', copyText: '$.cmd.list = []' },
        { path: '$.cmd["unsafe-key"].done', preview: 'true', copyText: '$.cmd["unsafe-key"].done = true' },
      ],
      decodedPathCount: 3,
      isDecodedPathCountTruncated: false,
      hasMoreDecodedPaths: false,
    });
  });

  it('decoded 路径展示上限不影响总数统计', () => {
    const result = buildTransformDecodedPaths('$.cmd', { a: 1, b: 2, c: 3 }, 2);

    expect(result.decodedPaths).toHaveLength(2);
    expect(result.decodedPathCount).toBe(3);
    expect(result.hasMoreDecodedPaths).toBe(true);
  });

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

  it('非对象 decoded 值不生成内部路径数据', () => {
    expect(buildTransformDecodedPaths('$.cmd', 'plain')).toMatchObject({
      decodedPaths: [],
      decodedPathCount: 0,
    });
    expect(buildTransformDecodedSearchData('$.cmd', 'plain')).toEqual({});
  });
});

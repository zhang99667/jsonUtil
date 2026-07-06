import { describe, expect, it } from 'vitest';
import { buildJsonPathResultPreviewItems } from './jsonPathPanelPreviewItems';
import type { JsonPathQueryItem } from './jsonPathQuery';

const createItem = (
  path: string,
  value: unknown,
  sourceLabel?: string
): JsonPathQueryItem => ({
  path,
  value,
  sourceLabel,
  range: null,
  pointer: path.replace(/^\$/, ''),
});

describe('jsonPathPanelPreviewItems', () => {
  it('构建可渲染的结果预览项并保留原始下标', () => {
    expect(buildJsonPathResultPreviewItems([
      createItem('$.user.name', 'Ada', '用户姓名'),
      createItem('$.policies', { auto_refresh: '1', preload: '0' }),
    ], 10)).toEqual([
      {
        index: 0,
        path: '$.user.name',
        sourceLabel: '用户姓名',
        text: 'Ada',
      },
      {
        index: 1,
        path: '$.policies',
        sourceLabel: undefined,
        text: '对象(2)',
      },
    ]);
  });

  it('按可见上限裁剪预览项，避免面板一次渲染过多结果', () => {
    const items = [
      createItem('$.items[0]', 0),
      createItem('$.items[1]', 1),
      createItem('$.items[2]', 2),
    ];

    expect(buildJsonPathResultPreviewItems(items, 2).map(item => item.path)).toEqual([
      '$.items[0]',
      '$.items[1]',
    ]);
  });
});

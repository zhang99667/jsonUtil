import { describe, expect, it } from 'vitest';
import {
  assignQueryParam,
  buildQueryStringFromObject,
  parseStructuredQueryKey,
  type StructuredQueryParamContainer,
} from './schemeStructuredQuery';

describe('schemeStructuredQuery', () => {
  it('解析点号、数组索引和空数组参数名', () => {
    expect(parseStructuredQueryKey('items[0].title')).toEqual(['items', 0, 'title']);
    expect(parseStructuredQueryKey('tags[]')).toEqual(['tags', null]);
    expect(parseStructuredQueryKey('ext[scene]')).toEqual(['ext', 'scene']);
    expect(parseStructuredQueryKey('bad[open')).toEqual(['bad[open']);
  });

  it('将结构化参数赋值为对象、索引数组和重复普通参数', () => {
    const result: StructuredQueryParamContainer = {};

    assignQueryParam(result, 'user.name', '张三');
    assignQueryParam(result, 'items[0].id', '1');
    assignQueryParam(result, 'items[0].title', 'feed');
    assignQueryParam(result, 'tags[]', 'news');
    assignQueryParam(result, 'tag', 'feed');
    assignQueryParam(result, 'tag', 'sports');

    expect(result).toEqual({
      user: { name: '张三' },
      items: [{ id: '1', title: 'feed' }],
      tags: ['news'],
      tag: ['feed', 'sports'],
    });
  });

  it('按原始 query 风格回写点号和括号结构化参数', () => {
    expect(buildQueryStringFromObject({
      items: [
        { id: '10', title: 'feed' },
        { id: '2', title: 'news' },
      ],
    }, 'items[0].id=1&items[0].title=feed')).toBe(
      'items%5B0%5D.id=10&items%5B0%5D.title=feed&items%5B1%5D.id=2&items%5B1%5D.title=news'
    );

    expect(buildQueryStringFromObject({
      ext: {
        scene: 'detail',
        source: 'box',
      },
    }, 'ext%5Bscene%5D=feed&ext%5Bsource%5D=box')).toBe(
      'ext%5Bscene%5D=detail&ext%5Bsource%5D=box'
    );
  });

  it('保留空数组风格并跳过 undefined 字段', () => {
    expect(buildQueryStringFromObject({
      tags: ['feed', 'news'],
      unused: undefined,
    }, 'tags[]=feed&tags[]=old')).toBe('tags%5B%5D=feed&tags%5B%5D=news');
  });
});

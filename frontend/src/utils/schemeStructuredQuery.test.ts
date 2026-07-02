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

  it('同一个结构化数组索引重复赋值时保留所有叶子值', () => {
    const result: StructuredQueryParamContainer = {};

    assignQueryParam(result, 'items[0].tag', 'feed');
    assignQueryParam(result, 'items[0].tag', 'news');
    assignQueryParam(result, 'items[1].tag', 'sports');

    expect(result).toEqual({
      items: [
        { tag: ['feed', 'news'] },
        { tag: 'sports' },
      ],
    });
  });

  it('中间段已有对象时不因后续数组索引强行替换', () => {
    const result: StructuredQueryParamContainer = {
      items: { locked: 'yes' },
      tags: 'old',
    };

    assignQueryParam(result, 'items[0].id', '1');
    assignQueryParam(result, 'tags[].id', '2');

    expect(result).toEqual({
      items: { locked: 'yes' },
      tags: [{ id: '2' }],
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

  it('嵌套对象中的数组回写时沿用原始括号和空数组风格', () => {
    expect(buildQueryStringFromObject({
      ext: {
        tags: ['feed', 'news'],
        meta: { source: 'box' },
      },
    }, 'ext%5Btags%5D%5B%5D=old&ext%5Bmeta%5D%5Bsource%5D=old')).toBe(
      'ext%5Btags%5D%5B%5D=feed&ext%5Btags%5D%5B%5D=news&ext%5Bmeta%5D%5Bsource%5D=box'
    );
  });

  it('对象数组内的数组字段回写时保留点号对象风格', () => {
    expect(buildQueryStringFromObject({
      items: [
        { id: '10', tags: ['feed', 'news'] },
      ],
    }, 'items[0].id=1&items[0].tags[]=old')).toBe(
      'items%5B0%5D.id=10&items%5B0%5D.tags%5B%5D=feed&items%5B0%5D.tags%5B%5D=news'
    );
  });

  it('保留空数组风格并跳过 undefined 字段', () => {
    expect(buildQueryStringFromObject({
      tags: ['feed', 'news'],
      unused: undefined,
    }, 'tags[]=feed&tags[]=old')).toBe('tags%5B%5D=feed&tags%5B%5D=news');
  });
});

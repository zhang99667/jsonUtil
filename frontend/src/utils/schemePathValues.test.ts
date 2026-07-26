import { describe, expect, it } from 'vitest';
import {
  buildSchemePathValuesForCopy,
  formatSchemePathValueCountLabel,
} from './schemePathValues';

describe('schemePathValues', () => {
  it('复制普通对象路径和值', () => {
    expect(buildSchemePathValuesForCopy('{"cmd":{"nid":123,"title":"标题"},"from":"feed"}')).toEqual({
      text: '$.cmd.nid = 123\n$.cmd.title = "标题"\n$.from = "feed"',
      rowCount: 3,
      isTruncated: false,
    });
  });

  it('对特殊 key 使用可执行 JSONPath 表达式', () => {
    const result = buildSchemePathValuesForCopy(JSON.stringify({
      'a.b': {
        'x/y': {
          'tilde~key': 1,
        },
      },
      'quote"key': 'value',
    }));

    expect(result?.text).toBe([
      '$["a.b"]["x/y"]["tilde~key"] = 1',
      '$[?(@property === "quote\\"key")] = "value"',
    ].join('\n'));
  });

  it('保留空数组和空对象作为可定位叶子节点', () => {
    const result = buildSchemePathValuesForCopy(JSON.stringify({
      items: [{ id: 1 }, {}],
      emptyList: [],
      emptyObject: {},
    }));

    expect(result).toEqual({
      text: [
        '$.items[0].id = 1',
        '$.items[1] = {}',
        '$.emptyList = []',
        '$.emptyObject = {}',
      ].join('\n'),
      rowCount: 4,
      isTruncated: false,
    });
  });

  it('按限制截断复制结果并返回已复制数量', () => {
    const result = buildSchemePathValuesForCopy(JSON.stringify({
      list: [1, 2, 3, 4],
    }), { limit: 3 });

    expect(result).toEqual({
      text: [
        '$.list[0] = 1',
        '$.list[1] = 2',
        '$.list[2] = 3',
        '... 还有更多路径未复制',
      ].join('\n'),
      rowCount: 3,
      isTruncated: true,
    });
  });

  it('五千层单叶子输入仍能复制完整路径', () => {
    const depth = 5_000;
    const source = `${'{"child":'.repeat(depth)}"done"${'}'.repeat(depth)}`;
    const result = buildSchemePathValuesForCopy(source);

    expect(result).toEqual({
      text: `$${'.child'.repeat(depth)} = "done"`,
      rowCount: 1,
      isTruncated: false,
    });
  });

  it('非法 JSON 返回 null', () => {
    expect(buildSchemePathValuesForCopy('{"cmd":')).toBeNull();
    expect(buildSchemePathValuesForCopy('{"value":1e400}')).toBeNull();
  });

  it('单个超长值按复制预算截断', () => {
    const result = buildSchemePathValuesForCopy(JSON.stringify({ value: 'a'.repeat(9_000) }));

    expect(result?.text).toHaveLength(8_013);
    expect(result?.text.endsWith('...')).toBe(true);
  });

  it('格式化复制数量文案', () => {
    expect(formatSchemePathValueCountLabel(3, false)).toBe('3 项');
    expect(formatSchemePathValueCountLabel(500, true)).toBe('已返回 500 项');
  });
});

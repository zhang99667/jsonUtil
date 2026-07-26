import { describe, expect, it } from 'vitest';
import { setLegacyJsonPathValue } from './appLegacyJsonPath';

describe('appLegacyJsonPath', () => {
  it('按旧 JSONPath 写入对象字段', () => {
    const root = { data: { cmd: 'old' } };

    expect(setLegacyJsonPathValue(root, '$.data.cmd', 'new')).toBe(root);
    expect(root.data.cmd).toBe('new');
  });

  it('按旧 JSONPath 写入数组字段', () => {
    const root = { list: [{ url: 'old' }] };

    setLegacyJsonPathValue(root, '$.list[0].url', 'new');
    expect(root.list[0].url).toBe('new');
  });

  it('复用标准解析器处理特殊对象字段', () => {
    const root = {
      'a.b': {
        '1abc': 'old',
      },
    };

    setLegacyJsonPathValue(root, '$["a.b"]["1abc"]', 'new');
    expect(root['a.b']['1abc']).toBe('new');
  });

  it('支持旧路径替换根节点', () => {
    expect(setLegacyJsonPathValue({ value: 'old' }, '$', 'new')).toBe('new');
  });

  it('拒绝非法路径和原型链穿透', () => {
    const pollutionKey = 'jsonUtilsLegacyPathPolluted';

    try {
      expect(() => setLegacyJsonPathValue({}, 'data.value', 'new')).toThrow('非法 JSONPath');
      expect(() => setLegacyJsonPathValue({}, '$.missing.value', 'new')).toThrow('无法继续访问');
      expect(() => setLegacyJsonPathValue(
        {},
        `$.constructor.prototype.${pollutionKey}`,
        'new'
      )).toThrow('无法继续访问');
      expect(Object.hasOwn(Object.prototype, pollutionKey)).toBe(false);
    } finally {
      Reflect.deleteProperty(Object.prototype, pollutionKey);
    }
  });
});

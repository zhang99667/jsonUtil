import { describe, expect, it } from 'vitest';
import type { JsonObject } from '../types.ts';
import { applyTemplate, deepMergeTemplate } from './jsonTemplate.ts';
import { applyTemplate as applyTemplateFromTransformations } from './transformations.ts';

const createDeepMergeObject = (leaf: JsonObject, depth: number): JsonObject => {
  let value = leaf;
  for (let index = 0; index < depth; index += 1) {
    value = { child: value };
  }
  return value;
};

it('原变换模块导出路径继续兼容', () => {
  expect(applyTemplateFromTransformations).toBe(applyTemplate);
});

describe('deepMergeTemplate', () => {
  it('模板标量覆盖目标同名字段', () => {
    expect(deepMergeTemplate(
      { name: '旧值', age: 20 },
      { name: '新值' }
    )).toEqual({ name: '新值', age: 20 });
  });

  it('递归合并嵌套对象', () => {
    expect(deepMergeTemplate(
      {
        user: {
          name: '张三',
          address: { city: '北京', zip: '100000' },
        },
      },
      { user: { address: { city: '上海' } } }
    )).toEqual({
      user: {
        name: '张三',
        address: { city: '上海', zip: '100000' },
      },
    });
  });

  it('数组整体使用模板值', () => {
    expect(deepMergeTemplate(
      { tags: [1, 2, 3] },
      { tags: ['a', 'b'] }
    )).toEqual({ tags: ['a', 'b'] });
  });

  it('保留目标独有字段', () => {
    expect(deepMergeTemplate(
      { a: 1, b: 2, c: 3 },
      { a: 10 }
    )).toEqual({ a: 10, b: 2, c: 3 });
  });

  it('添加模板独有字段', () => {
    expect(deepMergeTemplate(
      { a: 1 },
      { b: 2, c: 3 }
    )).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('万级嵌套对象合并不依赖 JavaScript 调用栈', () => {
    const depth = 10_000;
    const result = deepMergeTemplate(
      createDeepMergeObject({ keep: true, changed: 'old' }, depth),
      createDeepMergeObject({ changed: 'new' }, depth)
    );
    let cursor = result as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(cursor).toEqual({ keep: true, changed: 'new' });
  });

  it('模板特殊键保留为普通自有属性', () => {
    const template = JSON.parse('{"__proto__":{"polluted":true}}') as JsonObject;
    const result = deepMergeTemplate({}, template) as JsonObject;

    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result['__proto__']).toEqual({ polluted: true });
  });
});

describe('applyTemplate', () => {
  it('合并后返回格式化 JSON', () => {
    const result = applyTemplate(
      JSON.stringify({ name: '旧值', keep: true }),
      JSON.stringify({ name: '新值', extra: 42 })
    );

    expect(JSON.parse(result)).toEqual({ name: '新值', keep: true, extra: 42 });
    expect(result).toContain('\n');
  });

  it('使用占位符回填模板替换字符串内容', () => {
    const input = JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
      nested: {
        panel_cmd: 'prefix-__WEBPANEL_CMD__-suffix',
        keep: '__EMPTY__',
      },
      list: ['__CONVERT_CMD__'],
    });
    const template = JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      placeholders: {
        __CONVERT_CMD__: 'sampleapp://v1/browser/open?url=https://example.com?a="b"',
        __WEBPANEL_CMD__: 'samplevendor://vendor/ad/rewardWebPanel',
        __EMPTY__: '',
      },
      placeholderDetails: [],
    });

    expect(JSON.parse(applyTemplate(input, template))).toEqual({
      button_cmd: 'sampleapp://v1/browser/open?url=https://example.com?a="b"',
      nested: {
        panel_cmd: 'prefix-samplevendor://vendor/ad/rewardWebPanel-suffix',
        keep: '__EMPTY__',
      },
      list: ['sampleapp://v1/browser/open?url=https://example.com?a="b"'],
    });
  });

  it('五千层对象占位符回填不依赖自定义递归调用栈', () => {
    const depth = 5_000;
    const input = JSON.stringify(createDeepMergeObject({ value: '__TOKEN__' }, depth));
    const template = JSON.stringify({
      kind: 'json-helper-runtime-placeholder-fill-template',
      placeholders: { __TOKEN__: 'done' },
    });
    let cursor = JSON.parse(applyTemplate(input, template)) as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(cursor).toEqual({ value: 'done' });
  });

  it.each([
    ['空替换值', { __CONVERT_CMD__: '' }],
    ['空占位符名称', { '': 'sampleapp://open' }],
    ['空白占位符名称', { '   ': 'sampleapp://open' }],
  ])('占位符回填模板包含%s时报错', (_label, placeholders) => {
    const template = JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      placeholders,
      placeholderDetails: [],
    });

    expect(() => applyTemplate('{"button_cmd":"__CONVERT_CMD__"}', template)).toThrow(
      '占位符回填模板缺少有效替换项'
    );
  });

  it.each([
    ['   ', '{"a":1}', '当前编辑器内容为空'],
    ['{"a":1}', '   ', '模板内容为空'],
    ['{invalid}', '{"a":1}', '当前编辑器内容不是合法的 JSON'],
    ['{"a":1}', '{invalid}', '模板内容不是合法的 JSON'],
    ['{"value":1e400}', '{"a":1}', '当前编辑器内容不是合法的 JSON'],
    ['{"a":1}', '{"value":1e400}', '模板内容不是合法的 JSON'],
  ])('%s 与模板输入组合报错稳定', (input, template, message) => {
    expect(() => applyTemplate(input, template)).toThrow(message);
  });
});

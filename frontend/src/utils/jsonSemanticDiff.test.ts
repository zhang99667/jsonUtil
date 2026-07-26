import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import {
  compareJsonSemanticText,
  compareJsonSemanticValues,
  formatJsonSemanticDiffMarkdown,
  parseJsonSemanticDiffIgnoredPaths,
} from './jsonSemanticDiff';

const createDeepJsonValue = (leaf: JsonValue, depth: number): JsonValue => {
  let value = leaf;
  for (let index = 0; index < depth; index += 1) {
    value = { child: value };
  }
  return value;
};

describe('jsonSemanticDiff', () => {
  it('对比对象新增、删除和修改路径', () => {
    const result = compareJsonSemanticValues(
      {
        id: 1,
        name: 'old',
        nested: {
          keep: true,
          remove: 'gone',
          'trace.id': 'a',
        },
      },
      {
        id: 1,
        name: 'new',
        nested: {
          keep: true,
          'trace.id': 'b',
          add: 2,
        },
      }
    );

    expect(result).toMatchObject({
      added: 1,
      removed: 1,
      changed: 2,
      total: 4,
      isLimited: false,
    });
    expect(result.items.map(item => ({ kind: item.kind, path: item.path }))).toEqual([
      { kind: 'changed', path: '$.name' },
      { kind: 'added', path: '$.nested.add' },
      { kind: 'removed', path: '$.nested.remove' },
      { kind: 'changed', path: '$.nested["trace.id"]' },
    ]);
    expect(result.items.map(item => item.pointer)).toEqual([
      '/name',
      '/nested/add',
      '/nested/remove',
      '/nested/trace.id',
    ]);
  });

  it('按数组索引对比数组变化', () => {
    const result = compareJsonSemanticValues(
      [{ id: 1 }, { id: 2 }],
      [{ id: 1 }, { id: 3 }, { id: 4 }]
    );

    expect(result.items.map(item => ({ kind: item.kind, path: item.path }))).toEqual([
      { kind: 'changed', path: '$[1].id' },
      { kind: 'added', path: '$[2]' },
    ]);
    expect(result.items.map(item => item.pointer)).toEqual(['/1/id', '/2']);
  });

  it('深层对象对比不依赖 JavaScript 调用栈', () => {
    const depth = 10_000;
    const result = compareJsonSemanticValues(
      createDeepJsonValue({ value: 'old' }, depth),
      createDeepJsonValue({ value: 'new' }, depth)
    );

    expect(result).toMatchObject({ changed: 1, total: 1, isLimited: false });
    expect(result.items[0]?.path.endsWith('.value')).toBe(true);
    expect(result.items[0]?.pointer.endsWith('/value')).toBe(true);
  });

  it('深层对象类型变化时有界生成差异预览', () => {
    const result = compareJsonSemanticValues(
      createDeepJsonValue({ value: 'old' }, 10_000),
      false
    );

    expect(result).toMatchObject({ changed: 1, total: 1 });
    expect(result.items[0]).toMatchObject({
      beforePreview: '对象: child',
      afterPreview: 'false',
    });
  });

  it('大型容器差异预览保持长度上限', () => {
    const longKey = 'x'.repeat(200);
    const result = compareJsonSemanticValues(
      {},
      { added: { [longKey]: true } }
    );
    const preview = result.items[0]?.afterPreview;

    expect(preview).toHaveLength(120);
    expect(preview?.endsWith('...')).toBe(true);
  });

  it('差异项生成可复制 JSON Pointer 并转义特殊 key', () => {
    const result = compareJsonSemanticValues(
      {
        'a.b': {
          'x/y': {
            'tilde~key': 'old',
          },
        },
      },
      {
        'a.b': {
          'x/y': {
            'tilde~key': 'new',
          },
        },
      }
    );

    expect(result.items[0]).toMatchObject({
      kind: 'changed',
      path: '$["a.b"]["x/y"]["tilde~key"]',
      pointer: '/a.b/x~1y/tilde~0key',
    });
  });

  it('支持 JSON Lines 文本对比', () => {
    const result = compareJsonSemanticText(
      '{"id":1,"ok":true}\n{"id":2,"name":"old"}',
      '{"id":1,"ok":true}\n{"id":2,"name":"new"}'
    );

    expect(result.changed).toBe(1);
    expect(result.items[0]).toMatchObject({
      kind: 'changed',
      path: '$[1].name',
      beforePreview: '"old"',
      afterPreview: '"new"',
    });
  });

  it('拒绝指数溢出的 JSON 数值', () => {
    expect(() => compareJsonSemanticText(
      '{"value":1e400}',
      '{"value":1}'
    )).toThrow('JSON 包含不支持的值');
  });

  it('超过差异上限时标记截断', () => {
    const before = { items: [1, 2, 3, 4] };
    const after = { items: [2, 3, 4, 5] };
    const result = compareJsonSemanticValues(before, after, { maxDiffs: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.isLimited).toBe(true);
  });

  it('支持按 JSONPath 前缀忽略噪声字段', () => {
    const result = compareJsonSemanticValues(
      {
        id: 1,
        meta: { updatedAt: 'old', trace: 'old' },
        items: [{ score: 1, traceId: 'old' }],
      },
      {
        id: 1,
        meta: { updatedAt: 'new', trace: 'new' },
        items: [{ score: 2, traceId: 'new' }],
      },
      { ignoredPaths: ['$.meta', '$.items[0].traceId'] }
    );

    expect(result).toMatchObject({
      added: 0,
      removed: 0,
      changed: 1,
      total: 1,
      ignoredPaths: ['$.meta', '$.items[0].traceId'],
    });
    expect(result.items.map(item => item.path)).toEqual(['$.items[0].score']);
  });

  it('解析忽略路径输入并补齐根路径前缀', () => {
    expect(parseJsonSemanticDiffIgnoredPaths('traceId, $.meta.updatedAt; [0].id\ntraceId')).toEqual([
      '$.traceId',
      '$.meta.updatedAt',
      '$[0].id',
    ]);
  });

  it('生成可复制 Markdown 报告', () => {
    const result = compareJsonSemanticValues({ id: 1, traceId: 'old' }, { id: 2, traceId: 'new' }, {
      ignoredPaths: ['$.traceId'],
    });
    const report = formatJsonSemanticDiffMarkdown(result);

    expect(report).toContain('# JSON 对比报告');
    expect(report).toContain('汇总: 新增 0 / 删除 0 / 修改 1');
    expect(report).toContain('忽略路径: `$.traceId`');
    expect(report).toContain('| 类型 | 路径 | 原始值 | 对比值 |');
    expect(report).toContain('| 修改 | `$.id` | `1` | `2` |');
    expect(report).not.toContain('`$.traceId` | `"old"`');
  });
});

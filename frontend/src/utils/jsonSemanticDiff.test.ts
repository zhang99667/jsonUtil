import { describe, expect, it } from 'vitest';
import {
  compareJsonSemanticText,
  compareJsonSemanticValues,
  formatJsonSemanticDiffMarkdown,
} from './jsonSemanticDiff';

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

  it('超过差异上限时标记截断', () => {
    const before = { items: [1, 2, 3, 4] };
    const after = { items: [2, 3, 4, 5] };
    const result = compareJsonSemanticValues(before, after, { maxDiffs: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.isLimited).toBe(true);
  });

  it('生成可复制 Markdown 报告', () => {
    const result = compareJsonSemanticValues({ id: 1 }, { id: 2 });
    const report = formatJsonSemanticDiffMarkdown(result);

    expect(report).toContain('# JSON 对比报告');
    expect(report).toContain('汇总: 新增 0 / 删除 0 / 修改 1');
    expect(report).toContain('| 修改 | `$.id` | `1` | `2` |');
  });
});

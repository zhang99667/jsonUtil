import { describe, expect, it } from 'vitest';
import { buildJsonTreeModel } from './jsonTreeModel';

describe('jsonTreeModel', () => {
  it('生成 JSON 结构节点和可定位路径', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      user: {
        name: 'Alice',
        'trace.id': 't-1',
      },
      items: [1, true, null],
    }));

    expect(model.isLimited).toBe(false);
    expect(model.nodes.map(node => ({
      path: node.path,
      keyLabel: node.keyLabel,
      depth: node.depth,
      kind: node.kind,
      childCount: node.childCount,
      valuePreview: node.valuePreview,
    }))).toEqual([
      { path: '$', keyLabel: '$', depth: 0, kind: 'object', childCount: 2, valuePreview: '对象 2 个键' },
      { path: '$.user', keyLabel: 'user', depth: 1, kind: 'object', childCount: 2, valuePreview: '对象 2 个键' },
      { path: '$.user.name', keyLabel: 'name', depth: 2, kind: 'string', childCount: 0, valuePreview: '"Alice"' },
      { path: '$.user["trace.id"]', keyLabel: 'trace.id', depth: 2, kind: 'string', childCount: 0, valuePreview: '"t-1"' },
      { path: '$.items', keyLabel: 'items', depth: 1, kind: 'array', childCount: 3, valuePreview: '数组 3 项' },
      { path: '$.items[0]', keyLabel: '[0]', depth: 2, kind: 'number', childCount: 0, valuePreview: '1' },
      { path: '$.items[1]', keyLabel: '[1]', depth: 2, kind: 'boolean', childCount: 0, valuePreview: 'true' },
      { path: '$.items[2]', keyLabel: '[2]', depth: 2, kind: 'null', childCount: 0, valuePreview: 'null' },
    ]);
  });

  it('支持 JSON Lines 作为数组结构浏览', () => {
    const model = buildJsonTreeModel('{"id":1}\n{"id":2}');

    expect(model.nodes.map(node => node.path)).toEqual([
      '$',
      '$[0]',
      '$[0].id',
      '$[1]',
      '$[1].id',
    ]);
  });

  it('节点数量超过上限时标记截断', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      items: Array.from({ length: 5 }, (_, index) => ({ id: index })),
    }), {
      maxNodes: 4,
    });

    expect(model.isLimited).toBe(true);
    expect(model.nodes).toHaveLength(4);
  });

  it('深度超过上限时标记截断', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      level1: {
        level2: {
          level3: true,
        },
      },
    }), {
      maxDepth: 1,
    });

    expect(model.isLimited).toBe(true);
    expect(model.nodes.map(node => node.path)).toEqual(['$', '$.level1']);
  });

  it('非法 JSON 返回可读错误', () => {
    expect(() => buildJsonTreeModel('{"broken":}')).toThrow('JSON 结构解析失败');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildJsonTreeModel,
  buildJsonTreeArrayTablePreview,
  formatJsonTreeArrayTableCsvText,
  formatJsonTreeArrayTableJsonText,
  getJsonTreeNodeValue,
  getJsonTreeNodeValueCopyText,
  matchesJsonTreeSearchText,
} from './jsonTreeModel';

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
      jsonPointer: node.jsonPointer,
      keyLabel: node.keyLabel,
      depth: node.depth,
      kind: node.kind,
      childCount: node.childCount,
      valuePreview: node.valuePreview,
    }))).toEqual([
      { path: '$', jsonPointer: '', keyLabel: '$', depth: 0, kind: 'object', childCount: 2, valuePreview: '对象 2 个键' },
      { path: '$.user', jsonPointer: '/user', keyLabel: 'user', depth: 1, kind: 'object', childCount: 2, valuePreview: '对象 2 个键' },
      { path: '$.user.name', jsonPointer: '/user/name', keyLabel: 'name', depth: 2, kind: 'string', childCount: 0, valuePreview: '"Alice"' },
      { path: '$.user["trace.id"]', jsonPointer: '/user/trace.id', keyLabel: 'trace.id', depth: 2, kind: 'string', childCount: 0, valuePreview: '"t-1"' },
      { path: '$.items', jsonPointer: '/items', keyLabel: 'items', depth: 1, kind: 'array', childCount: 3, valuePreview: '数组 3 项' },
      { path: '$.items[0]', jsonPointer: '/items/0', keyLabel: '[0]', depth: 2, kind: 'number', childCount: 0, valuePreview: '1' },
      { path: '$.items[1]', jsonPointer: '/items/1', keyLabel: '[1]', depth: 2, kind: 'boolean', childCount: 0, valuePreview: 'true' },
      { path: '$.items[2]', jsonPointer: '/items/2', keyLabel: '[2]', depth: 2, kind: 'null', childCount: 0, valuePreview: 'null' },
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
    expect(model.nodes.map(node => node.jsonPointer)).toEqual([
      '',
      '/0',
      '/0/id',
      '/1',
      '/1/id',
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

  it('结构搜索支持多关键词和字符顺序模糊匹配', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      userProfile: {
        displayName: 'Alice',
        trackingId: 'trace-001',
      },
      orderItems: [{ skuId: 'sku-1' }],
    }));
    const displayNameNode = model.nodes.find(node => node.path === '$.userProfile.displayName');
    const skuNode = model.nodes.find(node => node.path === '$.orderItems[0].skuId');

    expect(displayNameNode).toBeDefined();
    expect(skuNode).toBeDefined();
    expect(matchesJsonTreeSearchText(displayNameNode?.searchText || '', 'usr dnm')).toBe(true);
    expect(matchesJsonTreeSearchText(skuNode?.searchText || '', 'ord sku')).toBe(true);
    expect(matchesJsonTreeSearchText(displayNameNode?.searchText || '', 'order sku')).toBe(false);
  });

  it('支持按 JSON Pointer 复制节点值', () => {
    const source = JSON.stringify({
      user: {
        name: 'Alice',
        'a/b~c': true,
      },
    });
    const model = buildJsonTreeModel(source);
    const escapedNode = model.nodes.find(node => node.keyLabel === 'a/b~c');

    expect(escapedNode?.path).toBe('$.user["a/b~c"]');
    expect(escapedNode?.jsonPointer).toBe('/user/a~1b~0c');
    expect(getJsonTreeNodeValue(source, '')).toEqual({
      user: {
        name: 'Alice',
        'a/b~c': true,
      },
    });
    expect(getJsonTreeNodeValue(source, escapedNode?.jsonPointer || '')).toBe(true);
    expect(getJsonTreeNodeValueCopyText(source, '/user/name')).toBe('"Alice"');
    expect(getJsonTreeNodeValueCopyText(source, '/user', { pretty: true })).toBe(JSON.stringify({
      name: 'Alice',
      'a/b~c': true,
    }, null, 2));
  });

  it('支持从 JSON Lines 节点复制值并处理非法 Pointer', () => {
    const source = '{"id":1}\n{"id":2}';

    expect(getJsonTreeNodeValue(source, '/1/id')).toBe(2);
    expect(getJsonTreeNodeValueCopyText(source, '/0')).toBe('{"id":1}');
    expect(() => getJsonTreeNodeValue(source, '/2/id')).toThrow('数组下标越界');
  });

  it('为对象数组生成表格预览并复制 JSON 和 CSV', () => {
    const source = JSON.stringify({
      items: [
        { id: 1, name: 'Alice', note: ' a,b ' },
        { id: 2, name: 'Bob', extra: { ok: true }, note: 'quote "x"\nline' },
        { id: 3, name: 'Charlie', note: 'quote "x"' },
      ],
    });
    const preview = buildJsonTreeArrayTablePreview(source, '/items', {
      maxRows: 2,
      maxColumns: 3,
    });

    expect(preview).toMatchObject({
      columns: ['id', 'name', 'note'],
      totalRows: 3,
      sampledRows: 2,
      totalColumns: 4,
      isRowLimited: true,
      isColumnLimited: true,
    });
    expect(preview?.rows.map(row => ({
      index: row.index,
      cells: row.cells,
      jsonObject: row.jsonObject,
    }))).toEqual([
      {
        index: 0,
        cells: ['1', 'Alice', 'a,b'],
        jsonObject: { id: 1, name: 'Alice', note: ' a,b ' },
      },
      {
        index: 1,
        cells: ['2', 'Bob', 'quote "x" line'],
        jsonObject: { id: 2, name: 'Bob', note: 'quote "x"\nline' },
      },
    ]);
    expect(formatJsonTreeArrayTableJsonText(preview!)).toBe(JSON.stringify([
      { id: 1, name: 'Alice', note: ' a,b ' },
      { id: 2, name: 'Bob', note: 'quote "x"\nline' },
    ], null, 2));
    expect(formatJsonTreeArrayTableCsvText(preview!)).toBe([
      'id,name,note',
      '1,Alice," a,b "',
      '2,Bob,"quote ""x""\nline"',
    ].join('\n'));
  });

  it('非对象数组不生成表格预览', () => {
    expect(buildJsonTreeArrayTablePreview(JSON.stringify({
      items: [1, 2, 3],
    }), '/items')).toBeNull();
    expect(buildJsonTreeArrayTablePreview(JSON.stringify({
      items: [{ id: 1 }, 2],
    }), '/items')).toBeNull();
    expect(buildJsonTreeArrayTablePreview(JSON.stringify({
      items: [{}, {}],
    }), '/items')).toBeNull();
  });
});

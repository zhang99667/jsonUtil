import { describe, expect, it } from 'vitest';
import {
  buildJsonTreeModel,
  buildJsonTreeArrayTablePreview,
  filterJsonTreeArrayTablePreviewColumns,
  formatJsonTreeSearchResultsCsvText,
  formatJsonTreeSearchResultsText,
  formatJsonTreeSearchResultsMarkdownText,
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

  it('可把结构搜索结果复制为结构化 JSON 清单', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      user: {
        name: 'Alice',
        trackingId: 'trace-001',
      },
      items: [{ skuId: 'sku-1' }],
    }));
    const matchedNodes = model.nodes.filter(node => matchesJsonTreeSearchText(node.searchText, 'trackingId'));

    expect(formatJsonTreeSearchResultsText(matchedNodes)).toBe(JSON.stringify([
      {
        path: '$.user.trackingId',
        pointer: '/user/trackingId',
        kind: 'string',
        childCount: 0,
        preview: '"trace-001"',
      },
    ], null, 2));
  });

  it('可把结构搜索结果复制为 Markdown 表格摘要', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      user: {
        'trace.id': 'trace-001',
        note: 'A|B\\C',
      },
    }));
    const matchedNodes = model.nodes.filter(node => (
      matchesJsonTreeSearchText(node.searchText, 'trace.id') ||
      matchesJsonTreeSearchText(node.searchText, 'note')
    ));

    expect(formatJsonTreeSearchResultsMarkdownText(matchedNodes)).toBe([
      '| Path | Pointer | Kind | Children | Preview |',
      '| --- | --- | --- | ---: | --- |',
      '| $.user["trace.id"] | /user/trace.id | string | 0 | "trace-001" |',
      '| $.user.note | /user/note | string | 0 | "A\\|B\\\\\\\\C" |',
    ].join('\n'));
    expect(formatJsonTreeSearchResultsMarkdownText([model.nodes[0]])).toBe([
      '| Path | Pointer | Kind | Children | Preview |',
      '| --- | --- | --- | ---: | --- |',
      '| $ | (root) | object | 1 | 对象 1 个键 |',
    ].join('\n'));
    expect(formatJsonTreeSearchResultsMarkdownText([])).toBe([
      '| Path | Pointer | Kind | Children | Preview |',
      '| --- | --- | --- | ---: | --- |',
    ].join('\n'));
  });

  it('可把结构搜索结果复制为 CSV 摘要', () => {
    const model = buildJsonTreeModel(JSON.stringify({
      user: {
        'trace.id': 'trace-001',
        note: ' A,B ',
        multiline: 'line1\nline2',
      },
    }));
    const matchedNodes = model.nodes.filter(node => (
      matchesJsonTreeSearchText(node.searchText, 'trace.id') ||
      matchesJsonTreeSearchText(node.searchText, 'note') ||
      matchesJsonTreeSearchText(node.searchText, 'multiline')
    ));

    expect(formatJsonTreeSearchResultsCsvText(matchedNodes)).toBe([
      'path,pointer,kind,childCount,preview',
      '"$.user[""trace.id""]",/user/trace.id,string,0,"""trace-001"""',
      '$.user.note,/user/note,string,0,""" A,B """',
      '$.user.multiline,/user/multiline,string,0,"""line1\\nline2"""',
    ].join('\n'));
    expect(formatJsonTreeSearchResultsCsvText([model.nodes[0]])).toBe([
      'path,pointer,kind,childCount,preview',
      '$,,object,1,对象 1 个键',
    ].join('\n'));
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
      allColumns: ['id', 'name', 'note', 'extra'],
      totalRows: 3,
      sampledRows: 2,
      totalColumns: 4,
      maxColumns: 3,
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

    const filteredPreview = filterJsonTreeArrayTablePreviewColumns(preview!, 'na');
    expect(filteredPreview.columns).toEqual(['name']);
    expect(filteredPreview.rows.map(row => row.cells)).toEqual([
      ['Alice'],
      ['Bob'],
    ]);
    expect(formatJsonTreeArrayTableJsonText(filteredPreview)).toBe(JSON.stringify([
      { name: 'Alice' },
      { name: 'Bob' },
    ], null, 2));
    expect(formatJsonTreeArrayTableCsvText(filteredPreview)).toBe([
      'name',
      'Alice',
      'Bob',
    ].join('\n'));

    const narrowPreview = buildJsonTreeArrayTablePreview(source, '/items', {
      maxRows: 2,
      maxColumns: 2,
    });
    const manyMatchedPreview = filterJsonTreeArrayTablePreviewColumns(narrowPreview!, 'e');
    expect(manyMatchedPreview.columns).toEqual(['name', 'note']);
    expect(manyMatchedPreview.isColumnLimited).toBe(true);

    const hiddenColumnPreview = filterJsonTreeArrayTablePreviewColumns(preview!, 'extra');
    expect(hiddenColumnPreview.columns).toEqual(['extra']);
    expect(hiddenColumnPreview.rows.map(row => row.cells)).toEqual([
      [''],
      ['{"ok":true}'],
    ]);
    expect(formatJsonTreeArrayTableJsonText(hiddenColumnPreview)).toBe(JSON.stringify([
      {},
      { extra: { ok: true } },
    ], null, 2));
    expect(formatJsonTreeArrayTableCsvText(hiddenColumnPreview)).toBe([
      'extra',
      '',
      '"{""ok"":true}"',
    ].join('\n'));

    const shortCellSource = JSON.stringify({
      rows: [
        { id: 1, name: 'Alice', hiddenLong: 'very long hidden value' },
      ],
    });
    const shortCellPreview = buildJsonTreeArrayTablePreview(shortCellSource, '/rows', {
      maxRows: 2,
      maxColumns: 2,
      maxCellLength: 16,
    });
    const shortHiddenColumnPreview = filterJsonTreeArrayTablePreviewColumns(shortCellPreview!, 'hiddenLong');
    expect(shortHiddenColumnPreview.rows[0].cells).toEqual(['very long hid...']);
    expect(shortHiddenColumnPreview.rows[0].copyCells).toEqual(['very long hidden value']);

    const emptyPreview = filterJsonTreeArrayTablePreviewColumns(preview!, 'missing');
    expect(emptyPreview.columns).toEqual([]);
    expect(emptyPreview.rows.map(row => row.cells)).toEqual([
      [],
      [],
    ]);
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

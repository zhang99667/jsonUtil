import { describe, expect, it } from 'vitest';
import {
  MAX_JSON_SCHEMA_LIBRARY_ITEMS,
  createJsonSchemaLibraryItem,
  formatJsonSchemaLibraryExport,
  importJsonSchemaLibrary,
  parseJsonSchemaLibrary,
  removeJsonSchemaLibraryItem,
  serializeJsonSchemaLibrary,
  upsertJsonSchemaLibraryItem,
  type JsonSchemaLibraryItem,
} from './jsonSchemaLibrary';

describe('jsonSchemaLibrary', () => {
  it('从 title 或 $id 生成收藏名称', () => {
    expect(createJsonSchemaLibraryItem(JSON.stringify({
      title: '订单响应',
      type: 'object',
    }), 1)).toMatchObject({
      name: '订单响应',
      updatedAt: 1,
    });

    expect(createJsonSchemaLibraryItem(JSON.stringify({
      $id: 'https://example.com/schemas/user-profile.json',
      type: 'object',
    }), 2)).toMatchObject({
      name: 'user-profile.json',
      updatedAt: 2,
    });
  });

  it('重复保存同一份 Schema 时更新排序和时间', () => {
    const first = upsertJsonSchemaLibraryItem([], '{"title":"A"}', 1);
    const second = upsertJsonSchemaLibraryItem(first, '{"title":"B"}', 2);
    const third = upsertJsonSchemaLibraryItem(second, '{"title":"A"}', 3);

    expect(third).toHaveLength(2);
    expect(third[0]).toMatchObject({ name: 'A', updatedAt: 3 });
    expect(third[1]).toMatchObject({ name: 'B', updatedAt: 2 });
  });

  it('收藏列表最多保留固定数量', () => {
    let items: JsonSchemaLibraryItem[] = [];
    for (let index = 0; index < MAX_JSON_SCHEMA_LIBRARY_ITEMS + 3; index++) {
      items = upsertJsonSchemaLibraryItem(items, JSON.stringify({ title: `Schema ${index}` }), index);
    }

    expect(items).toHaveLength(MAX_JSON_SCHEMA_LIBRARY_ITEMS);
    expect(items[0].name).toBe(`Schema ${MAX_JSON_SCHEMA_LIBRARY_ITEMS + 2}`);
  });

  it('解析本地存储时过滤非法项并支持删除', () => {
    const item = createJsonSchemaLibraryItem('{"title":"Valid"}', 1)!;
    const parsed = parseJsonSchemaLibrary(JSON.stringify([
      item,
      { id: 'broken' },
    ]));

    expect(parsed).toEqual([item]);
    expect(removeJsonSchemaLibraryItem(parsed, item.id)).toEqual([]);
    expect(parseJsonSchemaLibrary(serializeJsonSchemaLibrary(parsed))).toEqual(parsed);
  });

  it('导出 Schema 收藏为可共享包', () => {
    const item = createJsonSchemaLibraryItem('{"title":"订单响应","type":"object"}', 1)!;
    const exportText = formatJsonSchemaLibraryExport([item], new Date('2026-06-18T00:00:00.000Z'));

    expect(JSON.parse(exportText)).toEqual({
      schemaVersion: 1,
      source: 'JSON_SCHEMA_LIBRARY_EXPORT',
      exportedAt: '2026-06-18T00:00:00.000Z',
      itemCount: 1,
      items: [
        {
          name: '订单响应',
          schemaText: '{"title":"订单响应","type":"object"}',
        },
      ],
    });
  });

  it('导入共享包并合并到收藏顶部', () => {
    const current = upsertJsonSchemaLibraryItem([], '{"title":"现有"}', 1);
    const exportText = formatJsonSchemaLibraryExport([
      createJsonSchemaLibraryItem('{"title":"导入 A"}', 2)!,
      createJsonSchemaLibraryItem('{"title":"导入 B"}', 3)!,
    ], new Date('2026-06-18T00:00:00.000Z'));
    const result = importJsonSchemaLibrary(current, exportText, 10);

    expect(result).toMatchObject({
      importedCount: 2,
      skippedCount: 0,
      invalidCount: 0,
    });
    expect(result?.items.map(item => item.name)).toEqual(['导入 A', '导入 B', '现有']);
  });

  it('支持直接导入单个 JSON Schema', () => {
    const result = importJsonSchemaLibrary([], '{"title":"直接 Schema","type":"object"}', 1);

    expect(result?.importedCount).toBe(1);
    expect(result?.items[0].name).toBe('直接 Schema');
    expect(result?.items[0].schemaText).toContain('"title": "直接 Schema"');
  });

  it('导入时跳过重复项并遵守收藏上限', () => {
    const duplicate = '{"title":"重复"}';
    let current: JsonSchemaLibraryItem[] = [];
    for (let index = 0; index < MAX_JSON_SCHEMA_LIBRARY_ITEMS; index++) {
      current = upsertJsonSchemaLibraryItem(current, JSON.stringify({ title: `现有 ${index}` }), index);
    }

    const result = importJsonSchemaLibrary(current, JSON.stringify([
      JSON.parse(duplicate),
      JSON.parse(duplicate),
      { title: '新增' },
    ]), 100);

    expect(result?.importedCount).toBe(2);
    expect(result?.skippedCount).toBe(1);
    expect(result?.invalidCount).toBe(0);
    expect(result?.items).toHaveLength(MAX_JSON_SCHEMA_LIBRARY_ITEMS);
    expect(result?.items.slice(0, 2).map(item => item.name)).toEqual(['重复', '新增']);
  });

  it('导入共享包时跳过无效 schemaText 并单独计数', () => {
    const importText = JSON.stringify({
      source: 'JSON_SCHEMA_LIBRARY_EXPORT',
      items: [
        { schemaText: '{"title":"有效 A","type":"object"}' },
        { schemaText: '{"title":"有效 A","type":"object"}' },
        { schemaText: '{"title":"有效 B","type":"boolean"}' },
        { schemaText: '{"foo":"bar"}' },
        { schemaText: 'not json' },
      ],
    });
    const result = importJsonSchemaLibrary([], importText, 20);

    expect(result).toMatchObject({
      importedCount: 2,
      skippedCount: 1,
      invalidCount: 2,
    });
    expect(result?.items.map(item => item.name)).toEqual(['有效 A', '有效 B']);
  });

  it('导入包只有无效 schemaText 时返回无效计数且不写入收藏', () => {
    const result = importJsonSchemaLibrary([], JSON.stringify({
      source: 'JSON_SCHEMA_LIBRARY_EXPORT',
      items: [
        { schemaText: '{"foo":"bar"}' },
        { schemaText: 'not json' },
      ],
    }), 30);

    expect(result).toEqual({
      items: [],
      importedCount: 0,
      skippedCount: 0,
      invalidCount: 2,
    });
  });

  it('支持导入布尔 JSON Schema', () => {
    const result = importJsonSchemaLibrary([], 'true', 1);

    expect(result).toMatchObject({
      importedCount: 1,
      skippedCount: 0,
      invalidCount: 0,
    });
    expect(result?.items[0].schemaText).toBe('true');
  });

  it('拒绝无法识别的导入内容', () => {
    expect(importJsonSchemaLibrary([], 'not json')).toBeNull();
    expect(importJsonSchemaLibrary([], '{"foo":"bar"}')).toBeNull();
  });
});

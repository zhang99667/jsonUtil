import { describe, expect, it } from 'vitest';
import {
  MAX_JSON_SCHEMA_LIBRARY_ITEMS,
  createJsonSchemaLibraryItem,
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
});

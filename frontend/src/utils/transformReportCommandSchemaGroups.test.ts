import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import {
  buildTopCommandSchemaGroups,
  buildTopCommandSchemaOriginGroups,
  buildTopResourceTypeGroups,
  getCommandSchemaOrigin,
} from './transformReportCommandSchemaGroups';

describe('transformReportCommandSchemaGroups', () => {
  it('按 schema 汇总导航命令并保留路径截断状态', () => {
    const records = [
      {
        path: '$.first',
        commandSchema: 'baiduboxapp://feed/detail',
        commandSchemaRows: [
          { schema: 'baiduboxapp://feed/detail', path: '$.first.cmdSchema', source: 'cmd=1' },
          { schema: 'baiduboxapp://feed/panel', path: '$.first.panel', source: 'cmd=2' },
        ],
      },
      {
        path: '$.second',
        commandSchemaRows: [
          { schema: 'baiduboxapp://feed/detail', path: '$.second.cmdSchema', source: 'cmd=3' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopCommandSchemaGroups(records, { limit: 2, pathLimit: 2 })).toEqual([
      {
        schema: 'baiduboxapp://feed/detail',
        count: 3,
        recordCount: 2,
        paths: ['$.first', '$.first.cmdSchema'],
        hasMorePaths: true,
      },
      {
        schema: 'baiduboxapp://feed/panel',
        count: 1,
        recordCount: 1,
        paths: ['$.first.panel'],
        hasMorePaths: false,
      },
    ]);
  });

  it('从 commandSchemaRows 和嵌套资源字段统计资源类型', () => {
    const records = [
      {
        path: '$.assets',
        commandSchemaRows: [
          { schema: 'https://cdn.example.com/a.png', path: '$.assets.imageUrl', source: 'a' },
        ],
        nestedResourceSearchFields: [
          { path: '$.assets.videoUrl', preview: 'video', value: 'https://cdn.example.com/b.mp4?token=1' },
          { path: '$.assets.icon', preview: 'icon', sourceValue: 'https://cdn.example.com/icon.webp?x=1' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopCommandSchemaGroups(records, { kind: 'resource' }).map(group => ({
      schema: group.schema,
      resourceType: group.resourceType,
      resourceTypeLabel: group.resourceTypeLabel,
    }))).toEqual([
      { schema: 'https://cdn.example.com/a.png', resourceType: 'image', resourceTypeLabel: '图片' },
      { schema: 'https://cdn.example.com/b.mp4', resourceType: 'video', resourceTypeLabel: '视频' },
      { schema: 'https://cdn.example.com/icon.webp', resourceType: 'image', resourceTypeLabel: '图片' },
    ]);
    expect(buildTopResourceTypeGroups(records)).toEqual([
      {
        resourceType: 'image',
        resourceTypeLabel: '图片',
        query: '资源类型:图片',
        count: 2,
        percentage: 66.7,
        recordCount: 1,
        schemaCount: 2,
        schemas: ['https://cdn.example.com/a.png', 'https://cdn.example.com/icon.webp'],
        hasMoreSchemas: false,
      },
      {
        resourceType: 'video',
        resourceTypeLabel: '视频',
        query: '资源类型:视频',
        count: 1,
        percentage: 33.3,
        recordCount: 1,
        schemaCount: 1,
        schemas: ['https://cdn.example.com/b.mp4'],
        hasMoreSchemas: false,
      },
    ]);
  });

  it('归并 schema origin 并兼容转义斜杠和协议形态', () => {
    expect(getCommandSchemaOrigin('https:\\/\\/example.com/path?a=1')).toBe('https://example.com');
    expect(getCommandSchemaOrigin('//cdn.example.com/a.png')).toBe('//cdn.example.com');
    expect(getCommandSchemaOrigin('baiduboxapp://feed/detail')).toBe('baiduboxapp://feed');
    expect(getCommandSchemaOrigin('tel:123456')).toBe('tel:');

    const records = [
      {
        path: '$.first',
        commandSchema: 'baiduboxapp://feed/detail',
        commandSchemaRows: [
          { schema: 'baiduboxapp://feed/panel', path: '$.first.panel', source: 'cmd=1' },
          { schema: 'baiduboxapp://other/detail', path: '$.first.other', source: 'cmd=2' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopCommandSchemaOriginGroups(records)).toEqual([
      {
        origin: 'baiduboxapp://feed',
        count: 2,
        schemaCount: 2,
        recordCount: 1,
        schemas: ['baiduboxapp://feed/detail', 'baiduboxapp://feed/panel'],
        hasMoreSchemas: false,
      },
      {
        origin: 'baiduboxapp://other',
        count: 1,
        schemaCount: 1,
        recordCount: 1,
        schemas: ['baiduboxapp://other/detail'],
        hasMoreSchemas: false,
      },
    ]);
  });

  it('origin schema 展示截断时保留唯一 schema 总数', () => {
    const records = [
      {
        path: '$.feed',
        commandSchema: 'baiduboxapp://feed/detail',
        commandSchemaRows: [
          { schema: 'baiduboxapp://feed/panel', path: '$.feed.panel', source: 'cmd=1' },
          { schema: 'baiduboxapp://feed/tab', path: '$.feed.tab', source: 'cmd=2' },
          { schema: 'baiduboxapp://feed/landing', path: '$.feed.landing', source: 'cmd=3' },
          { schema: 'baiduboxapp://feed/profile', path: '$.feed.profile', source: 'cmd=4' },
          { schema: 'baiduboxapp://feed/panel', path: '$.feed.duplicatePanel', source: 'cmd=5' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopCommandSchemaOriginGroups(records)).toEqual([
      {
        origin: 'baiduboxapp://feed',
        count: 6,
        schemaCount: 5,
        recordCount: 1,
        schemas: [
          'baiduboxapp://feed/detail',
          'baiduboxapp://feed/panel',
          'baiduboxapp://feed/tab',
          'baiduboxapp://feed/landing',
        ],
        hasMoreSchemas: true,
      },
    ]);
  });
});

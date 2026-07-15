import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import { buildTopResourceTypeGroups } from './transformReportResourceTypeGroups';

describe('transformReportResourceTypeGroups', () => {
  it('按 occurrence 汇总资源类型并限制展示 schema 数量', () => {
    const records = [
      {
        path: '$.first',
        commandSchemaRows: [
          { schema: 'https://cdn.example.com/a.png', path: '$.first.imageUrl', source: 'a' },
          { schema: 'https://cdn.example.com/b.png', path: '$.first.icon', source: 'b' },
          { schema: 'https://cdn.example.com/a.png', path: '$.first.dupIcon', source: 'a2' },
        ],
        nestedResourceSearchFields: [
          { path: '$.first.poster', preview: 'poster', value: 'https://cdn.example.com/c.webp?token=1' },
        ],
      },
      {
        path: '$.second',
        commandSchemaRows: [
          { schema: 'https://cdn.example.com/b.png', path: '$.second.imageUrl', source: 'b2' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopResourceTypeGroups(records, 2)).toEqual([
      {
        resourceType: 'image',
        resourceTypeLabel: '图片',
        query: '资源类型:图片',
        count: 5,
        percentage: 100,
        recordCount: 2,
        schemaCount: 3,
        schemas: [
          'https://cdn.example.com/a.png',
          'https://cdn.example.com/b.png',
        ],
        hasMoreSchemas: true,
      },
    ]);
  });

  it('同数量时按资源类型标签排序', () => {
    const records = [
      {
        path: '$.assets',
        commandSchemaRows: [
          { schema: 'https://cdn.example.com/video.mp4', path: '$.assets.videoUrl', source: 'video' },
          { schema: 'https://cdn.example.com/audio.mp3', path: '$.assets.audioUrl', source: 'audio' },
          { schema: 'https://cdn.example.com/image.png', path: '$.assets.imageUrl', source: 'image' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopResourceTypeGroups(records).map(group => group.resourceTypeLabel)).toEqual([
      '图片',
      '视频',
      '音频',
    ]);
  });

  it('没有静态资源时返回空分组', () => {
    const records = [
      {
        path: '$.landing',
        commandSchema: 'sampleapp://feed/detail',
        commandSchemaRows: [
          { schema: 'https://example.com/page?from=feed', path: '$.landing.url', source: 'page' },
        ],
      },
    ] as unknown as TransformReportRecord[];

    expect(buildTopResourceTypeGroups(records)).toEqual([]);
  });
});

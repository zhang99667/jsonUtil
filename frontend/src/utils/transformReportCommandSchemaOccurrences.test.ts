import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import { collectCommandSchemaOccurrences } from './transformReportCommandSchemaOccurrences';

describe('transformReportCommandSchemaOccurrences', () => {
  it('从记录 schema、schema 行和资源字段收集导航与资源 occurrence', () => {
    const records = [{
      path: '$.record',
      commandSchema: 'baiduboxapp://feed/detail',
      commandSchemaRows: [
        { schema: 'https://cdn.example.com/a.png', path: '$.record.imageUrl' },
        { schema: '', path: '$.record.empty' },
      ],
      nestedResourceSearchFields: [
        { path: '$.record.videoUrl', preview: 'video', value: 'https://cdn.example.com/b.mp4?token=1' },
        { path: '$.record.iconUrl', preview: 'icon', sourceValue: 'https://cdn.example.com/icon.webp?x=1' },
        {
          path: '$.record.sourceFirst',
          preview: 'source first',
          value: 'https://cdn.example.com/fallback.png',
          sourceValue: 'https://cdn.example.com/source-first.mp4?x=1',
        },
      ],
    }] as unknown as TransformReportRecord[];

    expect(collectCommandSchemaOccurrences(records)).toEqual([
      {
        schema: 'baiduboxapp://feed/detail',
        path: '$.record',
        recordPath: '$.record',
        kind: 'navigation',
      },
      {
        schema: 'https://cdn.example.com/a.png',
        path: '$.record.imageUrl',
        recordPath: '$.record',
        kind: 'resource',
        resourceType: 'image',
      },
      {
        schema: 'https://cdn.example.com/b.mp4',
        path: '$.record.videoUrl',
        recordPath: '$.record',
        kind: 'resource',
        resourceType: 'video',
      },
      {
        schema: 'https://cdn.example.com/icon.webp',
        path: '$.record.iconUrl',
        recordPath: '$.record',
        kind: 'resource',
        resourceType: 'image',
      },
      {
        schema: 'https://cdn.example.com/source-first.mp4',
        path: '$.record.sourceFirst',
        recordPath: '$.record',
        kind: 'resource',
        resourceType: 'video',
      },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import { buildTransformReportNestedFieldGroups } from './transformReportNestedFieldGroups';

describe('transformReportNestedFieldGroups', () => {
  it('按叶子 key 汇总嵌套字段并保留路径截断状态', () => {
    const records = [
      {
        path: '$.first',
        nestedCommandSearchFields: [
          { path: '$.first.cmd.nid', preview: '1' },
          { path: '$.first.cmd.title', preview: '标题' },
          { path: '$.first.cmd.nid', preview: '2' },
        ],
      },
      {
        path: '$.second',
        nestedCommandSearchFields: [
          { path: '$.second.panel.nid', preview: '3' },
        ],
      },
    ] as TransformReportRecord[];

    expect(buildTransformReportNestedFieldGroups(records, {
      limit: 5,
      pathLimit: 2,
      getRows: record => record.nestedCommandSearchFields,
    })).toEqual([
      {
        key: 'nid',
        count: 3,
        recordCount: 2,
        paths: ['$.first.cmd.nid', '$.first.cmd.nid'],
        hasMorePaths: true,
      },
      {
        key: 'title',
        count: 1,
        recordCount: 1,
        paths: ['$.first.cmd.title'],
        hasMorePaths: false,
      },
    ]);
  });

  it('支持调用方选择不同的字段来源和分组上限', () => {
    const records = [
      {
        path: '$.resource',
        nestedResourceSearchFields: [
          { path: '$.resource.image.url', preview: 'https://example.com/a.png' },
          { path: '$.resource.video.url', preview: 'https://example.com/b.mp4' },
          { path: '$.resource.meta.schema', preview: 'https://example.com/schema' },
        ],
      },
    ] as TransformReportRecord[];

    expect(buildTransformReportNestedFieldGroups(records, {
      limit: 1,
      pathLimit: 3,
      getRows: record => record.nestedResourceSearchFields,
    })).toEqual([
      {
        key: 'url',
        count: 2,
        recordCount: 1,
        paths: ['$.resource.image.url', '$.resource.video.url'],
        hasMorePaths: false,
      },
    ]);
  });
});

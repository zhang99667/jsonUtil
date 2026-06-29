import { describe, expect, it } from 'vitest';
import { buildQualitySnapshotBuckets } from './transformQualityBuckets';

interface BucketSource {
  reason?: string;
  path: string;
}

describe('transformQualityBuckets', () => {
  it('按 key 聚合数量并按数量和 key 稳定排序', () => {
    const buckets = buildQualitySnapshotBuckets<BucketSource>([
      { reason: 'b', path: '$.one' },
      { reason: 'a', path: '$.two' },
      { reason: 'b', path: '$.three' },
      { reason: 'c', path: '$.four' },
      { reason: undefined, path: '$.ignored' },
    ], item => item.reason, item => item.path);

    expect(buckets).toEqual([
      { key: 'b', count: 2, paths: ['$.one', '$.three'] },
      { key: 'a', count: 1, paths: ['$.two'] },
      { key: 'c', count: 1, paths: ['$.four'] },
    ]);
  });

  it('路径去重但保留真实命中次数', () => {
    const buckets = buildQualitySnapshotBuckets<BucketSource>([
      { reason: 'same', path: '$.value' },
      { reason: 'same', path: '$.value' },
      { reason: 'same', path: '$.other' },
    ], item => item.reason, item => item.path);

    expect(buckets).toEqual([
      { key: 'same', count: 3, paths: ['$.value', '$.other'] },
    ]);
  });

  it('支持限制每组路径数和 Top 数量', () => {
    const buckets = buildQualitySnapshotBuckets<BucketSource>([
      { reason: 'top', path: '$.one' },
      { reason: 'top', path: '$.two' },
      { reason: 'top', path: '$.three' },
      { reason: 'next', path: '$.four' },
    ], item => item.reason, item => item.path, {
      pathLimit: 2,
      topLimit: 1,
    });

    expect(buckets).toEqual([
      { key: 'top', count: 3, paths: ['$.one', '$.two'] },
    ]);
  });
});

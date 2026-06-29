export interface TransformQualityBucket {
  key: string;
  count: number;
  paths: string[];
}

interface TransformQualityBucketOptions {
  topLimit?: number;
  pathLimit?: number;
}

const DEFAULT_QUALITY_BUCKET_TOP_LIMIT = 8;
const DEFAULT_QUALITY_BUCKET_PATH_LIMIT = 4;

export const buildQualitySnapshotBuckets = <T>(
  items: T[],
  getKey: (item: T) => string | undefined,
  getPath: (item: T) => string,
  options: TransformQualityBucketOptions = {}
): TransformQualityBucket[] => {
  const topLimit = options.topLimit ?? DEFAULT_QUALITY_BUCKET_TOP_LIMIT;
  const pathLimit = options.pathLimit ?? DEFAULT_QUALITY_BUCKET_PATH_LIMIT;
  const bucketMap = new Map<string, { count: number; paths: string[] }>();

  items.forEach(item => {
    const key = getKey(item);
    if (!key) return;

    const bucket = bucketMap.get(key) || { count: 0, paths: [] };
    bucket.count++;
    const path = getPath(item);
    if (bucket.paths.length < pathLimit && !bucket.paths.includes(path)) {
      bucket.paths.push(path);
    }
    bucketMap.set(key, bucket);
  });

  return Array.from(bucketMap.entries())
    .map(([key, bucket]) => ({ key, count: bucket.count, paths: bucket.paths }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, topLimit);
};

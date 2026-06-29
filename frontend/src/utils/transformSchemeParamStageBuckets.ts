import type {
  TransformSchemeParamStageSummary,
  TransformSchemeParamStageSummaryBucket,
} from '../types';

export interface TransformSchemeParamStageQualityBucket {
  key: string;
  count: number;
  paths: string[];
}

export const SCHEME_PARAM_STAGE_TOP_LIMIT = 8;
const SCHEME_PARAM_STAGE_PATH_LIMIT = 4;

export const addSchemeParamStageBuckets = (
  target: Map<string, number>,
  buckets: TransformSchemeParamStageSummaryBucket[]
) => {
  buckets.forEach(bucket => {
    target.set(bucket.key, (target.get(bucket.key) || 0) + bucket.count);
  });
};

export const buildSchemeParamStageBucketsFromMap = (
  bucketMap: Map<string, number>
): TransformSchemeParamStageSummaryBucket[] => (
  Array.from(bucketMap.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, SCHEME_PARAM_STAGE_TOP_LIMIT)
);

export const buildSchemeParamStageQualityBuckets = (
  records: Array<{
    path: string;
    schemeParamStageSummary?: TransformSchemeParamStageSummary;
  }>,
  getBuckets: (summary: TransformSchemeParamStageSummary) => TransformSchemeParamStageSummaryBucket[]
): TransformSchemeParamStageQualityBucket[] => {
  const bucketMap = new Map<string, { count: number; paths: string[] }>();

  records.forEach(record => {
    const summary = record.schemeParamStageSummary;
    if (!summary) return;

    getBuckets(summary).forEach(summaryBucket => {
      const bucket = bucketMap.get(summaryBucket.key) || { count: 0, paths: [] };
      bucket.count += summaryBucket.count;
      if (bucket.paths.length < SCHEME_PARAM_STAGE_PATH_LIMIT && !bucket.paths.includes(record.path)) {
        bucket.paths.push(record.path);
      }
      bucketMap.set(summaryBucket.key, bucket);
    });
  });

  return Array.from(bucketMap.entries())
    .map(([key, bucket]) => ({ key, count: bucket.count, paths: bucket.paths }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, SCHEME_PARAM_STAGE_TOP_LIMIT);
};

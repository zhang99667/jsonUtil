import type {
  PathTransformRecord,
  TransformSchemeParamStageSummary,
} from '../types';
import {
  SCHEME_PARAM_STAGE_TOP_LIMIT,
  addSchemeParamStageBuckets,
  buildSchemeParamStageBucketsFromMap,
} from './transformSchemeParamStageBuckets';

export { getTransformStepLabel } from './transformStepLabels';
export {
  buildSchemeParamStageQualityBuckets,
  type TransformSchemeParamStageQualityBucket,
} from './transformSchemeParamStageBuckets';
export { getSchemeParamStageSearchText } from './transformSchemeParamStageSearch';

export interface TransformSchemeParamStageRecord {
  path: string;
  schemeParamStageSummary?: TransformSchemeParamStageSummary;
}

export const getRecordSchemeParamStageSummary = (
  record: Pick<PathTransformRecord, 'steps'>
): TransformSchemeParamStageSummary | undefined => {
  const summaries = record.steps
    .map(step => step.schemeParamStageSummary)
    .filter((summary): summary is TransformSchemeParamStageSummary => Boolean(summary));
  if (summaries.length === 0) return undefined;

  const sources = new Map<string, number>();
  const keys = new Map<string, number>();
  const repairHintLabels = new Map<string, number>();
  const samples: TransformSchemeParamStageSummary['samples'] = [];

  summaries.forEach(summary => {
    addSchemeParamStageBuckets(sources, summary.sources);
    addSchemeParamStageBuckets(keys, summary.keys);
    addSchemeParamStageBuckets(repairHintLabels, summary.repairHintLabels);
    if (samples.length < SCHEME_PARAM_STAGE_TOP_LIMIT) {
      samples.push(...summary.samples.slice(0, SCHEME_PARAM_STAGE_TOP_LIMIT - samples.length));
    }
  });

  return {
    total: summaries.reduce((count, summary) => count + summary.total, 0),
    repairHints: summaries.reduce((count, summary) => count + summary.repairHints, 0),
    nonReversible: summaries.reduce((count, summary) => count + summary.nonReversible, 0),
    sources: buildSchemeParamStageBucketsFromMap(sources),
    keys: buildSchemeParamStageBucketsFromMap(keys),
    repairHintLabels: buildSchemeParamStageBucketsFromMap(repairHintLabels),
    samples,
  };
};

export const sumSchemeParamStageCount = (records: TransformSchemeParamStageRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.total || 0), 0)
);

export const sumSchemeParamStageRepairHintCount = (records: TransformSchemeParamStageRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.repairHints || 0), 0)
);

export const sumNonReversibleParamStageCount = (records: TransformSchemeParamStageRecord[]): number => (
  records.reduce((count, record) => count + (record.schemeParamStageSummary?.nonReversible || 0), 0)
);

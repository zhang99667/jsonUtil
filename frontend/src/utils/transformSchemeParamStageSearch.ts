import type { TransformSchemeParamStageSummary } from '../types';

export const getSchemeParamStageSearchText = (
  summary: TransformSchemeParamStageSummary | undefined
): string => {
  if (!summary) return '';

  return [
    '参数层',
    'param stage',
    ...summary.sources.map(bucket => bucket.key),
    ...summary.keys.map(bucket => bucket.key),
    ...summary.repairHintLabels.map(bucket => bucket.key),
    ...summary.samples.flatMap(sample => [
      sample.path,
      sample.key,
      sample.source,
      sample.repairHint || '',
      sample.reversible ? '可回写' : '不可回写',
    ]),
  ].filter(Boolean).join(' ');
};

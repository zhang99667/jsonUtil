import type { TransformQualitySnapshot } from './transformSummary';

type TransformQualitySnapshotMetricKey = keyof TransformQualitySnapshot['totals'];

const QUALITY_DELTA_METRICS: Array<{
  key: TransformQualitySnapshotMetricKey;
  label: string;
}> = [
  { key: 'records', label: '展开记录' },
  { key: 'cmdStructures', label: 'CMD结构' },
  { key: 'nestedCommandFields', label: '内部CMD字段' },
  { key: 'nestedResourceFields', label: '资源字段' },
  { key: 'runtimePlaceholders', label: '占位符' },
  { key: 'schemeParamStages', label: '参数层' },
  { key: 'schemeParamStageRepairHints', label: '参数修复' },
  { key: 'nonReversibleParamStages', label: '参数不可回写' },
  { key: 'unresolved', label: '待检查' },
  { key: 'warnings', label: '跳过' },
];

const formatMetricDelta = (before: number, after: number): string => {
  const delta = after - before;
  if (delta === 0) return `${before} -> ${after}`;

  return `${before} -> ${after} (${delta > 0 ? '+' : ''}${delta})`;
};

export const formatTransformQualitySnapshotDeltaText = (
  beforeSnapshot: TransformQualitySnapshot,
  afterSnapshot: TransformQualitySnapshot
): string => {
  const lines = [
    '深度解析质量对比',
    `覆盖率: ${beforeSnapshot.coverage.score} -> ${afterSnapshot.coverage.score} (${afterSnapshot.coverage.level})`,
    '指标变化:',
  ];

  QUALITY_DELTA_METRICS.forEach(metric => {
    lines.push(`- ${metric.label}: ${formatMetricDelta(
      beforeSnapshot.totals[metric.key],
      afterSnapshot.totals[metric.key]
    )}`);
  });

  const beforeLeadSchema = beforeSnapshot.hotspots.topCommandSchemas[0]?.schema || '(无)';
  const afterLeadSchema = afterSnapshot.hotspots.topCommandSchemas[0]?.schema || '(无)';
  lines.push(`Top CMD Schema: ${beforeLeadSchema} -> ${afterLeadSchema}`);

  if (afterSnapshot.recommendations.length > 0) {
    lines.push('应用后建议:');
    afterSnapshot.recommendations.forEach(recommendation => {
      lines.push(`- ${recommendation}`);
    });
  }

  return lines.join('\n');
};

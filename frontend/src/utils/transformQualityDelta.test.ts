import { describe, expect, it } from 'vitest';
import { APP_VERSION_METADATA } from './appVersion';
import type { TransformQualitySnapshot } from './transformSummary';
import { formatTransformQualitySnapshotDeltaText } from './transformQualityDelta';

const buildSnapshot = (
  overrides: Partial<TransformQualitySnapshot['totals']>,
  recommendations: string[] = []
): TransformQualitySnapshot => ({
  schemaVersion: 1,
  kind: 'json-helper-transform-quality-snapshot',
  tool: APP_VERSION_METADATA,
  filter: '全部',
  coverage: {
    score: 100,
    label: '解析覆盖 100%',
    level: 'success',
    description: 'ok',
    items: [],
  },
  totals: {
    records: 1,
    cmdStructures: 0,
    nestedCommandFields: 0,
    nestedResourceFields: 0,
    runtimePlaceholders: 1,
    schemeParamStages: 0,
    schemeParamStageRepairHints: 0,
    nonReversibleParamStages: 0,
    unresolved: 0,
    warnings: 0,
    ...overrides,
  },
  filtered: {
    records: 1,
    cmdStructures: 0,
    nestedCommandFields: 0,
    nestedResourceFields: 0,
    runtimePlaceholders: 0,
    schemeParamStages: 0,
    schemeParamStageRepairHints: 0,
    nonReversibleParamStages: 0,
    unresolved: 0,
    warnings: 0,
  },
  hotspots: {
    topCommandSchemas: [],
    topCommandSchemaOrigins: [],
    topResourceSchemas: [],
    topResourceTypes: [],
    topNestedCommandFields: [],
    topNestedResourceFields: [],
    unresolvedReasons: [],
    warningReasons: [],
    warningTypes: [],
    runtimePlaceholders: [],
    schemeParamStageSources: [],
    schemeParamStageKeys: [],
    schemeParamStageRepairHints: [],
  },
  truncation: {
    records: false,
    cmdStructures: false,
    runtimePlaceholders: false,
    unresolved: false,
    warnings: false,
  },
  recommendations,
});

describe('transformQualityDelta', () => {
  it('格式化质量快照关键指标变化', () => {
    const beforeSnapshot = buildSnapshot({
      cmdStructures: 0,
      runtimePlaceholders: 1,
    });
    const afterSnapshot = buildSnapshot({
      cmdStructures: 1,
      runtimePlaceholders: 0,
    }, ['继续对比 cmdHandler']);
    afterSnapshot.hotspots.topCommandSchemas = [{
      schema: 'sampleapp://v1/open',
      count: 1,
      recordCount: 1,
      paths: ['$.cmd'],
      hasMorePaths: false,
    }];

    const deltaText = formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot);

    expect(deltaText).toContain('深度解析质量对比');
    expect(deltaText).toContain('CMD结构: 0 -> 1 (+1)');
    expect(deltaText).toContain('占位符: 1 -> 0 (-1)');
    expect(deltaText).toContain('Top CMD Schema: (无) -> sampleapp://v1/open');
    expect(deltaText).toContain('- 继续对比 cmdHandler');
  });
});

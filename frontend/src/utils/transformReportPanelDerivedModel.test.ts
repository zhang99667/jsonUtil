import { describe, expect, it } from 'vitest';
import type {
  TransformContextReport,
  TransformReportRecord,
} from './transformSummary';
import {
  buildTransformReportPanelDerivedModel,
  type TransformReportPanelDerivedModelInput,
} from './transformReportPanelDerivedModel';
import { createTransformReportView } from './transformReportViewTestFixture';

const createReport = (): TransformContextReport => ({
  coverage: {
    score: 100,
    level: 'excellent',
    label: '优秀',
    details: [],
  },
  records: [],
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  topCommandSchemas: [],
  topCommandSchemaOrigins: [],
  topResourceSchemas: [],
  topResourceTypes: [],
  topNestedCommandFields: [],
  topNestedResourceFields: [],
} as unknown as TransformContextReport);

const createInput = (
  overrides: Partial<TransformReportPanelDerivedModelInput> = {}
): TransformReportPanelDerivedModelInput => ({
  report: null,
  reportView: null,
  fullReportView: null,
  deferredQuery: '',
  isFilterPending: false,
  qualityBaseline: null,
  hasActiveContext: false,
  ...overrides,
});

const pathRecord = (path: string): TransformReportRecord => ({
  path,
  decodedPaths: [{ path, preview: 'value' }],
} as unknown as TransformReportRecord);

describe('transformReportPanelDerivedModel', () => {
  it('组合无报告空态和完整报告标题', () => {
    const model = buildTransformReportPanelDerivedModel(createInput({
      deferredQuery: 'cmd',
      isFilterPending: true,
      hasActiveContext: true,
    }));

    expect(model.hasReportView).toBe(false);
    expect(model.issueSampleCopyText).toBe('');
    expect(model.placeholderFillTemplateJsonText).toBe('');
    expect(model.copyTitles.filteredReport).toBe('筛选结果仍在更新，请稍后复制');
    expect(model.copyTitles.fullReport).toBe('复制完整深度解析报告');
  });

  it('集中派生复制可用性和占位符数据', () => {
    const model = buildTransformReportPanelDerivedModel(createInput({
      report: createReport(),
      reportView: createTransformReportView({
        records: [pathRecord('$.a')],
        filteredCmdStructureCount: 1,
        cmdStructureRecords: [{ cmdStructureFocusPaths: ['$.cmd'] } as TransformReportRecord],
      }),
      fullReportView: createTransformReportView(),
    }));

    expect(model.hasReportView).toBe(true);
    expect(model.hasPathValueCopyItems).toBe(true);
    expect(model.hasCmdStructureCopyItems).toBe(true);
    expect(model.hasFocusedCmdStructureCopyItems).toBe(true);
    expect(model.copyTitles.cmdStructures).toBe('复制按当前筛选聚焦后的 cmdHandler 风格 CMD 结构');
    expect(model.placeholderFillTemplateJsonText).toBe('');
  });

  it('保留质量基线 delta 对复制标题的影响', () => {
    const baselineState = buildTransformReportPanelDerivedModel(createInput({
      report: createReport(),
      reportView: createTransformReportView(),
    }));
    const model = buildTransformReportPanelDerivedModel(createInput({
      report: createReport(),
      reportView: createTransformReportView({
        filteredCmdStructureCount: 1,
        totalCmdStructureCount: 1,
      }),
      deferredQuery: 'CMD结构',
      qualityBaseline: { snapshot: baselineState.qualitySnapshot!, filter: '' },
    }));

    expect(model.qualityBaselineDeltaText).toContain('CMD结构: 0 -> 1 (+1)');
    expect(model.copyTitles.qualityBaseline).toBe('复制当前质量快照与临时基线的指标变化');
  });
});

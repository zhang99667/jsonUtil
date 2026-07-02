import { describe, expect, it } from 'vitest';
import type {
  TransformContextReport,
  TransformReportRecord,
} from './transformSummary';
import {
  buildTransformReportPanelCopyAvailability,
  buildTransformReportPanelIssueCopyTexts,
  buildTransformReportPanelPlaceholderFillState,
  buildTransformReportPanelQualityState,
} from './transformReportPanelDerivedValues';
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

const pathRecord = (path: string): TransformReportRecord => ({
  path,
  decodedPaths: [{ path, preview: 'value' }],
} as unknown as TransformReportRecord);

describe('transformReportPanelDerivedValues', () => {
  it('集中判断复制入口是否可用', () => {
    expect(buildTransformReportPanelCopyAvailability(null)).toEqual({
      hasPathValueCopyItems: false,
      hasCmdStructureCopyItems: false,
      hasFocusedCmdStructureCopyItems: false,
    });

    expect(buildTransformReportPanelCopyAvailability(createTransformReportView({
      records: [pathRecord('$.a')],
      filteredCmdStructureCount: 1,
      cmdStructureRecords: [{ cmdStructureFocusPaths: ['$.cmd'] } as TransformReportRecord],
    }))).toEqual({
      hasPathValueCopyItems: true,
      hasCmdStructureCopyItems: true,
      hasFocusedCmdStructureCopyItems: true,
    });
  });

  it('无报告视图时返回空复制文本和空占位符模板状态', () => {
    expect(buildTransformReportPanelIssueCopyTexts(null, 'cmd')).toEqual({
      issueSampleCopyText: '',
      issueSampleJsonCopyText: '',
      redactedIssueSampleJsonCopyText: '',
      issueRegressionTemplateCopyText: '',
    });
    expect(buildTransformReportPanelPlaceholderFillState(null, null, 'cmd')).toEqual({
      placeholderFillTemplate: null,
      placeholderFillTemplateSummary: null,
      placeholderFillTemplateJsonText: '',
    });
  });

  it('组合质量快照和基线 delta 文本', () => {
    const baselineState = buildTransformReportPanelQualityState(
      createReport(),
      createTransformReportView(),
      '',
      null
    );
    const qualityState = buildTransformReportPanelQualityState(
      createReport(),
      createTransformReportView({
        filteredCmdStructureCount: 1,
        totalCmdStructureCount: 1,
      }),
      'CMD结构',
      { snapshot: baselineState.qualitySnapshot!, filter: '' }
    );

    expect(qualityState.qualitySnapshot?.filter).toBe('CMD结构');
    expect(qualityState.qualityBaselineDeltaText).toContain('CMD结构: 0 -> 1 (+1)');
  });
});

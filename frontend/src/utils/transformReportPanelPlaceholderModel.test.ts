import { describe, expect, it } from 'vitest';
import type { TransformReportView } from './transformSummary';
import { buildTransformReportPanelPlaceholderModel } from './transformReportPanelPlaceholderModel';

const createView = (): TransformReportView => ({
  filteredPlaceholderCount: 2,
  isPlaceholderTruncated: true,
} as unknown as TransformReportView);

describe('buildTransformReportPanelPlaceholderModel', () => {
  it('组合占位符回填入口和工具栏状态', () => {
    const model = buildTransformReportPanelPlaceholderModel({
      reportView: createView(),
      isFilterPending: false,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: true,
      placeholderFillTemplateSummary: {
        total: 3,
        filled: 1,
        suggested: 1,
        pending: 2,
      },
    });

    expect(model).toMatchObject({
      placeholderFillPanelTitle: '把运行时占位符回填模板填入模板填充面板（已预填 1/3，候选 1，待补 2）',
      canOpenPlaceholderFill: true,
      placeholderToolbarState: {
        filteredPlaceholderCount: 2,
        isPlaceholderTruncated: true,
        canShowOpenTemplateFill: true,
        isPlaceholderFillTemplateDisabled: false,
        openTemplateFillTitle: '把当前筛选下的运行时占位符回填模板填入模板填充面板（已预填 1/3，候选 1，待补 2）',
      },
    });
  });

  it('缺少报告视图或筛选未完成时关闭回填入口', () => {
    const model = buildTransformReportPanelPlaceholderModel({
      reportView: null,
      isFilterPending: true,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: true,
      placeholderFillTemplateSummary: null,
    });

    expect(model).toMatchObject({
      canOpenPlaceholderFill: false,
      placeholderToolbarState: null,
    });
  });
});

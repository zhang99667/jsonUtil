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
      formatPlaceholderFillTitle: title => `ready:${title}`,
    });

    expect(model).toMatchObject({
      placeholderFillPanelTitle: 'ready:把运行时占位符回填模板填入模板填充面板',
      canOpenPlaceholderFill: true,
      placeholderToolbarState: {
        filteredPlaceholderCount: 2,
        isPlaceholderTruncated: true,
        canShowOpenTemplateFill: true,
        isPlaceholderFillTemplateDisabled: false,
        openTemplateFillTitle: 'ready:把当前筛选下的运行时占位符回填模板填入模板填充面板',
      },
    });
  });

  it('缺少报告视图或筛选未完成时关闭回填入口', () => {
    const model = buildTransformReportPanelPlaceholderModel({
      reportView: null,
      isFilterPending: true,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: true,
      formatPlaceholderFillTitle: title => title,
    });

    expect(model).toMatchObject({
      canOpenPlaceholderFill: false,
      placeholderToolbarState: null,
    });
  });
});

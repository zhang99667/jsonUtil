import { describe, expect, it, vi } from 'vitest';
import { buildTransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';

describe('transformReportPlaceholderToolbarState', () => {
  it('占位符回填模板可用时生成可点击工具栏状态', () => {
    const formatTemplateFillTitle = vi.fn((readyTitle: string) => `ready:${readyTitle}`);

    const state = buildTransformReportPlaceholderToolbarState({
      filteredPlaceholderCount: 3,
      isPlaceholderTruncated: true,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: true,
      isFilterPending: false,
      formatTemplateFillTitle,
    });

    expect(state).toEqual({
      filteredPlaceholderCount: 3,
      isPlaceholderTruncated: true,
      canShowOpenTemplateFill: true,
      isPlaceholderFillTemplateDisabled: false,
      isCopyPlaceholderReportDisabled: false,
      openTemplateFillTitle: 'ready:把当前筛选下的运行时占位符回填模板填入模板填充面板',
      copyTemplateTitle: 'ready:复制当前筛选下的运行时占位符回填模板',
      copyPlaceholderReportTitle: '复制当前筛选下的运行时占位符摘要',
    });
    expect(formatTemplateFillTitle).toHaveBeenCalledTimes(2);
  });

  it('筛选仍在更新时禁用复制并切换 pending title', () => {
    const state = buildTransformReportPlaceholderToolbarState({
      filteredPlaceholderCount: 1,
      isPlaceholderTruncated: false,
      hasTemplateFillTarget: false,
      hasPlaceholderFillTemplate: true,
      isFilterPending: true,
      formatTemplateFillTitle: readyTitle => readyTitle,
    });

    expect(state.canShowOpenTemplateFill).toBe(false);
    expect(state.isPlaceholderFillTemplateDisabled).toBe(true);
    expect(state.isCopyPlaceholderReportDisabled).toBe(true);
    expect(state.copyPlaceholderReportTitle).toBe('筛选结果仍在更新，请稍后复制占位符摘要');
  });

  it('没有回填模板时只禁用模板相关入口', () => {
    const state = buildTransformReportPlaceholderToolbarState({
      filteredPlaceholderCount: 2,
      isPlaceholderTruncated: false,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: false,
      isFilterPending: false,
      formatTemplateFillTitle: readyTitle => `blocked:${readyTitle}`,
    });

    expect(state.canShowOpenTemplateFill).toBe(true);
    expect(state.isPlaceholderFillTemplateDisabled).toBe(true);
    expect(state.isCopyPlaceholderReportDisabled).toBe(false);
    expect(state.copyTemplateTitle).toBe('blocked:复制当前筛选下的运行时占位符回填模板');
  });
});

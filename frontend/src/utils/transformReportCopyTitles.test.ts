import { describe, expect, it } from 'vitest';
import {
  buildTransformReportCopyTitles,
  getTransformPlaceholderFillTemplateTitle,
  type TransformReportCopyTitleState,
} from './transformReportCopyTitles';

const buildState = (
  overrides: Partial<TransformReportCopyTitleState> = {}
): TransformReportCopyTitleState => ({
  hasReportView: true,
  isFilterPending: false,
  hasFilteredReport: true,
  hasQualityBaselineDeltaText: true,
  hasPathValueCopyItems: true,
  hasCmdStructureCopyItems: true,
  hasFocusedCmdStructureCopyItems: false,
  hasIssueSampleCopyText: true,
  hasIssueSampleJsonCopyText: true,
  hasRedactedIssueSampleJsonCopyText: true,
  hasIssueRegressionTemplateCopyText: true,
  hasActiveContext: true,
  ...overrides,
});

describe('transformReportCopyTitles', () => {
  it('生成报告复制入口的 ready 标题', () => {
    const titles = buildTransformReportCopyTitles(buildState());

    expect(titles.filteredReport).toBe('复制当前筛选命中的深度解析记录');
    expect(titles.cmdStructures).toBe('复制当前展示的 cmdHandler 风格 CMD 结构');
    expect(titles.fullReport).toBe('复制完整深度解析报告');
  });

  it('统一处理筛选更新中和无报告状态', () => {
    expect(buildTransformReportCopyTitles(buildState({ isFilterPending: true })).archivePackage)
      .toBe('筛选结果仍在更新，请稍后复制');
    expect(buildTransformReportCopyTitles(buildState({ hasReportView: false })).diagnosticSummary)
      .toBe('暂无深度解析报告可复制');
  });

  it('生成不可复制状态和聚焦 CMD 标题', () => {
    const titles = buildTransformReportCopyTitles(buildState({
      hasPathValueCopyItems: false,
      hasFocusedCmdStructureCopyItems: true,
      hasIssueRegressionTemplateCopyText: false,
      hasActiveContext: false,
    }));

    expect(titles.pathValues).toBe('当前筛选没有可复制的路径和值');
    expect(titles.cmdStructures).toBe('复制按当前筛选聚焦后的 cmdHandler 风格 CMD 结构');
    expect(titles.issueRegressionTemplate).toBe('当前筛选没有可生成回归模板的问题样本');
    expect(titles.fullReport).toBe('暂无深度解析报告可复制');
  });

  it('生成占位符回填模板标题', () => {
    expect(getTransformPlaceholderFillTemplateTitle('打开模板回填', true, {
      total: 3,
      filled: 1,
      suggested: 1,
      pending: 2,
    }, false)).toBe('打开模板回填（已预填 1/3，候选 1，待补 2）');
    expect(getTransformPlaceholderFillTemplateTitle('打开模板回填', false, null, false))
      .toBe('当前筛选没有可用的运行时占位符回填模板');
  });
});

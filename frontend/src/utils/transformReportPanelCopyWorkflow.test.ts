import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import {
  activeContext,
  actualCandidate,
  buildWorkflow,
  getCmdComparisonMocks,
  getCopyMetricsMocks,
  getTransformSummaryMocks,
  guardedReportViewActionNames,
  qualitySnapshot,
  report,
  reportView,
} from './transformReportPanelCopyWorkflowTestFixture';

const transformSummary = getTransformSummaryMocks();
const copyMetrics = getCopyMetricsMocks();
const cmdComparison = getCmdComparisonMocks();

describe('transformReportPanelCopyWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('筛选结果仍在更新时跳过依赖 reportView 的复制动作', async () => {
    for (const actionName of guardedReportViewActionNames) {
      const { effects, workflow } = buildWorkflow({ isFilterPending: true });
      await workflow[actionName]();
      expect(effects.copyText).not.toHaveBeenCalled();
      expect(effects.showSuccess).not.toHaveBeenCalled();
    }

    expect(transformSummary.formatTransformReportViewText).not.toHaveBeenCalled();
  });

  it('完整报告在 pending 时仍可复制', async () => {
    const { effects, workflow } = buildWorkflow({ isFilterPending: true });

    await workflow.copyReport();

    expect(transformSummary.formatTransformContextReportText).toHaveBeenCalledWith(activeContext);
    expect(effects.copyText).toHaveBeenCalledWith('full-report-text');
  });

  it('复制归档包和协作报告时注入当前 CMD 对比文本', async () => {
    const { effects, workflow } = buildWorkflow();

    await workflow.copyArchivePackage();
    await workflow.copyCollaborationReport();

    expect(transformSummary.formatTransformArchivePackageJsonText).toHaveBeenCalledWith(report, reportView, 'CMD 参数', {
      cmdComparisonReportText: 'active-cmd-diff',
      cmdComparisonCandidateText: 'active-cmd-candidate',
    });
    expect(transformSummary.formatTransformCollaborationReportText).toHaveBeenCalledWith(report, reportView, 'CMD 参数', {
      cmdComparisonReportText: 'active-cmd-diff',
      cmdComparisonCandidateText: 'active-cmd-candidate',
    });
    expect(effects.copyText).toHaveBeenCalledWith('archive-text');
    expect(effects.copyText).toHaveBeenCalledWith('collaboration-text');
    expect(copyMetrics.formatCopySuccessMessage).toHaveBeenCalledWith('归档包', 'archive-text');
    expect(effects.showSuccess).toHaveBeenCalledWith('归档包:12', { duration: 2000 });
  });

  it('质量基线保存空筛选时使用全部并支持清除', () => {
    const { effects, workflow } = buildWorkflow({ deferredQuery: '   ' });

    workflow.setQualityBaseline();
    workflow.clearQualityBaseline();

    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(1, {
      snapshot: qualitySnapshot,
      filter: '全部',
    });
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(1, '已设为临时质量基线', { duration: 1600 });
    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(2, null);
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(2, '临时质量基线已清除', { duration: 1600 });
  });

  it('占位符模板打开受模板、pending 和目标面板保护', () => {
    const missingTemplate = buildWorkflow({ placeholderFillTemplateJsonText: '' });
    missingTemplate.workflow.openPlaceholderFillTemplate();

    const pending = buildWorkflow({ isFilterPending: true });
    pending.workflow.openPlaceholderFillTemplate();

    const missingTarget = buildWorkflow({}, { openTemplateFill: undefined });
    missingTarget.workflow.openPlaceholderFillTemplate();

    const ready = buildWorkflow();
    ready.workflow.openPlaceholderFillTemplate();

    expect(missingTemplate.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(pending.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(missingTarget.effects.showStatusSuccess).not.toHaveBeenCalled();
    expect(ready.effects.openTemplateFill).toHaveBeenCalledWith('{"placeholders":{}}');
    expect(ready.effects.showStatusSuccess).toHaveBeenCalledWith('已填入模板填充', { duration: 1600 });
  });

  it('行级复制保留 1600ms 提示时长', async () => {
    const { effects, workflow } = buildWorkflow();

    await workflow.copyPath('$.data[0]', '已复制自定义路径');

    expect(effects.copyText).toHaveBeenCalledWith('$.data[0]');
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制自定义路径', { duration: 1600 });
  });

  it('CMD 差异复制透传 expected、忽略额外路径和候选结构', async () => {
    const record = { path: '$.cmd' } as unknown as TransformReportRecord;
    const { effects, workflow } = buildWorkflow();

    await workflow.copyCmdComparisonDiff(record);

    expect(cmdComparison.buildCmdComparisonReportText).toHaveBeenCalledWith(
      record,
      'expected-cmd',
      true,
      actualCandidate
    );
    expect(effects.copyText).toHaveBeenCalledWith('cmd-diff-text');
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制 CMD 差异报告', { duration: 1600 });
  });

  it('CMD 对比包为空文本时沿用复制 runner 的静默跳过', async () => {
    vi.mocked(transformSummary.formatTransformCmdStructureComparisonPackageText).mockReturnValueOnce('');
    const { effects, workflow } = buildWorkflow();

    await workflow.copyCmdComparisonPackage({ path: '$.cmd' } as unknown as TransformReportRecord);

    expect(effects.copyText).not.toHaveBeenCalled();
    expect(effects.showSuccess).not.toHaveBeenCalled();
  });
});

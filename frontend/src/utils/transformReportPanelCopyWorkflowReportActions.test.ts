import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildWorkflow,
} from './transformReportPanelCopyWorkflowTestFixture';
import {
  report,
  reportView,
} from './transformReportPanelCopyWorkflowTestData';
import {
  getCopyMetricsMocks,
  getTransformSummaryMocks,
} from './transformReportPanelCopyWorkflowTestMocks';

const transformSummary = getTransformSummaryMocks();
const copyMetrics = getCopyMetricsMocks();

describe('transformReportPanelCopyWorkflow report actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('报告级复制动作复用统一成功文案和筛选上下文', async () => {
    const { workflow } = buildWorkflow();

    await workflow.copyDiagnosticSummary();
    await workflow.copyQualitySnapshot();
    await workflow.copyTroubleshootingRecipe();

    expect(transformSummary.formatTransformDiagnosticSummaryText).toHaveBeenCalledWith(report, reportView, 'CMD 参数');
    expect(transformSummary.formatTransformQualitySnapshotJsonText).toHaveBeenCalledWith(report, reportView, 'CMD 参数');
    expect(transformSummary.formatTransformTroubleshootingRecipeJsonText).toHaveBeenCalledWith(report, reportView, 'CMD 参数');
    expect(copyMetrics.formatCopySuccessMessage).toHaveBeenCalledWith('诊断摘要', 'diagnostic-text');
    expect(copyMetrics.formatCopySuccessMessage).toHaveBeenCalledWith('质量快照', 'quality-snapshot-text');
    expect(copyMetrics.formatCopySuccessMessage).toHaveBeenCalledWith('排查 recipe', 'recipe-text');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activeContext,
  buildWorkflow,
  getTransformSummaryMocks,
  guardedReportViewActionNames,
} from './transformReportPanelCopyWorkflowTestFixture';

const transformSummary = getTransformSummaryMocks();

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
});

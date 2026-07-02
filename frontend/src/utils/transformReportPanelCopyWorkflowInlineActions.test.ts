import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import {
  actualCandidate,
  buildWorkflow,
  getCmdComparisonMocks,
  getTransformSummaryMocks,
} from './transformReportPanelCopyWorkflowTestFixture';

const cmdComparison = getCmdComparisonMocks();
const transformSummary = getTransformSummaryMocks();

describe('transformReportPanelCopyWorkflow inline actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

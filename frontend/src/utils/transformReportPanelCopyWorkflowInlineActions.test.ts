import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import {
  buildWorkflow,
} from './transformReportPanelCopyWorkflowTestFixture';
import { actualCandidate } from './transformReportPanelCopyWorkflowTestData';
import {
  getCmdComparisonMocks,
  getTransformSummaryMocks,
} from './transformReportPanelCopyWorkflowTestMocks';

const cmdComparison = getCmdComparisonMocks();
const transformSummary = getTransformSummaryMocks();
const cmdRecord = { path: '$.cmd' } as unknown as TransformReportRecord;

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

  it('路径复制失败透出路径错误日志', async () => {
    const failure = new Error('copy failed');
    const { effects, workflow } = buildWorkflow({}, { copyText: vi.fn(async () => { throw failure; }) });

    await workflow.copyPath('$.data[0]');

    expect(effects.showError).toHaveBeenCalledWith('复制深度解析路径失败:', failure);
  });

  it('CMD 差异复制透传 expected、忽略额外路径和候选结构', async () => {
    const { effects, workflow } = buildWorkflow();

    await workflow.copyCmdComparisonDiff(cmdRecord);

    expect(cmdComparison.buildCmdComparisonReportText).toHaveBeenCalledWith(
      cmdRecord,
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

    await workflow.copyCmdComparisonPackage(cmdRecord);

    expect(effects.copyText).not.toHaveBeenCalled();
    expect(effects.showSuccess).not.toHaveBeenCalled();
  });
});

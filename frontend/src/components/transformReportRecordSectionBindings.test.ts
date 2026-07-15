import toast from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';
import type { RankedCmdComparisonCandidate } from '../utils/transformReportCmdComparison';
import { buildBindings, buildCopyWorkflow, record } from './transformReportRecordSectionBindingsTestFixture';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

describe('buildTransformReportRecordSectionBindings', () => {
  it('打开首个 CMD 对比时设置筛选词并清空当前候选', () => {
    const { bindings, cmdStateSpy, queryStateSpy } = buildBindings({
      cmdComparisonState: {
        recordPath: '$.old',
        expectedText: '{"old":true}',
        ignoreExtraPaths: true,
        actualCandidate: {
          id: '$.candidate',
          label: '$.candidate',
          sourceLabel: 'SOURCE',
          actual: {},
          recordPath: '$.old',
        },
      },
    });

    bindings.openFirstCmdComparison();

    expect(queryStateSpy.getState()).toBe('CMD结构');
    expect(cmdStateSpy.getState()).toMatchObject({
      recordPath: '$.cmd',
      expectedText: '',
      ignoreExtraPaths: true,
      actualCandidate: null,
    });
  });

  it('切换 CMD actual 候选时同步筛选词和 actualCandidate', () => {
    const { bindings, cmdStateSpy, queryStateSpy } = buildBindings();
    const candidate = {
      id: '$.cmd.inner',
      label: '$.cmd.inner',
      sourceLabel: 'SOURCE[1]',
      commandSchema: 'sampleapp://v1/open',
      actual: { result: { cmdSchema: 'sampleapp://v1/open', cmdParams: {} } },
      recordPath: '$.cmd',
      diff: { hasDifferences: false },
      score: 0,
      isExactMatch: true,
    } as unknown as RankedCmdComparisonCandidate;

    bindings.recordActions.onSwitchCmdComparisonCandidate(candidate);

    expect(queryStateSpy.getState()).toBe('$.cmd');
    expect(cmdStateSpy.getState()).toMatchObject({
      recordPath: '$.cmd',
      actualCandidate: {
        id: '$.cmd.inner',
        recordPath: '$.cmd',
        commandSchema: 'sampleapp://v1/open',
      },
    });
  });

  it('透传复制 workflow 并维护 CMD 对比基础状态', () => {
    const copyWorkflow = buildCopyWorkflow();
    const { bindings, cmdStateSpy } = buildBindings({ copyWorkflow });

    bindings.recordActions.onCopyPath('$.cmd');
    bindings.recordActions.onCopyOriginalValue('raw');
    bindings.recordActions.onCopyDecodedPathValue('decoded');
    bindings.recordActions.onCopyCmdStructure(record);
    bindings.recordActions.onCopyCmdComparisonPackage(record);
    bindings.recordActions.onCopyCmdComparisonDiff(record);
    bindings.recordActions.onToggleCmdComparison(record);
    bindings.recordActions.onCmdComparisonExpectedTextChange('{"result":{}}');
    bindings.recordActions.onCmdComparisonIgnoreExtraPathsChange(true);

    expect(copyWorkflow.copyPath).toHaveBeenCalledWith('$.cmd');
    expect(copyWorkflow.copyOriginalValue).toHaveBeenCalledWith('raw');
    expect(copyWorkflow.copyDecodedPathValue).toHaveBeenCalledWith('decoded');
    expect(copyWorkflow.copyCmdStructure).toHaveBeenCalledWith(record);
    expect(copyWorkflow.copyCmdComparisonPackage).toHaveBeenCalledWith(record);
    expect(copyWorkflow.copyCmdComparisonDiff).toHaveBeenCalledWith(record);
    expect(cmdStateSpy.getState()).toMatchObject({
      recordPath: '$.cmd',
      expectedText: '{"result":{}}',
      ignoreExtraPaths: true,
    });
  });

  it('保留候选记录惰性读取并按需暴露定位与 Scheme 动作', () => {
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();
    const { bindings, getCandidateRecords } = buildBindings({
      onLocatePath,
      onOpenSchemeValue,
    });

    expect(getCandidateRecords).not.toHaveBeenCalled();
    expect(bindings.recordCmdComparison.getCandidateRecords()).toEqual([record]);
    expect(getCandidateRecords).toHaveBeenCalledTimes(1);

    bindings.recordActions.onLocatePath?.('$.cmd');
    bindings.recordActions.onOpenSchemeValue?.('sampleapp://v1/open');

    expect(onLocatePath).toHaveBeenCalledWith('$.cmd');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('sampleapp://v1/open');
    expect(toast.success).toHaveBeenCalledWith('已填入 JSONPath 查询', { duration: 1600 });
    expect(toast.success).toHaveBeenCalledWith('已填入 Scheme 解析', { duration: 1600 });
  });

  it('未传入可选动作时不向记录区暴露入口', () => {
    const { bindings } = buildBindings();

    expect('onLocatePath' in bindings.recordActions).toBe(false);
    expect('onOpenSchemeValue' in bindings.recordActions).toBe(false);
  });

  it('没有首个 CMD 结构记录时不写入筛选和对比状态', () => {
    const { bindings, cmdStateSpy, queryStateSpy } = buildBindings({
      firstCmdStructureRecord: null,
    });

    bindings.openFirstCmdComparison();

    expect(queryStateSpy.getState()).toBe('');
    expect(cmdStateSpy.setState).not.toHaveBeenCalled();
  });
});

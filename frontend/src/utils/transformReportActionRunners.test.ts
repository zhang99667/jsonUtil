import { describe, expect, it, vi } from 'vitest';
import { buildTransformReportActionRunners } from './transformReportActionRunners';

const buildDependencies = () => ({
  setQuery: vi.fn(),
  openFirstCmdComparison: vi.fn(),
  openPlaceholderFillTemplate: vi.fn(),
  copyArchivePackage: vi.fn(),
  copyCollaborationReport: vi.fn(),
  copyQualitySnapshot: vi.fn(),
});

describe('transformReportActionRunners', () => {
  it('分发优先处理行动到筛选词和占位符回填', () => {
    const dependencies = buildDependencies();
    const { runIssueTriageAction } = buildTransformReportActionRunners(dependencies);

    runIssueTriageAction('filter-warning');
    runIssueTriageAction('filter-unresolved');
    runIssueTriageAction('filter-placeholder');
    runIssueTriageAction('open-placeholder-fill');

    expect(dependencies.setQuery).toHaveBeenNthCalledWith(1, '跳过');
    expect(dependencies.setQuery).toHaveBeenNthCalledWith(2, '待检查');
    expect(dependencies.setQuery).toHaveBeenNthCalledWith(3, '占位符');
    expect(dependencies.openPlaceholderFillTemplate).toHaveBeenCalledTimes(1);
  });

  it('分发下一步行动到对比、筛选和复制副作用', () => {
    const dependencies = buildDependencies();
    const { runNextAction } = buildTransformReportActionRunners(dependencies);

    runNextAction('compare-cmd');
    runNextAction('open-placeholder-fill');
    runNextAction('filter-placeholder');
    runNextAction('filter-triage');
    runNextAction('copy-archive');
    runNextAction('copy-collaboration');
    runNextAction('copy-quality-snapshot');

    expect(dependencies.openFirstCmdComparison).toHaveBeenCalledTimes(1);
    expect(dependencies.openPlaceholderFillTemplate).toHaveBeenCalledTimes(1);
    expect(dependencies.setQuery).toHaveBeenNthCalledWith(1, '占位符');
    expect(dependencies.setQuery).toHaveBeenNthCalledWith(2, '待处理');
    expect(dependencies.copyArchivePackage).toHaveBeenCalledTimes(1);
    expect(dependencies.copyCollaborationReport).toHaveBeenCalledTimes(1);
    expect(dependencies.copyQualitySnapshot).toHaveBeenCalledTimes(1);
  });
});

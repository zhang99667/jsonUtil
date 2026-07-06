import { describe, expect, it, vi } from 'vitest';
import type { TransformReportIssueTriageItem } from '../utils/transformReportActionItems';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TransformReportIssueTriagePanel } from './TransformReportIssueTriagePanel';

const issueTriageItems: TransformReportIssueTriageItem[] = [{
  key: 'warning',
  label: '跳过',
  count: 2,
  description: '优先处理跳过记录',
  actionLabel: '筛选跳过',
  title: '筛选跳过记录',
  action: 'filter-warning',
}, {
  key: 'placeholder',
  label: '占位符',
  count: 1,
  description: '补齐占位符',
  actionLabel: '打开模板',
  title: '打开占位符模板',
  action: 'open-placeholder-fill',
}];

describe('TransformReportIssueTriagePanel', () => {
  it('展示优先处理项并转发全部筛选和单项行动', () => {
    const onFilter = vi.fn();
    const onRunIssueTriageAction = vi.fn();
    const tree = TransformReportIssueTriagePanel({
      issuePriorityCount: 3,
      issueTriageItems,
      onFilter,
      onRunIssueTriageAction,
    });
    const text = collectText(tree);

    expect(text).toContain('建议优先处理');
    expect(text).toContain('全部待处理 3');
    expect(text).toContain('跳过 2');
    expect(text).toContain('占位符 1');

    clickElement(findByTour(tree, 'transform-report-triage-all')[0]);
    clickElement(findByTour(tree, 'transform-report-triage-action-warning')[0]);
    clickElement(findByTour(tree, 'transform-report-triage-action-placeholder')[0]);

    expect(onFilter).toHaveBeenCalledWith('待处理');
    expect(onRunIssueTriageAction).toHaveBeenCalledWith('filter-warning');
    expect(onRunIssueTriageAction).toHaveBeenCalledWith('open-placeholder-fill');
  });
});

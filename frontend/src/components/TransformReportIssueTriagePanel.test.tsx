import { describe, expect, it, vi } from 'vitest';
import type { TransformReportIssueTriageItem } from '../utils/transformReportActionItems';
import { TransformReportIssueTriagePanel } from './TransformReportIssueTriagePanel';

interface ElementLike {
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

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

    (findByDataTour(tree, 'transform-report-triage-all')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-triage-action-warning')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-triage-action-placeholder')[0].props.onClick as () => void)();

    expect(onFilter).toHaveBeenCalledWith('待处理');
    expect(onRunIssueTriageAction).toHaveBeenCalledWith('filter-warning');
    expect(onRunIssueTriageAction).toHaveBeenCalledWith('open-placeholder-fill');
  });
});

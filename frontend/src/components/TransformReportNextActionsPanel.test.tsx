import { describe, expect, it, vi } from 'vitest';
import type { TransformReportNextActionItem } from '../utils/transformReportActionItems';
import { TransformReportNextActionsPanel } from './TransformReportNextActionsPanel';

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

const nextActions: TransformReportNextActionItem[] = [{
  key: 'archive',
  label: '归档',
  description: '复制归档包',
  title: '复制归档包',
  tone: 'cyan',
  action: 'copy-archive',
}, {
  key: 'placeholder',
  label: '占位符',
  description: '打开模板',
  title: '打开回填模板',
  tone: 'purple',
  action: 'open-placeholder-fill',
  disabled: true,
}];

describe('TransformReportNextActionsPanel', () => {
  it('展示下一步行动并转发点击动作', () => {
    const onRunNextAction = vi.fn();
    const tree = TransformReportNextActionsPanel({ nextActions, onRunNextAction });
    const text = collectText(tree);

    expect(text).toContain('真实 response 下一步');
    expect(text).toContain('推荐 2 项');
    expect(text).toContain('归档');
    expect(text).toContain('占位符');
    expect(findByDataTour(tree, 'transform-report-next-action-placeholder')[0].props.disabled).toBe(true);

    (findByDataTour(tree, 'transform-report-next-action-archive')[0].props.onClick as () => void)();

    expect(onRunNextAction).toHaveBeenCalledWith('copy-archive');
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRuntimePlaceholderGroup } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderGroupCard } from './TransformReportPlaceholderGroupCard';
import { TransformReportPlaceholderGroupsList } from './TransformReportPlaceholderGroupsList';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const groups: TransformReportRuntimePlaceholderGroup[] = [
  {
    value: '__UID__',
    description: '用户 ID',
    count: 2,
    sourceCount: 1,
    sources: [{
      sourcePath: '$.cmd',
      sourceLabel: 'scheme',
      sourceOriginalPreview: 'cmd=__UID__',
      count: 2,
    }],
  },
  {
    value: '__PLAN__',
    description: '计划 ID',
    count: 1,
    sourceCount: 1,
    sources: [{
      sourcePath: '$.params.plan',
      count: 1,
    }],
  },
];

describe('TransformReportPlaceholderGroupsList', () => {
  it('渲染全部占位符分组并转发筛选动作', () => {
    const onFilter = vi.fn();
    const tree = TransformReportPlaceholderGroupsList({
      runtimePlaceholderGroups: groups,
      onFilter,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('TransformReportPlaceholderGroupsList 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('transform-report-placeholder-groups');
    const cards = findByType(tree, TransformReportPlaceholderGroupCard);
    expect(cards).toHaveLength(2);
    expect(cards[0].props.group).toBe(groups[0]);
    expect(cards[0].props.onFilter).toBe(onFilter);
    expect(cards[1].props.group).toBe(groups[1]);
    expect(cards[1].props.onFilter).toBe(onFilter);
  });
});

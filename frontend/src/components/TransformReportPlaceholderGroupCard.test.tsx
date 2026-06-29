import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRuntimePlaceholderGroup } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderGroupCard } from './TransformReportPlaceholderGroupCard';

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

const group: TransformReportRuntimePlaceholderGroup = {
  value: '__UID__',
  description: '用户 ID',
  count: 5,
  sourceCount: 4,
  sources: [
    {
      sourcePath: '$.cmd.uid',
      sourceLabel: 'scheme',
      sourceOriginalPreview: 'cmd=__UID__',
      count: 2,
    },
    { sourcePath: '$.query.uid', count: 1 },
    { sourcePath: '$.body.uid', sourceLabel: 'body', count: 1 },
    { sourcePath: '$.extra.uid', sourceLabel: 'extra', count: 1 },
  ],
};

describe('TransformReportPlaceholderGroupCard', () => {
  it('展示分组摘要、前三个来源并转发筛选动作', () => {
    const onFilter = vi.fn();
    const tree = TransformReportPlaceholderGroupCard({ group, onFilter });
    const text = collectText(tree);

    expect(text).toContain('__UID__');
    expect(text).toContain('5 处');
    expect(text).toContain('4 个来源');
    expect(text).toContain('用户 ID');
    expect(text).toContain('来源 scheme ×2: $.cmd.uid');
    expect(text).toContain('来源 ×1: $.query.uid');
    expect(text).toContain('来源 body ×1: $.body.uid');
    expect(text).toContain('还有 1 个来源');
    expect(text).not.toContain('$.extra.uid');

    (findByDataTour(tree, 'transform-report-filter-placeholder-group')[0].props.onClick as () => void)();

    expect(onFilter).toHaveBeenCalledWith('__UID__');
  });
});

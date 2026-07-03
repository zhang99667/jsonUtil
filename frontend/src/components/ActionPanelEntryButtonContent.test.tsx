import { describe, expect, it } from 'vitest';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';
import { ActionPanelEntryButtonContent } from './ActionPanelEntryButtonContent';

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

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

describe('ActionPanelEntryButtonContent', () => {
  it('展开态内容展示标签和可选状态 badge', () => {
    const tree = ActionPanelEntryButtonContent({
      label: '格式化',
      badge: { label: '当前', dataTour: 'active-mode-badge' },
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('入口按钮内容应返回 React 元素');
    expect(tree.props.className).toContain('justify-between');
    expect(collectText(tree)).toContain('格式化');
    expect(findByType(tree, ActionPanelButtonBadge)[0].props).toMatchObject({
      label: '当前',
      dataTour: 'active-mode-badge',
    });
  });

  it('没有状态 badge 时只展示标签', () => {
    const tree = ActionPanelEntryButtonContent({ label: '压缩' });

    expect(collectText(tree)).toContain('压缩');
    expect(findByType(tree, ActionPanelButtonBadge)).toHaveLength(0);
  });
});

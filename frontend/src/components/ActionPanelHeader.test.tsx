import { describe, expect, it, vi } from 'vitest';
import { ActionPanelHeader } from './ActionPanelHeader';

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

const collectText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (!isElementLike(node)) return '';
  return collectText(node.props.children);
};

describe('ActionPanelHeader', () => {
  it('展开态展示工具箱标题并保留折叠按钮语义', () => {
    const onToggleCollapse = vi.fn();
    const tree = ActionPanelHeader({ isCollapsed: false, onToggleCollapse });

    expect(collectText(tree)).toContain('JSON 工具箱');
    const button = findByType(tree, 'button')[0];
    expect(button.props['aria-label']).toBe('折叠工具栏');
    expect(button.props['aria-expanded']).toBe(true);

    const handleClick = button.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('折叠按钮应透传点击回调');
    handleClick();
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('折叠态隐藏标题并切换展开语义', () => {
    const tree = ActionPanelHeader({ isCollapsed: true, onToggleCollapse: vi.fn() });
    const button = findByType(tree, 'button')[0];

    expect(collectText(tree)).not.toContain('JSON 工具箱');
    expect(button.props['aria-label']).toBe('展开工具栏');
    expect(button.props.title).toBe('展开');
    expect(button.props['aria-expanded']).toBe(false);
  });
});

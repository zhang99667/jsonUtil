import { describe, expect, it } from 'vitest';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';

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

describe('ActionPanelButtonBadge', () => {
  it('渲染工具栏按钮右侧状态 badge', () => {
    const tree = ActionPanelButtonBadge({
      label: '打开',
      dataTour: 'panel-open-badge',
      ariaHidden: true,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelButtonBadge 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('panel-open-badge');
    expect(tree.props['aria-hidden']).toBe(true);
    expect(tree.props.className).toContain('bg-brand-primary/20');
    expect(tree.props.children).toBe('打开');
  });
});

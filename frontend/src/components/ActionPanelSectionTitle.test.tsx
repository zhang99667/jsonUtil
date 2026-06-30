import { describe, expect, it } from 'vitest';
import { ActionPanelSectionTitle } from './ActionPanelSectionTitle';

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

describe('ActionPanelSectionTitle', () => {
  it('折叠态不占用列表标题空间', () => {
    expect(ActionPanelSectionTitle({
      title: '预览 / 输出',
      isCollapsed: true,
    })).toBeNull();
  });

  it('展开态输出标题并标记首组间距', () => {
    const tree = ActionPanelSectionTitle({
      title: '预览 / 输出',
      isCollapsed: false,
      isFirst: true,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelSectionTitle 应返回 React 元素');
    expect(tree.props.children).toBe('预览 / 输出');
    expect(tree.props.className).toContain('mt-2');
  });
});

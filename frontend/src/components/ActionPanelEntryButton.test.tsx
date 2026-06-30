import { describe, expect, it, vi } from 'vitest';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { ActionPanelEntryIconSlot } from './ActionPanelEntryIconSlot';

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

const renderButton = (overrides: Partial<Parameters<typeof ActionPanelEntryButton>[0]> = {}) => ActionPanelEntryButton({
  label: '格式化',
  icon: <span>F</span>,
  state: {
    entryProps: {
      isActive: true,
      badge: { label: '当前', dataTour: 'active-mode-badge' },
    },
    iconState: { iconWrapperClassName: 'transition-colors text-blue-400' },
  },
  dataTour: 'format-button',
  isCollapsed: false,
  onClick: vi.fn(),
  ...overrides,
});

describe('ActionPanelEntryButton', () => {
  it('展开态展示标签、状态 badge 和 active 按钮状态', () => {
    const onClick = vi.fn();
    const tree = renderButton({ onClick });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelEntryButton 应返回 React 元素');
    expect(tree.type).toBe('button');
    expect(tree.props['data-tour']).toBe('format-button');
    expect(tree.props['aria-pressed']).toBe(true);
    expect(tree.props.className).toContain('bg-editor-active');
    expect(tree.props.title).toBeUndefined();
    expect(collectText(tree)).toContain('格式化');
    expect(findByType(tree, ActionPanelEntryIconSlot)[0].props.state).toMatchObject({
      iconWrapperClassName: 'transition-colors text-blue-400',
    });
    expect(findByType(tree, ActionPanelButtonBadge)[0].props).toMatchObject({
      label: '当前',
      dataTour: 'active-mode-badge',
    });

    const handleClick = tree.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('入口按钮应透传点击回调');
    handleClick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('折叠态隐藏标签和 badge，同时保留可访问文案', () => {
    const tree = renderButton({
      isActive: false,
      isCollapsed: true,
      state: {
        entryProps: {
          isActive: false,
          ariaLabel: '格式化',
          title: '格式化',
        },
        iconState: { iconWrapperClassName: 'transition-colors text-blue-400' },
      },
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelEntryButton 应返回 React 元素');
    expect(tree.props['aria-label']).toBe('格式化');
    expect(tree.props.title).toBe('格式化');
    expect(tree.props.className).toContain('justify-center');
    expect(collectText(tree)).not.toContain('格式化');
    expect(findByType(tree, ActionPanelButtonBadge)).toHaveLength(0);
  });
});

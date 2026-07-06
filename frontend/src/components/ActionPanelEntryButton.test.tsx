import { describe, expect, it, vi } from 'vitest';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { ActionPanelEntryButtonContent } from './ActionPanelEntryButtonContent';
import { ActionPanelEntryIconSlot } from './ActionPanelEntryIconSlot';
import { assertElementLike, clickElement, collectText, findByType } from './componentElementTestHelpers';

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

    assertElementLike(tree, 'ActionPanelEntryButton 应返回 React 元素');
    expect(tree.type).toBe('button');
    expect(tree.props['data-tour']).toBe('format-button');
    expect(tree.props['aria-pressed']).toBe(true);
    expect(tree.props.className).toContain('bg-editor-active');
    expect(tree.props.className).toContain('shadow-[inset_3px_0_0_rgba(96,165,250,0.72)]');
    expect(tree.props.className).not.toContain('ring-');
    expect(tree.props.title).toBeUndefined();
    expect(findByType(tree, ActionPanelEntryButtonContent)[0].props).toMatchObject({
      label: '格式化',
      badge: { label: '当前', dataTour: 'active-mode-badge' },
    });
    expect(findByType(tree, ActionPanelEntryIconSlot)[0].props.state).toMatchObject({
      iconWrapperClassName: 'transition-colors text-blue-400',
    });
    clickElement(tree);
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

    assertElementLike(tree, 'ActionPanelEntryButton 应返回 React 元素');
    expect(tree.props['aria-label']).toBe('格式化');
    expect(tree.props.title).toBe('格式化');
    expect(tree.props.className).toContain('justify-center');
    expect(collectText(tree)).not.toContain('格式化');
    expect(findByType(tree, ActionPanelEntryButtonContent)).toHaveLength(0);
  });
});

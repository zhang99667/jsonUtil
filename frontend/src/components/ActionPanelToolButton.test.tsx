import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import type { ActionPanelEntryButtonState } from '../utils/actionPanelEntryButtonState';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { ActionPanelToolButton } from './ActionPanelToolButton';
import { assertElementLike, type ElementLike } from './componentElementTestHelpers';

const getButtonState = (node: ElementLike) => node.props.state as ActionPanelEntryButtonState;

const renderButton = (overrides: Partial<Parameters<typeof ActionPanelToolButton>[0]> = {}) => ActionPanelToolButton({
  mode: TransformMode.FORMAT,
  label: '格式化',
  icon: <span>F</span>,
  colorClass: 'text-blue-400',
  dataTour: 'format-button',
  isActive: true,
  isCollapsed: false,
  onClick: vi.fn(),
  ...overrides,
});

describe('ActionPanelToolButton', () => {
  it('展开态装配通用按钮壳、当前标识并透传模式点击', () => {
    const onClick = vi.fn();
    const tree = assertElementLike(
      renderButton({ onClick }),
      'ActionPanelToolButton 应返回 React 元素'
    );

    expect(tree.type).toBe(ActionPanelEntryButton);
    expect(tree.props.dataTour).toBe('format-button');
    expect(tree.props.isCollapsed).toBe(false);
    expect(tree.props.label).toBe('格式化');
    const state = getButtonState(tree);
    expect(state.entryProps).toMatchObject({
      isActive: true,
      title: undefined,
    });
    expect(state.entryProps.badge).toMatchObject({
      label: '当前',
      dataTour: 'active-mode-badge',
    });
    expect(state.iconState).toMatchObject({
      iconWrapperClassName: 'transition-colors text-blue-400',
      iconInnerClassName: 'text-blue-400',
    });

    const handleClick = tree.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('工具按钮应透传点击回调');
    handleClick();
    expect(onClick).toHaveBeenCalledWith(TransformMode.FORMAT);
  });

  it('折叠态隐藏标签并保留可访问名称', () => {
    const tree = assertElementLike(
      renderButton({
        isActive: false,
        isCollapsed: true,
      }),
      'ActionPanelToolButton 应返回 React 元素'
    );

    const state = getButtonState(tree);
    expect(state.entryProps.ariaLabel).toBe('格式化');
    expect(state.entryProps.title).toBe('格式化');
    expect(tree.props.isCollapsed).toBe(true);
    expect(state.entryProps.badge).toBeUndefined();
  });
});

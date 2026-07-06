import { describe, expect, it, vi } from 'vitest';
import type { ActionPanelEntryButtonState } from '../utils/actionPanelEntryButtonState';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { ActionPanelPanelButton } from './ActionPanelPanelButton';
import { assertElementLike, clickElement, type ElementLike } from './componentElementTestHelpers';

const getButtonState = (node: ElementLike) => node.props.state as ActionPanelEntryButtonState;

const renderButton = (overrides: Partial<Parameters<typeof ActionPanelPanelButton>[0]> = {}) => ActionPanelPanelButton({
  label: '结构导航',
  icon: <span>T</span>,
  iconClass: 'text-cyan-300',
  hoverIconClass: 'group-hover:text-cyan-300',
  isOpen: true,
  isCollapsed: false,
  onClick: vi.fn(),
  dataTour: 'json-tree-button',
  ...overrides,
});

describe('ActionPanelPanelButton', () => {
  it('展开态装配通用按钮壳、打开标识并透传点击', () => {
    const onClick = vi.fn();
    const tree = renderButton({ onClick });

    const button = assertElementLike(tree, 'ActionPanelPanelButton 应返回 React 元素');
    expect(button.type).toBe(ActionPanelEntryButton);
    expect(button.props.dataTour).toBe('json-tree-button');
    expect(button.props.isCollapsed).toBe(false);
    expect(button.props.label).toBe('结构导航');
    const state = getButtonState(button);
    expect(state.entryProps).toMatchObject({
      isActive: true,
      title: undefined,
    });
    expect(state.entryProps.badge).toMatchObject({
      label: '打开',
      dataTour: 'panel-open-badge',
      ariaHidden: true,
    });
    expect(state.iconState).toMatchObject({
      iconWrapperClassName: 'transition-colors text-cyan-300',
    });

    clickElement(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('折叠态保留开关状态的可访问名称', () => {
    const tree = renderButton({
      isOpen: false,
      isCollapsed: true,
    });

    const button = assertElementLike(tree, 'ActionPanelPanelButton 应返回 React 元素');
    const state = getButtonState(button);
    expect(state.entryProps.ariaLabel).toBe('结构导航，未打开');
    expect(state.entryProps.title).toBe('结构导航');
    expect(button.props.isCollapsed).toBe(true);
    expect(state.entryProps.badge).toBeUndefined();
  });
});

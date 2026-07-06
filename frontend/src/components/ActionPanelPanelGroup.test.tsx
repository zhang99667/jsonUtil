import { describe, expect, it, vi } from 'vitest';
import { ActionPanelPanelButton } from './ActionPanelPanelButton';
import {
  ActionPanelPanelGroup,
  type ActionPanelPanelStateById,
} from './ActionPanelPanelGroup';
import { findByType } from './componentElementTestHelpers';

const buildPanelState = (overrides: Partial<ActionPanelPanelStateById> = {}): ActionPanelPanelStateById => ({
  jsonPath: { isOpen: false, onClick: vi.fn() },
  jsonCompare: { isOpen: false, onClick: vi.fn() },
  jsonTree: { isOpen: false, onClick: vi.fn() },
  jsonSchema: { isOpen: false, onClick: vi.fn() },
  scheme: { isOpen: true, onClick: vi.fn() },
  template: { isOpen: false, onClick: vi.fn() },
  ...overrides,
});

describe('ActionPanelPanelGroup', () => {
  it('按配置顺序渲染面板入口并透传开关状态', () => {
    const onToggleScheme = vi.fn();
    const tree = ActionPanelPanelGroup({
      isCollapsed: false,
      panelStateById: buildPanelState({
        scheme: { isOpen: true, onClick: onToggleScheme },
      }),
    });
    const buttons = findByType(tree, ActionPanelPanelButton);

    expect(buttons.map(button => button.props.label)).toEqual([
      'JSONPath 查询',
      'JSON 对比',
      '结构导航',
      'Schema 校验',
      'Scheme 解析',
      '模板填充',
    ]);
    const schemeButton = buttons.find(button => button.props.label === 'Scheme 解析');
    expect(schemeButton?.props.isOpen).toBe(true);
    expect(schemeButton?.props.isCollapsed).toBe(false);

    const handleClick = schemeButton?.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('Scheme 入口应透传开关回调');
    handleClick();
    expect(onToggleScheme).toHaveBeenCalledTimes(1);
  });
});

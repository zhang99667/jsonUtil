import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { ActionPanelAuxiliaryWorkbench } from './ActionPanelAuxiliaryWorkbench';
import { assertElementLike, collectText, findByTour } from './componentElementTestHelpers';

describe('ActionPanelAuxiliaryWorkbench', () => {
  it('折叠态隐藏低频辅助入口', () => {
    const tree = ActionPanelAuxiliaryWorkbench({
      activeMode: TransformMode.FORMAT,
      isCollapsed: true,
      onSmartSuggestionAction: vi.fn(),
    });

    expect(tree).toBeNull();
  });

  it('展开态展示低频排查入口并透传智能建议动作', () => {
    const onSmartSuggestionAction = vi.fn();
    const tree = ActionPanelAuxiliaryWorkbench({
      activeMode: TransformMode.DEEP_FORMAT,
      isCollapsed: false,
      onSmartSuggestionAction,
    });

    const root = assertElementLike(tree, 'ActionPanelAuxiliaryWorkbench 应返回 React 元素');
    expect(root.type).toBe('details');
    expect(root.props['data-tour']).toBe('auxiliary-workbench');
    expect(collectText(root)).toContain('更多 / 实验');
    expect(collectText(root)).toContain('高级排查');
    expect(collectText(root)).toContain('低频复盘');

    const debugButtons = findByTour(root, 'workbench-debug-recipe');
    expect(debugButtons).toHaveLength(1);
    expect(debugButtons[0].props['aria-pressed']).toBe(true);
    expect(debugButtons[0].props.className).toContain('bg-editor-active');
    expect(debugButtons[0].props.className).toContain('shadow-[inset_3px_0_0_rgba(96,165,250,0.72)]');
    expect(debugButtons[0].props.className).not.toContain('ring-');

    const handleClick = debugButtons[0].props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('高级排查入口应透传点击回调');
    handleClick();
    expect(onSmartSuggestionAction).toHaveBeenCalledWith('response-inspection');
  });

  it('非深度格式化模式下低频入口保持未激活态', () => {
    const tree = ActionPanelAuxiliaryWorkbench({
      activeMode: TransformMode.FORMAT,
      isCollapsed: false,
      onSmartSuggestionAction: vi.fn(),
    });

    const debugButtons = findByTour(tree, 'workbench-debug-recipe');
    expect(debugButtons).toHaveLength(1);
    expect(debugButtons[0].props['aria-pressed']).toBe(false);
    expect(debugButtons[0].props.className).toContain('border-editor-border');
  });
});

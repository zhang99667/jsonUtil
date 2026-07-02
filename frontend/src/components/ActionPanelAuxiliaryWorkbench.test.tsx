import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { ActionPanelAuxiliaryWorkbench } from './ActionPanelAuxiliaryWorkbench';

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

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

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

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelAuxiliaryWorkbench 应返回 React 元素');
    expect(tree.type).toBe('details');
    expect(tree.props['data-tour']).toBe('auxiliary-workbench');
    expect(collectText(tree)).toContain('更多 / 实验');
    expect(collectText(tree)).toContain('高级排查');
    expect(collectText(tree)).toContain('低频复盘');

    const debugButtons = findByDataTour(tree, 'workbench-debug-recipe');
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

    const debugButtons = findByDataTour(tree, 'workbench-debug-recipe');
    expect(debugButtons).toHaveLength(1);
    expect(debugButtons[0].props['aria-pressed']).toBe(false);
    expect(debugButtons[0].props.className).toContain('border-editor-border');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { ActionPanelToolButton } from './ActionPanelToolButton';
import { ActionPanelToolGroups } from './ActionPanelToolGroups';

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

describe('ActionPanelToolGroups', () => {
  it('渲染所有工具按钮并标记当前模式', () => {
    const onModeChange = vi.fn();
    const tree = ActionPanelToolGroups({
      activeMode: TransformMode.DEEP_FORMAT,
      isCollapsed: false,
      onModeChange,
    });
    const buttons = findByType(tree, ActionPanelToolButton);

    expect(buttons.map(button => button.props.label)).toContain('嵌套解析');
    expect(buttons.map(button => button.props.label)).toContain('JSON 转 TS');
    const deepFormatButton = buttons.find(button => button.props.mode === TransformMode.DEEP_FORMAT);
    expect(deepFormatButton?.props.isActive).toBe(true);
    expect(deepFormatButton?.props.dataTour).toBe('deep-format-btn');

    const handleClick = deepFormatButton?.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('工具组应透传模式切换回调');
    handleClick(TransformMode.DEEP_FORMAT);
    expect(onModeChange).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
  });

  it('折叠态把状态透传给每个工具按钮', () => {
    const tree = ActionPanelToolGroups({
      activeMode: TransformMode.FORMAT,
      isCollapsed: true,
      onModeChange: vi.fn(),
    });
    const buttons = findByType(tree, ActionPanelToolButton);

    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every(button => button.props.isCollapsed === true)).toBe(true);
  });
});

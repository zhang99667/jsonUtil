import { describe, expect, it, vi } from 'vitest';
import { SourceEditorErrorActions } from './SourceEditorErrorActions';

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

describe('SourceEditorErrorActions', () => {
  it('渲染 SOURCE 错误态 AI 修复按钮并透传点击事件', () => {
    const onRepair = vi.fn();
    const tree = SourceEditorErrorActions({
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: false,
      onRepair,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('SourceEditorErrorActions 应返回 React 元素');

    expect(tree.props['data-tour']).toBe('source-error-ai-fix');
    expect(tree.props.title).toBe('使用 AI 修复 SOURCE JSON');
    expect(tree.props['aria-label']).toBe('使用 AI 修复 SOURCE JSON');
    expect(tree.props.disabled).toBe(false);
    expect(tree.props.children).toBe('修复');

    const onClick = tree.props.onClick;
    expect(typeof onClick).toBe('function');
    if (typeof onClick !== 'function') throw new Error('修复按钮应透传 onClick');
    onClick();
    expect(onRepair).toHaveBeenCalledTimes(1);
  });

  it('处理进行中时禁用 AI 修复按钮', () => {
    const tree = SourceEditorErrorActions({
      repairTitle: '修复处理中',
      isProcessing: true,
      onRepair: vi.fn(),
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('SourceEditorErrorActions 应返回 React 元素');
    expect(tree.props.disabled).toBe(true);
  });
});

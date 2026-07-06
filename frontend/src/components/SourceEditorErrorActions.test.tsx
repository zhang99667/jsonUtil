import { describe, expect, it, vi } from 'vitest';
import { assertElementLike } from './componentElementTestHelpers';
import { SourceEditorErrorActions } from './SourceEditorErrorActions';

describe('SourceEditorErrorActions', () => {
  it('渲染 SOURCE 错误态 AI 修复按钮并透传点击事件', () => {
    const onRepair = vi.fn();
    const tree = SourceEditorErrorActions({
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: false,
      onRepair,
    });

    const root = assertElementLike(tree, 'SourceEditorErrorActions 应返回 React 元素');

    expect(root.props['data-tour']).toBe('source-error-ai-fix');
    expect(root.props.title).toBe('使用 AI 修复 SOURCE JSON');
    expect(root.props['aria-label']).toBe('使用 AI 修复 SOURCE JSON');
    expect(root.props.disabled).toBe(false);
    expect(root.props.children).toBe('修复');

    const onClick = root.props.onClick;
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

    const root = assertElementLike(tree, 'SourceEditorErrorActions 应返回 React 元素');
    expect(root.props.disabled).toBe(true);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { ActionPanelAiFixButton } from './ActionPanelAiFixButton';
import { ActionPanelAiFixIcon } from './ActionPanelAiFixIcon';
import {
  assertElementLike,
  clickElement,
  collectText,
  findByType,
} from './componentElementTestHelpers';

describe('ActionPanelAiFixButton', () => {
  it('处理中的按钮展示 loading 文案并继续透传 AI 修复动作', () => {
    const onAction = vi.fn();
    const root = assertElementLike(ActionPanelAiFixButton({
      isCollapsed: false,
      isProcessing: true,
      onAction,
    }));

    expect(root.type).toBe('button');
    expect(root.props['data-tour']).toBe('ai-fix');
    expect(root.props.disabled).toBe(true);
    expect(root.props['aria-label']).toBe('智能修复中，请等待当前任务完成');
    expect(root.props.title).toBe('智能修复中，请等待当前任务完成');
    expect(collectText(root)).toContain('修复中...');
    expect(findByType(root, ActionPanelAiFixIcon)[0].props.isProcessing).toBe(true);

    clickElement(root);

    expect(onAction).toHaveBeenCalledWith(ActionType.AI_FIX);
  });

  it('折叠时保留可访问标题并隐藏可见文案', () => {
    const root = assertElementLike(ActionPanelAiFixButton({
      isCollapsed: true,
      isProcessing: false,
      onAction: vi.fn(),
    }));

    expect(root.props.disabled).toBe(false);
    expect(root.props['aria-label']).toBe('智能修复');
    expect(root.props.title).toBe('智能修复');
    expect(root.props.className).toContain('px-2');
    expect(collectText(root)).not.toContain('智能修复');
    expect(findByType(root, ActionPanelAiFixIcon)[0].props.isProcessing).toBe(false);
  });

  it('图标组件按处理状态切换闪电和 loading 样式', () => {
    const idleIcon = assertElementLike(ActionPanelAiFixIcon({ isProcessing: false }));
    const loadingIcon = assertElementLike(ActionPanelAiFixIcon({ isProcessing: true }));

    expect(idleIcon.props.className).toContain('text-violet-400');
    expect(loadingIcon.props.className).toContain('animate-spin');
  });
});

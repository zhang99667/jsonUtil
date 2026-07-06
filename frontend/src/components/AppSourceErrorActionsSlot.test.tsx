import { describe, expect, it, vi } from 'vitest';
import { AppSourceErrorActionsSlot } from './AppSourceErrorActionsSlot';
import { assertElementLike } from './componentElementTestHelpers';
import { SourceEditorErrorActions } from './SourceEditorErrorActions';

describe('AppSourceErrorActionsSlot', () => {
  it('SOURCE 有内容且校验无效时装配 AI 修复按钮', () => {
    const onRepair = vi.fn();
    const tree = AppSourceErrorActionsSlot({
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      hasSourceContent: true,
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: true,
      onRepair,
    });

    const root = assertElementLike(tree, 'AppSourceErrorActionsSlot 应返回 React 元素');
    expect(root.type).toBe(SourceEditorErrorActions);
    expect(root.props).toMatchObject({
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: true,
      onRepair,
    });
  });

  it('SOURCE 有效或为空时不展示修复入口', () => {
    expect(AppSourceErrorActionsSlot({
      sourceValidation: { isValid: true },
      hasSourceContent: true,
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: false,
      onRepair: vi.fn(),
    })).toBeNull();

    expect(AppSourceErrorActionsSlot({
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      hasSourceContent: false,
      repairTitle: '使用 AI 修复 SOURCE JSON',
      isProcessing: false,
      onRepair: vi.fn(),
    })).toBeNull();
  });
});

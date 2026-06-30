import { describe, expect, it, vi } from 'vitest';
import { AppSourceErrorActionsSlot } from './AppSourceErrorActionsSlot';
import { SourceEditorErrorActions } from './SourceEditorErrorActions';

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

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppSourceErrorActionsSlot 应返回 React 元素');
    expect(tree.type).toBe(SourceEditorErrorActions);
    expect(tree.props).toMatchObject({
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

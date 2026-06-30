import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  runSourceReplacePlan,
} from './appSourceReplacementCommandHelpers';

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('./toast', () => toastMocks);

describe('appSourceReplacementCommandHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('处理 skip 计划并保持成功跳过副作用', () => {
    const onTrackToolEvent = vi.fn();
    const onSuccessSkip = vi.fn();

    runSourceReplacePlan({
      plan: {
        action: 'skip',
        feedback: 'success',
        message: '内容已相同',
      },
      eventName: 'SCHEME_INSPECT_SOURCE',
      category: 'panel',
      startedAt: 12,
      onApply: vi.fn(),
      onConfirm: vi.fn(),
      onTrackToolEvent,
      onSuccessSkip,
    });

    expect(toastMocks.showSuccess).toHaveBeenCalledWith('内容已相同');
    expect(toastMocks.showError).not.toHaveBeenCalled();
    expect(onSuccessSkip).toHaveBeenCalledTimes(1);
    expect(onTrackToolEvent).toHaveBeenCalledWith('SCHEME_INSPECT_SOURCE', 'panel', 'skipped', 12);
  });

  it('处理错误 skip 时只提示错误且不触发成功跳过副作用', () => {
    const onApply = vi.fn();
    const onConfirm = vi.fn();
    const onTrackToolEvent = vi.fn();
    const onSuccessSkip = vi.fn();

    runSourceReplacePlan({
      plan: {
        action: 'skip',
        feedback: 'error',
        message: '剪贴板为空',
      },
      eventName: 'SOURCE_PASTE',
      category: 'editor',
      startedAt: 13,
      onApply,
      onConfirm,
      onTrackToolEvent,
      onSuccessSkip,
    });

    expect(toastMocks.showError).toHaveBeenCalledWith('剪贴板为空');
    expect(toastMocks.showSuccess).not.toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onSuccessSkip).not.toHaveBeenCalled();
    expect(onTrackToolEvent).toHaveBeenCalledWith('SOURCE_PASTE', 'editor', 'skipped', 13);
  });

  it('处理 confirm 计划且仅在指定场景打 skipped', () => {
    const onConfirm = vi.fn();
    const onTrackToolEvent = vi.fn();

    runSourceReplacePlan({
      plan: { action: 'confirm', pendingText: 'next' },
      eventName: 'SOURCE_PASTE',
      category: 'editor',
      startedAt: 20,
      onApply: vi.fn(),
      onConfirm,
      onTrackToolEvent,
    });

    expect(onConfirm).toHaveBeenCalledWith('next');
    expect(onTrackToolEvent).not.toHaveBeenCalled();

    runSourceReplacePlan({
      plan: { action: 'confirm', pendingText: 'scheme' },
      eventName: 'SCHEME_INSPECT_SOURCE',
      category: 'panel',
      startedAt: 21,
      onApply: vi.fn(),
      onConfirm,
      onTrackToolEvent,
      shouldTrackConfirmAsSkipped: true,
    });

    expect(onTrackToolEvent).toHaveBeenCalledWith('SCHEME_INSPECT_SOURCE', 'panel', 'skipped', 21);
  });

  it('处理 apply、confirm pending 和 cancel pending', () => {
    const onApply = vi.fn();
    const onClearPending = vi.fn();
    const onTrackToolEvent = vi.fn();

    runSourceReplacePlan({
      plan: { action: 'apply', text: 'preview', successMessage: '已应用' },
      eventName: 'PREVIEW_APPLY_TO_SOURCE',
      category: 'editor',
      startedAt: 30,
      onApply,
      onConfirm: vi.fn(),
      onTrackToolEvent,
    });
    expect(onApply).toHaveBeenCalledWith('preview', '已应用');
    expect(onTrackToolEvent).toHaveBeenCalledWith('PREVIEW_APPLY_TO_SOURCE', 'editor', 'success', 30);

    confirmPendingSourceReplacement({
      pendingText: 'snapshot',
      successMessage: '已替换',
      eventName: 'SOURCE_PASTE',
      category: 'editor',
      onApply,
      onClearPending,
      onTrackToolEvent,
    });
    expect(onApply).toHaveBeenCalledWith('snapshot', '已替换');
    expect(onClearPending).toHaveBeenCalledTimes(1);
    expect(onTrackToolEvent).toHaveBeenLastCalledWith('SOURCE_PASTE', 'editor', 'success', expect.any(Number));

    cancelPendingSourceReplacement('SOURCE_PASTE', 'editor', onClearPending, onTrackToolEvent);
    expect(onClearPending).toHaveBeenCalledTimes(2);
    expect(onTrackToolEvent).toHaveBeenLastCalledWith('SOURCE_PASTE', 'editor', 'cancelled', expect.any(Number));
  });

  it('pending 文本为空时确认操作保持 no-op，避免误清空或误打点', () => {
    const onApply = vi.fn();
    const onClearPending = vi.fn();
    const onTrackToolEvent = vi.fn();

    confirmPendingSourceReplacement({
      pendingText: null,
      successMessage: '已替换',
      eventName: 'SOURCE_PASTE',
      category: 'editor',
      onApply,
      onClearPending,
      onTrackToolEvent,
    });

    expect(onApply).not.toHaveBeenCalled();
    expect(onClearPending).not.toHaveBeenCalled();
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });
});

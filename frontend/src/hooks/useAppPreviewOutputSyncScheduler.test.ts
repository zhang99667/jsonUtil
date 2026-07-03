import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PREVIEW_SYNC_DEBOUNCE_MS,
  PREVIEW_SYNC_UNLOCK_DELAY_MS,
  useAppPreviewOutputSyncScheduler,
} from './useAppPreviewOutputSyncScheduler';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

const createDeferred = () => {
  let resolveValue: (value: boolean) => void = () => undefined;
  const promise = new Promise<boolean>(resolve => {
    resolveValue = resolve;
  });
  return { promise, resolveValue };
};

describe('useAppPreviewOutputSyncScheduler', () => {
  let cleanups: Array<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    cleanups = [];
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => unknown) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanups.push(cleanup as () => void);
    });
    reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('连续调度时只运行最后一次同步任务', async () => {
    const firstTask = vi.fn(async () => true);
    const secondTask = vi.fn(async () => false);
    const scheduler = useAppPreviewOutputSyncScheduler({ clearOutputDraft: vi.fn() });

    scheduler.scheduleOutputSync(firstTask);
    scheduler.scheduleOutputSync(secondTask);
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_DEBOUNCE_MS);

    expect(firstTask).not.toHaveBeenCalled();
    expect(secondTask).toHaveBeenCalledTimes(1);
  });

  it('已开始的旧同步晚到时不会触发解锁', async () => {
    const firstTask = createDeferred();
    const clearOutputDraft = vi.fn();
    const scheduler = useAppPreviewOutputSyncScheduler({ clearOutputDraft });

    scheduler.scheduleOutputSync(vi.fn(() => firstTask.promise));
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_DEBOUNCE_MS);
    scheduler.scheduleOutputSync(vi.fn(async () => false));
    firstTask.resolveValue(true);
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_UNLOCK_DELAY_MS);

    expect(clearOutputDraft).not.toHaveBeenCalled();
  });

  it('同步成功后等待解锁延迟再清理草稿', async () => {
    const clearOutputDraft = vi.fn();
    const scheduler = useAppPreviewOutputSyncScheduler({ clearOutputDraft });

    scheduler.scheduleOutputSync(vi.fn(async () => true));
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_DEBOUNCE_MS);

    expect(clearOutputDraft).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_UNLOCK_DELAY_MS);
    expect(clearOutputDraft).toHaveBeenCalledTimes(1);
  });

  it('取消或卸载时清理防抖任务', async () => {
    const firstTask = vi.fn(async () => true);
    const secondTask = vi.fn(async () => true);
    const clearOutputDraft = vi.fn();
    const scheduler = useAppPreviewOutputSyncScheduler({ clearOutputDraft });

    scheduler.scheduleOutputSync(firstTask);
    scheduler.cancelOutputDraft();
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_DEBOUNCE_MS);

    scheduler.scheduleOutputSync(secondTask);
    cleanups[0]();
    await vi.advanceTimersByTimeAsync(PREVIEW_SYNC_DEBOUNCE_MS);

    expect(clearOutputDraft).toHaveBeenCalledTimes(1);
    expect(firstTask).not.toHaveBeenCalled();
    expect(secondTask).not.toHaveBeenCalled();
  });
});

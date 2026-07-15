import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executeAppPreviewOutputSyncMock,
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import {
  advancePreviewSyncDebounce,
  expectOutputDraft,
  expectSourceUnchanged,
} from './useAppPreviewOutputSyncTestAssertions';

const getPreviewSyncCleanup = (): (() => void) => {
  const cleanup = [...previewSyncMocks.useEffect.mock.results]
    .reverse()
    .find(({ value }) => typeof value === 'function')
    ?.value;

  if (typeof cleanup !== 'function') {
    throw new Error('未找到 PREVIEW 同步 cleanup');
  }

  return cleanup;
};

const createPendingOutputSync = () => {
  let resolveSync: (() => void) | null = null;
  let signal: AbortSignal | undefined;
  vi.mocked(executeAppPreviewOutputSyncMock).mockImplementationOnce(input => (
    new Promise(resolve => {
      signal = input.signal;
      resolveSync = () => resolve({ status: 'synced', nextSource: 'late-source' });
    })
  ));
  return {
    getSignal: () => signal,
    resolve: () => resolveSync?.(),
  };
};

const flushSyncResult = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('useAppPreviewOutputSync cancel', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('取消 PREVIEW 草稿时清理防抖同步，避免晚到任务覆盖 SOURCE', async () => {
    const result = useHookInput();
    result.handleOutputChange('{"a":2}');
    result.cancelOutputDraft();
    await advancePreviewSyncDebounce();

    expectOutputDraft(result, '', false);
    expect(executeAppPreviewOutputSyncMock).not.toHaveBeenCalled();
    expect(result.onSetInput).not.toHaveBeenCalled();
  });

  it('卸载时清理防抖同步，避免晚到任务覆盖 SOURCE', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    getPreviewSyncCleanup()();
    await advancePreviewSyncDebounce();

    expect(executeAppPreviewOutputSyncMock).not.toHaveBeenCalled();
    expect(result.onSetInput).not.toHaveBeenCalled();
  });

  it('同步校验启动后取消草稿时中止当前任务', async () => {
    const pendingSync = createPendingOutputSync();
    const result = useHookInput();
    result.handleOutputChange('{"a":2}');
    await advancePreviewSyncDebounce();
    expect(pendingSync.getSignal()?.aborted).toBe(false);
    result.cancelOutputDraft();
    expect(pendingSync.getSignal()?.aborted).toBe(true);
    pendingSync.resolve();
    await flushSyncResult();
    expectSourceUnchanged(result);
  });

  it('同步校验启动后卸载时中止任务并隔离晚到结果', async () => {
    const pendingSync = createPendingOutputSync();
    const result = useHookInput();
    result.handleOutputChange('{"a":2}');
    await advancePreviewSyncDebounce();

    getPreviewSyncCleanup()();
    expect(pendingSync.getSignal()?.aborted).toBe(true);
    pendingSync.resolve();
    await flushSyncResult();
    expectSourceUnchanged(result);
  });
});

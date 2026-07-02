import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executeAppPreviewOutputSyncMock,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';

describe('useAppPreviewOutputSync cancel', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('取消 PREVIEW 草稿时清理防抖同步，避免晚到任务覆盖 SOURCE', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    result.cancelOutputDraft();
    await vi.advanceTimersByTimeAsync(400);

    expect(result.pendingOutputValue.current).toBe('');
    expect(result.isUpdatingFromOutput.current).toBe(false);
    expect(executeAppPreviewOutputSyncMock).not.toHaveBeenCalled();
    expect(result.onSetInput).not.toHaveBeenCalled();
  });
});

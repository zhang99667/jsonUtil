import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_OUTPUT_SYNC_FAILED } from '../utils/appPreviewOutputSyncRunner';
import {
  executeAppPreviewOutputSyncMock,
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';

describe('useAppPreviewOutputSync failure path', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('PREVIEW 回写异常时不覆盖 SOURCE 并保留草稿', async () => {
    const result = useHookInput();
    vi.mocked(executeAppPreviewOutputSyncMock).mockRejectedValueOnce(new Error('sync failed'));

    result.handleOutputChange('{"a":2}');
    await vi.advanceTimersByTimeAsync(400);

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith(PREVIEW_OUTPUT_SYNC_FAILED);
    expect(result.onSetInput).not.toHaveBeenCalled();
    expect(result.onUpdateActiveFileContent).not.toHaveBeenCalled();
    expect(result.pendingOutputValue.current).toBe('{"a":2}');
    expect(result.isUpdatingFromOutput.current).toBe(true);
  });
});

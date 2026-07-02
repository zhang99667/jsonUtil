import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_OUTPUT_SYNC_FAILED } from '../utils/appPreviewOutputSyncRunner';
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

describe('useAppPreviewOutputSync failure path', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('PREVIEW 回写异常时不覆盖 SOURCE 并保留草稿', async () => {
    const result = useHookInput();
    vi.mocked(executeAppPreviewOutputSyncMock).mockRejectedValueOnce(new Error('sync failed'));

    result.handleOutputChange('{"a":2}');
    await advancePreviewSyncDebounce();

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith(PREVIEW_OUTPUT_SYNC_FAILED);
    expectSourceUnchanged(result);
    expectOutputDraft(result, '{"a":2}', true);
  });
});

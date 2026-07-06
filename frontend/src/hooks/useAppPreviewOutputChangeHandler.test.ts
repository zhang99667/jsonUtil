import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAppPreviewOutputChange } from '../utils/appPreviewOutputChangeHandler';
import { createPreviewOutputChangeHandlerInput } from '../utils/appPreviewOutputChangeHandlerTestFixture';
import { PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT } from '../utils/appPreviewOutputSyncTestFixture';
import { useAppPreviewOutputChangeHandler } from './useAppPreviewOutputChangeHandler';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appPreviewOutputChangeHandler', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputChangeHandler')>(),
  runAppPreviewOutputChange: vi.fn(),
}));

describe('useAppPreviewOutputChangeHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('将 PREVIEW 输出变更转发给 helper', () => {
    const input = createPreviewOutputChangeHandlerInput();
    const handleOutputChange = useAppPreviewOutputChangeHandler(input);

    handleOutputChange(PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT);

    expect(runAppPreviewOutputChange).toHaveBeenCalledWith(expect.objectContaining({
      scheduleOutputSync: input.scheduleOutputSync,
      request: expect.objectContaining({ previewText: PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT }),
      refs: expect.objectContaining({
        inputRef: input.refs.inputRef,
        pendingOutputValue: input.refs.pendingOutputValue,
      }),
    }));
  });
});

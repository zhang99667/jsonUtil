import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { useAppPreviewOutputDraftScheduler } from './useAppPreviewOutputDraftScheduler';
import { useAppPreviewOutputSyncScheduler } from './useAppPreviewOutputSyncScheduler';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));
const schedulerResult = vi.hoisted(() => ({
  cancelOutputDraft: vi.fn(),
  scheduleOutputSync: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appPreviewOutputDraft', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputDraft')>(),
  clearPreviewOutputDraft: vi.fn(),
}));

vi.mock('./useAppPreviewOutputSyncScheduler', async importOriginal => ({
  ...await importOriginal<typeof import('./useAppPreviewOutputSyncScheduler')>(),
  useAppPreviewOutputSyncScheduler: vi.fn(() => schedulerResult),
}));

describe('useAppPreviewOutputDraftScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('将草稿清理函数交给 PREVIEW 同步 scheduler', () => {
    const isUpdatingFromOutput = { current: true };
    const pendingOutputValue = { current: '{"a":2}' };
    const onBeforeSync = vi.fn();

    const result = useAppPreviewOutputDraftScheduler({
      isUpdatingFromOutput,
      pendingOutputValue,
      onBeforeSync,
    });

    const schedulerInput = vi.mocked(useAppPreviewOutputSyncScheduler).mock.calls[0][0];
    const { clearOutputDraft } = schedulerInput;
    clearOutputDraft();

    expect(clearPreviewOutputDraft).toHaveBeenCalledWith(isUpdatingFromOutput, pendingOutputValue);
    expect(schedulerInput.onBeforeSync).toBe(onBeforeSync);
    expect(result).toBe(schedulerResult);
  });
});

import { expect, vi } from 'vitest';
import { TransformMode } from '../types';
import {
  executeAppPreviewOutputSyncMock,
  previewSyncMocks,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import { invalidResult } from './useAppPreviewOutputSyncTestData';

type PreviewOutputSyncHookInput = ReturnType<typeof useHookInput>;

export const advancePreviewSyncDebounce = () => vi.advanceTimersByTimeAsync(400);
export const advancePreviewUnlockDelay = () => vi.advanceTimersByTimeAsync(600);

export const expectOutputDraft = (
  result: PreviewOutputSyncHookInput,
  value: string,
  isUpdating: boolean
) => {
  expect(result.pendingOutputValue.current).toBe(value);
  expect(result.isUpdatingFromOutput.current).toBe(isUpdating);
};

export const expectSourceUnchanged = (result: PreviewOutputSyncHookInput) => {
  expect(result.onSetInput).not.toHaveBeenCalled();
  expect(result.onUpdateActiveFileContent).not.toHaveBeenCalled();
};

export const useInvalidPreviewSyncInput = () => {
  vi.mocked(executeAppPreviewOutputSyncMock).mockResolvedValueOnce({
    status: 'invalid',
    validation: invalidResult,
  });
  return useHookInput(vi.fn(async () => invalidResult));
};

export const expectInvalidPreviewValidation = () => {
  expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith(invalidResult);
};

export const expectPreviewSyncRequest = (
  mock: unknown,
  result: PreviewOutputSyncHookInput,
  previewText: string
) => {
  expect(mock).toHaveBeenCalledWith(expect.objectContaining({
    previewText,
    mode: TransformMode.FORMAT,
    validateJsonMaybeAsync: result.validateJsonMaybeAsync,
  }));
};

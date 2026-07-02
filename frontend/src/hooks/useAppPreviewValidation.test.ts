import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import { invalidResult, validResult } from './useAppPreviewOutputSyncTestData';

const longJson = `{"value":"${'x'.repeat(200_000)}"}`;
const flushValidationPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useAppPreviewValidation', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('异步 PREVIEW 校验异常时收敛成校验失败状态', async () => {
    const validateJsonMaybeAsync = vi.fn(async () => {
      throw new Error('worker crashed');
    });

    useHookInput(validateJsonMaybeAsync, longJson);
    await flushValidationPromises();

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenLastCalledWith({
      isValid: false,
      error: 'PREVIEW 校验失败，请稍后重试',
    });
  });

  it('异步 PREVIEW 旧校验晚到时不覆盖最新结果', async () => {
    let resolveFirst: ((value: typeof invalidResult) => void) | null = null;
    const validateJsonMaybeAsync = vi
      .fn()
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce(validResult);

    const result = useHookInput(validateJsonMaybeAsync, longJson);

    result.handleOutputChange('{"ok":true}');
    resolveFirst?.(invalidResult);
    await flushValidationPromises();

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenLastCalledWith(validResult);
  });
});

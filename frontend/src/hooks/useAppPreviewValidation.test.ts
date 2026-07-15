import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import { invalidResult, validResult } from './useAppPreviewOutputSyncTestData';
import type { ValidateJsonMaybeAsync } from '../utils/jsonValidation';
import { advancePreviewSyncDebounce } from './useAppPreviewOutputSyncTestAssertions';

const longJson = `{"value":"${'x'.repeat(200_000)}"}`;
const flushValidationPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const getPreviewValidationCleanup = (): (() => void) => {
  const cleanup = previewSyncMocks.useEffect.mock.results
    .find(({ value }) => typeof value === 'function')
    ?.value;

  if (typeof cleanup !== 'function') {
    throw new Error('未找到 PREVIEW 校验 cleanup');
  }

  return cleanup;
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

  it('连续大文本校验及回写启动时中止上一项任务', async () => {
    const validateJsonMaybeAsync = vi.fn<ValidateJsonMaybeAsync>(
      () => new Promise(() => undefined)
    );
    const result = useHookInput(validateJsonMaybeAsync, longJson);

    const firstSignal = validateJsonMaybeAsync.mock.calls[0]?.[1]?.signal;
    result.handleOutputChange(`${longJson} `);
    const secondSignal = validateJsonMaybeAsync.mock.calls[1]?.[1]?.signal;

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);
    await advancePreviewSyncDebounce();
    expect(secondSignal?.aborted).toBe(true);
  });

  it('卸载时中止当前大文本校验', () => {
    const validateJsonMaybeAsync = vi.fn<ValidateJsonMaybeAsync>(
      () => new Promise(() => undefined)
    );

    useHookInput(validateJsonMaybeAsync, longJson);
    const signal = validateJsonMaybeAsync.mock.calls[0]?.[1]?.signal;
    getPreviewValidationCleanup()();

    expect(signal?.aborted).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from '../utils/appSourceValidationRequest';
import { SOURCE_VALIDATION_DEBOUNCE_MS, useAppSourceValidation } from './useAppSourceValidation';

const mocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
  useRef: mocks.useRef,
}));

vi.mock('../utils/appSourceValidationRequest', () => ({
  runAppSourceValidationRequest: vi.fn(),
}));

describe('useAppSourceValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    vi.mocked(runAppSourceValidationRequest).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('防抖后启动 SOURCE 校验请求', async () => {
    const onSetValidation = vi.fn();

    useAppSourceValidation({ input: '  {"a":1}  ', onSetValidation });

    expect(runAppSourceValidationRequest).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(SOURCE_VALIDATION_DEBOUNCE_MS);

    expect(runAppSourceValidationRequest).toHaveBeenCalledWith(expect.objectContaining({
      input: '  {"a":1}  ',
      onSetValidation,
    }));
  });

  it('空 SOURCE 输入立即启动校验以清理旧错误', () => {
    const onSetValidation = vi.fn();

    useAppSourceValidation({ input: ' \u200B  ', onSetValidation });

    expect(runAppSourceValidationRequest).toHaveBeenCalledWith(expect.objectContaining({
      input: ' \u200B  ',
      onSetValidation,
    }));
  });

  it('清理 effect 时取消已启动任务并失效旧结果', async () => {
    const validationTask = {
      promise: new Promise<ValidationResult>(() => undefined),
      cancel: vi.fn(),
    };
    const requestIdRef = { current: 7 };
    let cleanup: (() => void) | undefined;
    mocks.useRef.mockReturnValue(requestIdRef);
    vi.mocked(runAppSourceValidationRequest).mockReturnValue(validationTask);
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useAppSourceValidation({ input: '{"a":1}', onSetValidation: vi.fn() });
    await vi.advanceTimersByTimeAsync(SOURCE_VALIDATION_DEBOUNCE_MS);
    cleanup?.();

    expect(validationTask.cancel).toHaveBeenCalledTimes(1);
    expect(requestIdRef.current).toBe(8);
  });
});

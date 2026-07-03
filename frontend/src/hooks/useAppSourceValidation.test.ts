import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from '../utils/appSourceValidationRequest';
import { useAppSourceValidation } from './useAppSourceValidation';

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

    await vi.advanceTimersByTimeAsync(500);

    expect(runAppSourceValidationRequest).toHaveBeenCalledWith(expect.objectContaining({
      input: '  {"a":1}  ',
      onSetValidation,
    }));
  });

  it('清理 effect 时取消已启动但未完成的校验任务', async () => {
    const validationTask = {
      promise: new Promise<ValidationResult>(() => undefined),
      cancel: vi.fn(),
    };
    let cleanup: (() => void) | undefined;
    vi.mocked(runAppSourceValidationRequest).mockReturnValue(validationTask);
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useAppSourceValidation({ input: '{"a":1}', onSetValidation: vi.fn() });
    await vi.advanceTimersByTimeAsync(500);
    cleanup?.();

    expect(validationTask.cancel).toHaveBeenCalledTimes(1);
  });
});

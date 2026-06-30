import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from '../utils/appAsyncPolicy';
import { useAppSourceValidation } from './useAppSourceValidation';
import {
  cleanJsonInput,
  startJsonValidation,
} from '../utils/jsonValidation';

const mocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
  useRef: mocks.useRef,
}));

vi.mock('../utils/jsonValidation', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonValidation')>(),
  cleanJsonInput: vi.fn((value: string) => value.trim()),
  startJsonValidation: vi.fn(),
}));

const validResult: ValidationResult = { isValid: true };
const invalidResult: ValidationResult = { isValid: false, error: 'source invalid' };

const createValidationTask = (result: ValidationResult = validResult) => ({
  promise: Promise.resolve(result),
  cancel: vi.fn(),
});

const createPendingValidationTask = () => {
  let resolvePromise: (result: ValidationResult) => void = () => undefined;
  return {
    task: {
      promise: new Promise<ValidationResult>(resolve => {
        resolvePromise = resolve;
      }),
      cancel: vi.fn(),
    },
    resolvePromise,
  };
};

describe('useAppSourceValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    vi.mocked(startJsonValidation).mockReturnValue(createValidationTask());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('防抖后清理 SOURCE 输入并更新校验结果', async () => {
    const onSetValidation = vi.fn();

    useAppSourceValidation({ input: '  {"a":1}  ', onSetValidation });

    expect(onSetValidation).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    expect(cleanJsonInput).toHaveBeenCalledWith('  {"a":1}  ');
    expect(startJsonValidation).toHaveBeenCalledWith('{"a":1}', ASYNC_VALIDATION_THRESHOLD, {
      requireContainer: true,
    });
    expect(onSetValidation).toHaveBeenCalledWith(validResult);
  });

  it('空 SOURCE 输入防抖后恢复为有效状态且不启动异步校验', async () => {
    const onSetValidation = vi.fn();

    useAppSourceValidation({ input: '   ', onSetValidation });
    await vi.advanceTimersByTimeAsync(500);

    expect(startJsonValidation).not.toHaveBeenCalled();
    expect(onSetValidation).toHaveBeenCalledWith({ isValid: true });
  });

  it('清理 effect 时取消已启动但未完成的校验任务', async () => {
    const validationTask = {
      promise: new Promise<ValidationResult>(() => undefined),
      cancel: vi.fn(),
    };
    vi.mocked(startJsonValidation).mockReturnValue(validationTask);
    let cleanup: (() => void) | undefined;
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useAppSourceValidation({ input: '{"a":1}', onSetValidation: vi.fn() });
    await vi.advanceTimersByTimeAsync(500);
    cleanup?.();

    expect(validationTask.cancel).toHaveBeenCalledTimes(1);
  });

  it('忽略较早输入返回的过期校验结果', async () => {
    const requestIdRef = { current: 0 };
    const firstValidation = createPendingValidationTask();
    const secondValidation = createPendingValidationTask();
    const onSetValidation = vi.fn();
    mocks.useRef.mockReturnValue(requestIdRef);
    vi.mocked(startJsonValidation)
      .mockReturnValueOnce(firstValidation.task)
      .mockReturnValueOnce(secondValidation.task);

    useAppSourceValidation({ input: '{"a":1}', onSetValidation });
    await vi.advanceTimersByTimeAsync(500);
    useAppSourceValidation({ input: '{"a":2}', onSetValidation });
    await vi.advanceTimersByTimeAsync(500);

    firstValidation.resolvePromise(invalidResult);
    await firstValidation.task.promise;
    expect(onSetValidation).not.toHaveBeenCalledWith(invalidResult);
    secondValidation.resolvePromise(validResult);
    await secondValidation.task.promise;
    expect(onSetValidation).toHaveBeenCalledWith(validResult);
  });
});

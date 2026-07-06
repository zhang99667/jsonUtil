import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from './appAsyncPolicy';
import { runAppSourceValidationRequest } from './appSourceValidationRequest';
import {
  cleanJsonInput,
  startJsonValidation,
} from './jsonValidation';

vi.mock('./jsonValidation', async importOriginal => ({
  ...await importOriginal<typeof import('./jsonValidation')>(),
  cleanJsonInput: vi.fn((value: string) => value.replace(/[\u200B-\u200D\uFEFF]/g, '')),
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
  const task = {
    promise: new Promise<ValidationResult>(resolve => {
      resolvePromise = resolve;
    }),
    cancel: vi.fn(),
  };

  return { task, resolvePromise };
};

describe('appSourceValidationRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(startJsonValidation).mockReturnValue(createValidationTask());
  });

  it('清理 SOURCE 输入后启动容器校验并写回当前请求结果', async () => {
    const requestIdRef = { current: 0 };
    const onSetValidation = vi.fn();

    const task = runAppSourceValidationRequest({
      input: '\uFEFF  {"a":1}\u200B  ',
      requestIdRef,
      onSetValidation,
    });
    await task?.promise;

    expect(cleanJsonInput).toHaveBeenCalledWith('\uFEFF  {"a":1}\u200B  ');
    expect(startJsonValidation).toHaveBeenCalledWith('  {"a":1}  ', ASYNC_VALIDATION_THRESHOLD, {
      requireContainer: true,
    });
    expect(requestIdRef.current).toBe(1);
    expect(onSetValidation).toHaveBeenCalledWith(validResult);
  });

  it('空 SOURCE 输入恢复为有效状态且不启动校验任务', () => {
    const requestIdRef = { current: 3 };
    const onSetValidation = vi.fn();

    const task = runAppSourceValidationRequest({
      input: ' \u200B  ',
      requestIdRef,
      onSetValidation,
    });

    expect(task).toBeNull();
    expect(requestIdRef.current).toBe(4);
    expect(cleanJsonInput).toHaveBeenCalledWith(' \u200B  ');
    expect(startJsonValidation).not.toHaveBeenCalled();
    expect(onSetValidation).toHaveBeenCalledWith({ isValid: true });
  });

  it('忽略较早输入返回的过期校验结果', async () => {
    const requestIdRef = { current: 0 };
    const firstValidation = createPendingValidationTask();
    const secondValidation = createPendingValidationTask();
    const onSetValidation = vi.fn();
    vi.mocked(startJsonValidation)
      .mockReturnValueOnce(firstValidation.task)
      .mockReturnValueOnce(secondValidation.task);

    runAppSourceValidationRequest({ input: '{"a":1}', requestIdRef, onSetValidation });
    runAppSourceValidationRequest({ input: '{"a":2}', requestIdRef, onSetValidation });

    firstValidation.resolvePromise(invalidResult);
    await firstValidation.task.promise;
    expect(onSetValidation).not.toHaveBeenCalledWith(invalidResult);

    secondValidation.resolvePromise(validResult);
    await secondValidation.task.promise;
    expect(onSetValidation).toHaveBeenCalledWith(validResult);
  });
});

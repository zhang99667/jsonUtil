import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import {
  JSON_VALIDATION_WORKER_TIMEOUT_MS,
  startJsonValidation,
} from './jsonValidation';

describe('jsonValidation Worker 超时', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('Worker 永久无响应时返回可控结果并终止线程', async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    class PendingWorker {
      onmessage = null;
      onerror = null;
      terminate = terminate;

      postMessage() {}
    }
    vi.stubGlobal('Worker', PendingWorker);
    const task = startJsonValidation('{"large":true}', 0);
    let result: ValidationResult | undefined;
    void task.promise.then(value => { result = value; });

    await vi.advanceTimersByTimeAsync(JSON_VALIDATION_WORKER_TIMEOUT_MS);

    expect(result).toEqual({
      isValid: false,
      error: 'JSON 校验失败: Worker 响应超时',
    });
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    task.cancel();
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});

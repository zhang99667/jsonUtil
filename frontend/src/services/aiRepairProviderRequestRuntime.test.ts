import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AI_REPAIR_TIMEOUT_MESSAGE,
  runAiRepairProviderRequest,
} from './aiRepairProviderRequestRuntime';

describe('aiRepairProviderRequestRuntime', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('请求成功后释放父级 AbortSignal 监听', async () => {
    const parentAbortController = new AbortController();
    const removeListener = vi.spyOn(parentAbortController.signal, 'removeEventListener');

    await expect(runAiRepairProviderRequest({
      signal: parentAbortController.signal,
    }, async signal => {
      expect(signal.aborted).toBe(false);
      return 'ok';
    })).resolves.toBe('ok');

    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('请求失败后释放父级 AbortSignal 监听', async () => {
    const parentAbortController = new AbortController();
    const removeListener = vi.spyOn(parentAbortController.signal, 'removeEventListener');

    await expect(runAiRepairProviderRequest({
      signal: parentAbortController.signal,
    }, async () => {
      throw new Error('provider failed');
    })).rejects.toThrow('provider failed');

    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('超时时终止请求并释放父级 AbortSignal 监听', async () => {
    vi.useFakeTimers();
    const parentAbortController = new AbortController();
    const removeListener = vi.spyOn(parentAbortController.signal, 'removeEventListener');
    let requestSignal: AbortSignal | undefined;

    const promise = runAiRepairProviderRequest({
      signal: parentAbortController.signal,
      timeoutMs: 1000,
    }, signal => {
      requestSignal = signal;
      return new Promise<string>(() => undefined);
    });
    const expectation = expect(promise).rejects.toThrow(AI_REPAIR_TIMEOUT_MESSAGE);

    await vi.advanceTimersByTimeAsync(1000);

    await expectation;
    expect(requestSignal?.aborted).toBe(true);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('非有限超时值 %s 不会被定时器转换为立即超时', async timeoutMs => {
    vi.useFakeTimers();
    const parentAbortController = new AbortController();
    const promise = runAiRepairProviderRequest({
      signal: parentAbortController.signal,
      timeoutMs,
    }, signal => new Promise<string>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('请求已取消')), { once: true });
    }));
    const expectation = expect(promise).rejects.toThrow('请求已取消');

    await vi.advanceTimersByTimeAsync(1);
    parentAbortController.abort();

    await expectation;
  });

  it('父级信号已取消时直接传递已取消的请求信号', async () => {
    const parentAbortController = new AbortController();
    const addListener = vi.spyOn(parentAbortController.signal, 'addEventListener');
    const removeListener = vi.spyOn(parentAbortController.signal, 'removeEventListener');
    parentAbortController.abort();
    let requestSignal: AbortSignal | undefined;

    await runAiRepairProviderRequest({
      signal: parentAbortController.signal,
    }, async signal => {
      requestSignal = signal;
      return 'ok';
    });

    expect(requestSignal?.aborted).toBe(true);
    expect(addListener).not.toHaveBeenCalled();
    expect(removeListener).not.toHaveBeenCalled();
  });
});

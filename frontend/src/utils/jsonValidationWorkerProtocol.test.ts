import { afterEach, describe, expect, it, vi } from 'vitest';
import { startJsonValidation } from './jsonValidation';

type MessageHandler = ((event: MessageEvent<unknown>) => void) | null;
type ErrorHandler = ((event: ErrorEvent) => void) | null;

class ControlledValidationWorker {
  static latest: ControlledValidationWorker | null = null;

  onmessage: MessageHandler = null;
  onerror: ErrorHandler = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    ControlledValidationWorker.latest = this;
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent<unknown>);
  }

  emitError(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

const startControlledValidation = () => {
  vi.stubGlobal('Worker', ControlledValidationWorker);
  const task = startJsonValidation('{"large":true}', 0);
  const worker = ControlledValidationWorker.latest;
  if (!worker) throw new Error('测试 Worker 未创建');
  return { task, worker };
};

describe('jsonValidation Worker 协议', () => {
  afterEach(() => {
    ControlledValidationWorker.latest = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('仅接收当前请求的合法响应并忽略终态后的回调', async () => {
    vi.useFakeTimers();
    const { task, worker } = startControlledValidation();
    const queuedMessage = worker.onmessage;
    const queuedError = worker.onerror;

    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 1,
      input: '{"large":true}',
    });
    worker.emitMessage({ id: 1, validation: { isValid: true } });

    await expect(task.promise).resolves.toEqual({ isValid: true });
    queuedMessage?.({
      data: { id: 1, validation: { isValid: false, error: '迟到结果' } },
    } as MessageEvent<unknown>);
    queuedError?.({ message: '迟到错误' } as ErrorEvent);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Worker 错误结算后忽略已排队的成功响应', async () => {
    const { task, worker } = startControlledValidation();
    const queuedMessage = worker.onmessage;

    worker.emitError('运行失败');

    await expect(task.promise).resolves.toEqual({
      isValid: false,
      error: 'JSON 校验失败: 运行失败',
    });
    queuedMessage?.({ data: { id: 1, validation: { isValid: true } } } as MessageEvent<unknown>);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('直接取消会以 AbortError 结算并隔离已排队回调', async () => {
    const { task, worker } = startControlledValidation();
    const queuedMessage = worker.onmessage;
    const onRejected = vi.fn();
    void task.promise.catch(onRejected);

    task.cancel();
    queuedMessage?.({ data: { id: 1, validation: { isValid: true } } } as MessageEvent<unknown>);
    await Promise.resolve();

    expect(onRejected).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }));
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('合法的失败校验结果保持原样', async () => {
    const { task, worker } = startControlledValidation();
    const validation = { isValid: false, error: 'JSON 内容无效' };

    worker.emitMessage({ id: 1, validation });

    await expect(task.promise).resolves.toEqual(validation);
  });

  it('响应标识不匹配时终止任务并返回可控错误', async () => {
    const { task, worker } = startControlledValidation();

    worker.emitMessage({ id: 99, validation: { isValid: true } });

    await expect(task.promise).resolves.toEqual({
      isValid: false,
      error: 'JSON 校验失败: Worker 响应标识不匹配',
    });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    { id: 1 },
    { id: 1, validation: null },
    { id: 1, validation: { isValid: 'true' } },
    { id: 1, validation: { isValid: false, error: 42 } },
  ])('响应载荷无效时不会抛出或悬挂任务：%j', async response => {
    const { task, worker } = startControlledValidation();

    expect(() => worker.emitMessage(response)).not.toThrow();

    await expect(task.promise).resolves.toEqual({
      isValid: false,
      error: 'JSON 校验失败: Worker 响应格式无效',
    });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});

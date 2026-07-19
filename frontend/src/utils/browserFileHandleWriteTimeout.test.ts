import { afterEach, describe, expect, it, vi } from 'vitest';
import { FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS, writeTextToFileHandleQueued } from './browserFileHandleWrite';

const createHandle = (write: () => Promise<void>) => {
  const writable = {
    write: vi.fn(write),
    close: vi.fn(async () => undefined),
    abort: vi.fn(async () => undefined),
  };
  const handle = { createWritable: vi.fn(async () => writable) } as unknown as FileSystemFileHandle;
  return { handle, writable };
};

describe('browserFileHandleWrite 入口比较超时', () => {
  afterEach(() => vi.useRealTimers());

  it('入口比较永久等待时拒绝本次写入并恢复无关文件登记', async () => {
    vi.useFakeTimers();
    let finishActiveWrite = () => undefined;
    const active = createHandle(() => new Promise<void>(resolve => { finishActiveWrite = resolve; }));
    const activeWrite = writeTextToFileHandleQueued(active.handle, 'active');
    await vi.advanceTimersByTimeAsync(0);
    expect(active.handle.createWritable).toHaveBeenCalledOnce();
    const blockedHandle = {
      createWritable: vi.fn(),
      isSameEntry: vi.fn(() => new Promise<boolean>(() => undefined)),
    } as unknown as FileSystemFileHandle;
    let comparisonError: unknown;
    void writeTextToFileHandleQueued(blockedHandle, 'blocked').catch(error => { comparisonError = error; });
    const independent = createHandle(async () => undefined);
    const independentWrite = writeTextToFileHandleQueued(independent.handle, 'independent');
    await vi.advanceTimersByTimeAsync(FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS);
    expect(comparisonError).toMatchObject({ name: 'TimeoutError', message: '文件句柄入口比较超时' });
    expect(blockedHandle.createWritable).not.toHaveBeenCalled();
    expect(independent.handle.createWritable).toHaveBeenCalledOnce();
    await independentWrite;
    finishActiveWrite();
    await activeWrite;
  });

  it('同一对象优先命中后续活动队列且保持串行', async () => {
    vi.useFakeTimers();
    let finishA = () => undefined;
    let finishB = () => undefined;
    const activeA = createHandle(() => new Promise<void>(resolve => { finishA = resolve; }));
    const activeB = createHandle(async () => undefined);
    activeB.writable.write.mockImplementationOnce(() => new Promise<void>(resolve => { finishB = resolve; }));
    const isSameEntry = vi.fn()
      .mockResolvedValueOnce(false)
      .mockImplementationOnce(() => new Promise<boolean>(() => undefined));
    Object.assign(activeB.handle, { isSameEntry });
    const writeA = writeTextToFileHandleQueued(activeA.handle, 'a');
    await vi.advanceTimersByTimeAsync(0);
    const firstB = writeTextToFileHandleQueued(activeB.handle, 'b1');
    await vi.advanceTimersByTimeAsync(0);
    expect(isSameEntry).toHaveBeenCalledOnce();

    let secondError: unknown;
    const secondB = writeTextToFileHandleQueued(activeB.handle, 'b2').catch(error => { secondError = error; });
    await vi.advanceTimersByTimeAsync(FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS);
    expect(secondError).toBeUndefined();
    expect(isSameEntry).toHaveBeenCalledOnce();
    expect(activeB.handle.createWritable).toHaveBeenCalledOnce();
    finishB();
    await Promise.all([firstB, secondB]);
    expect(activeB.handle.createWritable).toHaveBeenCalledTimes(2);
    finishA();
    await writeA;
  });
});

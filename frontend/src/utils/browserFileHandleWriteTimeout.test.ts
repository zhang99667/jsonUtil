import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS,
  writeTextToFileHandleQueued,
} from './browserFileHandleWrite';

const createHandle = (write: () => Promise<void>) => {
  const writable = {
    write: vi.fn(write),
    close: vi.fn(async () => undefined),
    abort: vi.fn(async () => undefined),
  };
  return {
    handle: {
      createWritable: vi.fn(async () => writable),
    } as unknown as FileSystemFileHandle,
    writable,
  };
};

describe('browserFileHandleWrite 入口比较超时', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('入口比较永久等待时拒绝本次写入并恢复无关文件登记', async () => {
    vi.useFakeTimers();
    let finishActiveWrite = () => undefined;
    const active = createHandle(
      () => new Promise<void>(resolve => { finishActiveWrite = resolve; }),
    );
    const activeWrite = writeTextToFileHandleQueued(active.handle, 'active');
    await vi.advanceTimersByTimeAsync(0);
    expect(active.handle.createWritable).toHaveBeenCalledOnce();

    const blockedHandle = {
      createWritable: vi.fn(),
      isSameEntry: vi.fn(() => new Promise<boolean>(() => undefined)),
    } as unknown as FileSystemFileHandle;
    let comparisonError: unknown;
    void writeTextToFileHandleQueued(blockedHandle, 'blocked').catch(error => {
      comparisonError = error;
    });
    const independent = createHandle(async () => undefined);
    const independentWrite = writeTextToFileHandleQueued(independent.handle, 'independent');
    await vi.advanceTimersByTimeAsync(FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS);

    expect(comparisonError).toMatchObject({
      name: 'TimeoutError',
      message: '文件句柄入口比较超时',
    });
    expect(blockedHandle.createWritable).not.toHaveBeenCalled();
    expect(independent.handle.createWritable).toHaveBeenCalledOnce();
    await independentWrite;

    finishActiveWrite();
    await activeWrite;
  });
});

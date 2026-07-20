import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  writeTextToFileHandle,
  writeTextToFileHandleQueued,
} from './browserFileHandleWrite';

const createWritable = (write: () => Promise<void>, events: string[], label: string) => ({
  write: vi.fn(async () => {
    events.push(`${label}写入开始`);
    await write();
    events.push(`${label}写入结束`);
  }),
  close: vi.fn(async () => { events.push(`${label}关闭`); }),
  abort: vi.fn(async () => undefined),
});

const createHandle = (writable: ReturnType<typeof createWritable>) => ({
  createWritable: vi.fn(async () => writable),
}) as unknown as FileSystemFileHandle;

describe('browserFileHandleWrite', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('写入成功时按写入、关闭顺序提交', async () => {
    const events: string[] = [];
    const writable = createWritable(async () => undefined, events, '文件');

    await writeTextToFileHandle(createHandle(writable), '{"saved":true}');

    expect(writable.write).toHaveBeenCalledWith('{"saved":true}');
    expect(writable.close).toHaveBeenCalledOnce();
    expect(writable.abort).not.toHaveBeenCalled();
    expect(events).toEqual(['文件写入开始', '文件写入结束', '文件关闭']);
  });

  it.each(['write', 'close'] as const)('%s 失败时尽力中止写入流并保留原始异常', async failureStage => {
    const error = new DOMException('写入阶段失败', 'AbortError');
    const writable = {
      write: vi.fn(async () => {
        if (failureStage === 'write') throw error;
      }),
      close: vi.fn(async () => {
        if (failureStage === 'close') throw error;
      }),
      abort: vi.fn(async () => { throw new Error('中止失败'); }),
    };
    const handle = { createWritable: vi.fn(async () => writable) } as unknown as FileSystemFileHandle;

    await expect(writeTextToFileHandle(handle, '{}')).rejects.toBe(error);

    expect(writable.abort).toHaveBeenCalledWith(error);
    if (failureStage === 'write') expect(writable.close).not.toHaveBeenCalled();
  });

  it('同一句柄串行写入，不同句柄保持独立', async () => {
    const events: string[] = [];
    let finishFirstWrite = () => undefined;
    const firstWritable = createWritable(
      () => new Promise<void>(resolve => { finishFirstWrite = resolve; }),
      events,
      '首个',
    );
    const secondWritable = createWritable(async () => undefined, events, '第二个');
    const createWritableForSameHandle = vi.fn()
      .mockResolvedValueOnce(firstWritable)
      .mockResolvedValueOnce(secondWritable);
    const handle = { createWritable: createWritableForSameHandle } as unknown as FileSystemFileHandle;
    const otherWritable = createWritable(async () => undefined, events, '其它句柄');

    const firstWrite = writeTextToFileHandleQueued(handle, 'first');
    const secondWrite = writeTextToFileHandleQueued(handle, 'second');
    await writeTextToFileHandleQueued(createHandle(otherWritable), 'other');
    await vi.waitFor(() => expect(events).toContain('首个写入开始'));

    expect(createWritableForSameHandle).toHaveBeenCalledOnce();
    expect(events).toContain('其它句柄写入开始');
    expect(events).not.toContain('第二个写入开始');

    finishFirstWrite();
    await Promise.all([firstWrite, secondWrite]);

    expect(events.indexOf('首个关闭')).toBeLessThan(events.indexOf('第二个写入开始'));
  });

  it('不同句柄指向同一磁盘入口时串行写入', async () => {
    const events: string[] = [];
    let finishFirstWrite = () => undefined;
    let registrationChecked = () => undefined;
    const registrationCheck = new Promise<void>(resolve => { registrationChecked = resolve; });
    const firstWritable = createWritable(
      () => new Promise<void>(resolve => { finishFirstWrite = resolve; }),
      events,
      '首个',
    );
    const secondWritable = createWritable(async () => undefined, events, '第二个');
    const secondHandle = {
      createWritable: vi.fn(async () => { registrationChecked(); return secondWritable; }),
    } as unknown as FileSystemFileHandle;
    const firstHandle = {
      createWritable: vi.fn(async () => firstWritable),
      isSameEntry: vi.fn(async candidate => { registrationChecked(); return candidate === secondHandle; }),
    } as unknown as FileSystemFileHandle;

    const firstWrite = writeTextToFileHandleQueued(firstHandle, 'first');
    const secondWrite = writeTextToFileHandleQueued(secondHandle, 'second');
    await registrationCheck;

    expect(secondHandle.createWritable).not.toHaveBeenCalled();
    expect(firstHandle.isSameEntry).toHaveBeenCalledWith(secondHandle);
    finishFirstWrite();
    await Promise.all([firstWrite, secondWrite]);

    expect(events.indexOf('首个关闭')).toBeLessThan(events.indexOf('第二个写入开始'));
  });

  it('入口比较失败时拒绝本次写入且后续登记仍可继续', async () => {
    const events: string[] = [];
    let finishActiveWrite = () => undefined;
    const activeHandle = createHandle(createWritable(
      () => new Promise<void>(resolve => { finishActiveWrite = resolve; }),
      events,
      '活动',
    ));
    const activeWrite = writeTextToFileHandleQueued(activeHandle, 'active');
    await vi.waitFor(() => expect(activeHandle.createWritable).toHaveBeenCalledOnce());
    const comparisonError = new DOMException('句柄已失效', 'InvalidStateError');
    const rejectedHandle = {
      createWritable: vi.fn(),
      isSameEntry: vi.fn(async () => { throw comparisonError; }),
    } as unknown as FileSystemFileHandle;

    await expect(writeTextToFileHandleQueued(rejectedHandle, 'rejected')).rejects.toBe(comparisonError);
    expect(rejectedHandle.createWritable).not.toHaveBeenCalled();
    const independentHandle = createHandle(createWritable(async () => undefined, events, '独立'));
    await expect(writeTextToFileHandleQueued(independentHandle, 'independent')).resolves.toBeUndefined();

    finishActiveWrite();
    await activeWrite;
  });
});

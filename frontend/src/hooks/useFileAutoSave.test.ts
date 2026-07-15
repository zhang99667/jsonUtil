import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));
const fileSaveMocks = vi.hoisted(() => ({ writeTextToFileHandleQueued: vi.fn() }));
const toastMocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));
vi.mock('../utils/browserFileHandleWrite', () => fileSaveMocks);
vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));

import { FILE_AUTO_SAVE_DEBOUNCE_MS, useFileAutoSave } from './useFileAutoSave';

const createFile = (handle?: FileSystemFileHandle): FileTab => ({
  id: 'file-1',
  name: 'sample.json',
  content: '{"draft":1}',
  savedContent: '{"saved":0}',
  handle,
  isDirty: true,
  mode: TransformMode.NONE,
});

describe('useFileAutoSave', () => {
  let previousDependencies: readonly unknown[] | undefined;
  let cleanup: (() => void) | undefined;
  let memoizedCallback: (() => void) | undefined;
  let timerRef: { current: ReturnType<typeof setTimeout> | null };
  let setFiles: ReturnType<typeof vi.fn>;

  const useAutoSaveScenario = (activeFile: FileTab | undefined, input: string, isEnabled = true) => {
    return useFileAutoSave({
      activeFile,
      input,
      isEnabled,
      setFiles: setFiles as Parameters<typeof useFileAutoSave>[0]['setFiles'],
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    previousDependencies = undefined;
    cleanup = undefined;
    memoizedCallback = undefined;
    timerRef = { current: null };
    setFiles = vi.fn();
    fileSaveMocks.writeTextToFileHandleQueued.mockReset().mockResolvedValue(undefined);
    reactMocks.useCallback.mockImplementation(callback => {
      memoizedCallback ??= callback;
      return memoizedCallback;
    });
    reactMocks.useRef.mockImplementation(() => timerRef);
    reactMocks.useEffect.mockImplementation((effect, dependencies) => {
      const nextDependencies = dependencies as readonly unknown[];
      const unchanged = previousDependencies?.length === nextDependencies.length
        && previousDependencies.every((dependency, index) => Object.is(dependency, nextDependencies[index]));
      if (unchanged) return;

      cleanup?.();
      previousDependencies = nextDependencies;
      const nextCleanup = effect();
      cleanup = typeof nextCleanup === 'function' ? nextCleanup : undefined;
    });
  });

  afterEach(() => {
    cleanup?.();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('关闭、缺少句柄或内容未变化时不调度写入', async () => {
    const handle = {} as FileSystemFileHandle;
    useAutoSaveScenario(createFile(handle), '{"draft":1}', false);
    useAutoSaveScenario(createFile(), '{"draft":1}');
    useAutoSaveScenario({ ...createFile(handle), savedContent: '{"draft":1}' }, '{"draft":1}');

    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS);

    expect(fileSaveMocks.writeTextToFileHandleQueued).not.toHaveBeenCalled();
  });

  it('输入变化时取消旧防抖并只写入最新快照', async () => {
    const handle = {} as FileSystemFileHandle;
    useAutoSaveScenario(createFile(handle), '{"draft":1}');
    useAutoSaveScenario(createFile(handle), '{"draft":2}');

    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS - 1);
    expect(fileSaveMocks.writeTextToFileHandleQueued).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledOnce();
    expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle, '{"draft":2}');
  });

  it('手动写入开始前可取消尚未触发的自动保存', async () => {
    const file = createFile({} as FileSystemFileHandle);
    const cancelPendingAutoSave = useAutoSaveScenario(file, file.content);

    cancelPendingAutoSave();
    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS);

    expect(fileSaveMocks.writeTextToFileHandleQueued).not.toHaveBeenCalled();
  });

  it('无关文件元数据变化不会重启防抖', async () => {
    const handle = {} as FileSystemFileHandle;
    const file = createFile(handle);
    useAutoSaveScenario(file, file.content);
    await vi.advanceTimersByTimeAsync(600);
    useAutoSaveScenario({ ...file, viewState: { lineNumber: 2 } }, file.content);
    await vi.advanceTimersByTimeAsync(400);

    expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle, file.content);
  });

  it('写入完成后确认旧快照并保留之后的编辑', async () => {
    const handle = {} as FileSystemFileHandle;
    const file = createFile(handle);
    useAutoSaveScenario(file, file.content);
    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS);

    const updateFiles = setFiles.mock.calls[0][0] as (files: FileTab[]) => FileTab[];
    const editedFile = { ...file, content: '{"draft":2}' };

    expect(updateFiles([editedFile])[0]).toMatchObject({
      content: '{"draft":2}',
      savedContent: '{"draft":1}',
      isDirty: true,
    });
  });

  it('写入期间句柄被替换时不确认旧句柄快照', async () => {
    let finishWrite = () => undefined;
    fileSaveMocks.writeTextToFileHandleQueued.mockImplementation(() => new Promise<void>(resolve => {
      finishWrite = resolve;
    }));
    const oldHandle = {} as FileSystemFileHandle;
    const nextHandle = {} as FileSystemFileHandle;
    const file = createFile(oldHandle);
    useAutoSaveScenario(file, file.content);
    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS);
    useAutoSaveScenario({ ...file, handle: nextHandle, savedContent: file.content }, file.content);
    finishWrite();
    await vi.waitFor(() => expect(setFiles).toHaveBeenCalledOnce());

    const updateFiles = setFiles.mock.calls[0][0] as (files: FileTab[]) => FileTab[];
    const reboundFile = { ...file, handle: nextHandle };
    expect(updateFiles([reboundFile])[0]).toBe(reboundFile);
  });

  it('写入失败时保留状态并显示详细错误', async () => {
    const error = new Error('磁盘已满');
    fileSaveMocks.writeTextToFileHandleQueued.mockRejectedValue(error);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = createFile({} as FileSystemFileHandle);
    useAutoSaveScenario(file, file.content);
    await vi.advanceTimersByTimeAsync(FILE_AUTO_SAVE_DEBOUNCE_MS);

    expect(setFiles).not.toHaveBeenCalled();
    expect(toastMocks.toast.error).toHaveBeenCalledWith('自动保存失败：磁盘已满', { duration: 3000 });
  });
});

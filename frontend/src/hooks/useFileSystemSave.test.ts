import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { applyWorkspaceStateUpdate, createWorkspaceFileTabState, type WorkspaceStateUpdate } from './fileSystemTestState';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn(() => undefined),
  useRef: vi.fn((value: unknown) => ({ current: value })),
  useState: vi.fn(),
}));

const fileSaveMocks = vi.hoisted(() => ({
  areFileHandlesSameEntry: vi.fn(),
  triggerTextDownload: vi.fn(),
  writeTextToFileHandleQueued: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useLayoutEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));
vi.mock('../utils/browserFileHandleWrite', () => ({
  areFileHandlesSameEntry: fileSaveMocks.areFileHandlesSameEntry,
  writeTextToFileHandleQueued: fileSaveMocks.writeTextToFileHandleQueued,
}));
vi.mock('../utils/browserFileSave', () => ({
  triggerTextDownload: fileSaveMocks.triggerTextDownload,
}));
vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));

import { useFileSystem } from './useFileSystem';

const createFile = (content: string, handle?: FileSystemFileHandle): FileTab => ({
  id: 'file-1',
  name: 'sample.json',
  content,
  savedContent: '{"saved":0}',
  handle,
  isDirty: true,
  mode: TransformMode.NONE,
});

const useFileSystemScenario = (
  file: FileTab,
  otherFiles: FileTab[] = [],
  activeFileId: string | null = file.id,
  mode = TransformMode.NONE,
) => {
  let stateIndex = 0;
  let currentWorkspaceState = createWorkspaceFileTabState([file, ...otherFiles], activeFileId);
  const setFiles = vi.fn((update: WorkspaceStateUpdate) => {
    currentWorkspaceState = applyWorkspaceStateUpdate(currentWorkspaceState, update);
  });
  reactMocks.useState.mockImplementation(() => {
    const values = [
      [null, vi.fn()],
      [currentWorkspaceState, setFiles],
      [false, vi.fn()],
    ];
    return values[stateIndex++] ?? [null, vi.fn()];
  });
  const inputRef = { current: file.content };
  const onBeforeSourceWorkspaceChange = vi.fn();
  const setInput = vi.fn();
  const fileSystem = useFileSystem({
    input: file.content,
    setInput,
    inputRef,
    mode,
    setMode: vi.fn(),
    onBeforeSourceWorkspaceChange,
  });

  return {
    fileSystem,
    getWorkspaceState: () => currentWorkspaceState,
    inputRef,
    onBeforeSourceWorkspaceChange,
    setFiles,
    setInput,
  };
};

const preparePendingWrite = () => {
  let finishWrite = () => undefined;
  fileSaveMocks.writeTextToFileHandleQueued.mockImplementation(() => new Promise<void>(resolve => { finishWrite = resolve; }));
  return () => finishWrite();
};

describe('useFileSystem 保存边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileSaveMocks.areFileHandlesSameEntry.mockReset().mockResolvedValue(false);
    fileSaveMocks.triggerTextDownload.mockReset();
    fileSaveMocks.writeTextToFileHandleQueued.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('用户取消另存为选择器时保持静默', async () => {
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('用户取消', 'AbortError')),
    });
    const scenario = useFileSystemScenario(createFile('{"draft":1}'));

    await expect(scenario.fileSystem.saveSourceAs()).resolves.toBe(false);

    expect(fileSaveMocks.writeTextToFileHandleQueued).not.toHaveBeenCalled();
    expect(toastMocks.toast.error).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(scenario.setFiles).not.toHaveBeenCalled();
  });

  it('另存为写入阶段的 AbortError 不会被误判为用户取消', async () => {
    const handle = { name: 'saved.json' } as FileSystemFileHandle;
    const error = new DOMException('磁盘访问被拒绝', 'AbortError');
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockResolvedValue(handle),
    });
    fileSaveMocks.writeTextToFileHandleQueued.mockRejectedValue(error);
    const scenario = useFileSystemScenario(createFile('{"draft":1}'));

    await expect(scenario.fileSystem.saveSourceAs()).resolves.toBe(false);

    expect(toastMocks.toast.error).toHaveBeenCalledWith('另存为失败：磁盘访问被拒绝', {
      duration: 3000,
    });
    expect(console.error).toHaveBeenCalledWith('源内容另存为失败:', error);
    expect(scenario.setFiles).not.toHaveBeenCalled();
  });

  it('下载回退只确认已发起下载并保持未保存状态', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: {} });
    const file = createFile('{"draft":1}');
    const scenario = useFileSystemScenario(file);

    await expect(scenario.fileSystem.saveSourceAs()).resolves.toBe(false);

    expect(fileSaveMocks.triggerTextDownload).toHaveBeenCalledWith({
      text: file.content,
      fileName: file.name,
      mimeType: 'text/plain',
    });
    expect(toastMocks.toast).toHaveBeenCalledWith(
      '已开始下载；浏览器无法确认文件是否已落盘，当前内容仍标记为未保存',
      { duration: 4000 },
    );
    expect(scenario.setFiles).not.toHaveBeenCalled();
  });

  it('保存期间继续编辑时只确认旧快照并保留新内容为未保存', async () => {
    const finishWrite = preparePendingWrite();
    const handle = { name: 'sample.json' } as FileSystemFileHandle;
    const file = createFile('{"draft":1}', handle);
    const scenario = useFileSystemScenario(file);

    const savePromise = scenario.fileSystem.saveFile();
    scenario.inputRef.current = '{"draft":2}';
    scenario.fileSystem.updateActiveFileContent('{"draft":2}');
    finishWrite();
    await expect(savePromise).resolves.toBe(true);

    expect(scenario.getWorkspaceState().files[0]).toMatchObject({
      content: '{"draft":2}',
      savedContent: '{"draft":1}',
      isDirty: true,
    });
  });

  it('保存 PREVIEW 期间继续编辑时不覆盖当前 SOURCE', async () => {
    const finishWrite = preparePendingWrite();
    const handle = { name: 'sample.json' } as FileSystemFileHandle;
    const file = createFile('{"source":1}', handle);
    const scenario = useFileSystemScenario(file);

    const savePromise = scenario.fileSystem.saveFile('{"preview":true}');
    scenario.inputRef.current = '{"source":2}';
    scenario.fileSystem.updateActiveFileContent('{"source":2}');
    finishWrite();
    await expect(savePromise).resolves.toBe(true);

    expect(scenario.onBeforeSourceWorkspaceChange).not.toHaveBeenCalled();
    expect(scenario.getWorkspaceState().files[0]).toMatchObject({
      content: '{"source":2}',
      savedContent: '{"preview":true}',
      isDirty: true,
    });
  });

  it('保存 PREVIEW 期间切走再切回同内容标签时不覆盖后来恢复的 SOURCE', async () => {
    const finishWrite = preparePendingWrite();
    const handle = { name: 'sample.json' } as FileSystemFileHandle;
    const file = createFile('{"source":1}', handle);
    const nextFile = { ...createFile('{"source":1}'), id: 'file-2', name: 'next.json' };
    const scenario = useFileSystemScenario(file, [nextFile]);

    const savePromise = scenario.fileSystem.saveFile('{"preview":true}');
    scenario.fileSystem.switchTab(nextFile.id);
    scenario.fileSystem.switchTab(file.id);
    finishWrite();
    await expect(savePromise).resolves.toBe(true);

    expect(scenario.onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(2);
    expect(scenario.setInput).not.toHaveBeenCalledWith('{"preview":true}');
  });

  it('无标签草稿另存期间切换到同内容标签时不误激活并保留模式', async () => {
    const finishWrite = preparePendingWrite();
    const handle = { name: 'saved.json' } as FileSystemFileHandle;
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockResolvedValue(handle),
    });
    const file = createFile('{"source":1}');
    const scenario = useFileSystemScenario(file, [], null, TransformMode.FORMAT);

    const savePromise = scenario.fileSystem.saveSourceAs();
    await vi.waitFor(() => expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle, file.content));
    scenario.fileSystem.switchTab(file.id);
    finishWrite();
    await expect(savePromise).resolves.toBe(true);

    expect(scenario.getWorkspaceState().activeFileId).toBe(file.id);
    expect(scenario.getWorkspaceState().files.find(saved => saved.handle === handle)?.mode).toBe(TransformMode.FORMAT);
    expect(scenario.setInput).toHaveBeenCalledTimes(1);
    expect(toastMocks.toast).toHaveBeenCalledWith(
      '保存期间工作区已发生变化，已保留当前编辑状态和已写入快照',
      { duration: 4000 },
    );
  });

  it('同一磁盘入口的别名句柄串行保存后收敛最新快照', async () => {
    const handle2 = { name: 'same.json' } as FileSystemFileHandle;
    const handle1 = { name: 'same.json', isSameEntry: vi.fn(async candidate => candidate === handle2) } as unknown as FileSystemFileHandle;
    const finishWrites = new Map<FileSystemFileHandle, () => void>();
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn().mockResolvedValue(handle2) });
    fileSaveMocks.areFileHandlesSameEntry.mockImplementation((handle, candidate) => handle.isSameEntry(candidate));
    fileSaveMocks.writeTextToFileHandleQueued.mockImplementation(handle => new Promise<void>(resolve => { finishWrites.set(handle, resolve); }));
    const scenario = useFileSystemScenario(createFile('A', handle1));
    const saveAs = scenario.fileSystem.saveSourceAs();
    await vi.waitFor(() => expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle2, 'A'));
    scenario.inputRef.current = 'B';
    scenario.fileSystem.updateActiveFileContent('B');
    const save = scenario.fileSystem.saveFile();
    await vi.waitFor(() => expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle1, 'B'));
    finishWrites.get(handle2)!();
    await expect(saveAs).resolves.toBe(true);
    expect(scenario.getWorkspaceState().files[0]).toMatchObject({ handle: handle2, savedContent: 'A', isDirty: true });
    finishWrites.get(handle1)!();
    await expect(save).resolves.toBe(true);
    expect(handle1).not.toBe(handle2);
    expect(scenario.getWorkspaceState().files[0]).toMatchObject({
      handle: handle2,
      content: 'B',
      savedContent: 'B',
      isDirty: false,
    });
    expect(fileSaveMocks.areFileHandlesSameEntry).toHaveBeenCalledWith(handle1, handle2);
  });
  it('同一标签两次另存乱序完成时只绑定后选句柄', async () => {
    const firstHandle = { name: 'first.json' } as FileSystemFileHandle;
    const secondHandle = { name: 'second.json' } as FileSystemFileHandle;
    let finishFirstWrite = () => undefined;
    let finishSecondWrite = () => undefined;
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockResolvedValueOnce(firstHandle).mockResolvedValueOnce(secondHandle),
    });
    fileSaveMocks.writeTextToFileHandleQueued.mockImplementation(handle => new Promise<void>(resolve => {
      if (handle === firstHandle) finishFirstWrite = resolve;
      if (handle === secondHandle) finishSecondWrite = resolve;
    }));
    const scenario = useFileSystemScenario(createFile('{"draft":1}'));
    const firstSave = scenario.fileSystem.saveSourceAs();
    await vi.waitFor(() => expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(firstHandle, '{"draft":1}'));
    const secondSave = scenario.fileSystem.saveSourceAs();
    await vi.waitFor(() => expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(secondHandle, '{"draft":1}'));
    finishSecondWrite();
    await expect(secondSave).resolves.toBe(true);
    finishFirstWrite();
    await expect(firstSave).resolves.toBe(true);
    expect(scenario.setFiles).toHaveBeenCalledTimes(1);
    expect(scenario.getWorkspaceState().files[0]).toMatchObject({ name: 'second.json', handle: secondHandle });
  });
});

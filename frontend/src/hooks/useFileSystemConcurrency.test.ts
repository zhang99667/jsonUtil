import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import {
  createWorkspaceFileTabState,
  reduceWorkspaceStateUpdates,
  type WorkspaceStateUpdate,
} from './fileSystemTestState';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn(() => undefined),
  useRef: vi.fn((value: unknown) => ({ current: value })),
  useState: vi.fn(),
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
vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));
import { useFileSystem } from './useFileSystem';

const createTab = (id: string, content: string): FileTab => ({
  id,
  name: `${id}.json`,
  content,
  savedContent: content,
  isDirty: false,
  mode: TransformMode.NONE,
});

const createOpenedFile = (name: string, content: string | Promise<string>): File => ({
  name,
  size: 20,
  type: 'application/json',
  text: vi.fn(() => Promise.resolve(content)),
}) as unknown as File;

const createDeferred = <T>() => {
  let resolve = (_value: T) => undefined;
  const promise = new Promise<T>(finish => {
    resolve = finish;
  });
  return { promise, resolve };
};

const useQueuedFileSystemScenario = (files: FileTab[], activeFileId: string) => {
  let stateIndex = 0;
  const initialWorkspaceState = createWorkspaceFileTabState(files, activeFileId);
  const pendingWorkspaceUpdates: WorkspaceStateUpdate[] = [];
  const setWorkspaceState = vi.fn((update: WorkspaceStateUpdate) => pendingWorkspaceUpdates.push(update));
  reactMocks.useState.mockImplementation(() => {
    const values = [
      [null, vi.fn()],
      [initialWorkspaceState, setWorkspaceState],
      [false, vi.fn()],
    ];
    return values[stateIndex++] ?? [null, vi.fn()];
  });

  const input = files.find(file => file.id === activeFileId)?.content ?? '';
  const inputRef = { current: input };
  const fileSystem = useFileSystem({
    input,
    inputRef,
    mode: TransformMode.NONE,
    setInput: vi.fn(),
    setMode: vi.fn(),
  });

  const flushWorkspaceUpdates = () => reduceWorkspaceStateUpdates(
    initialWorkspaceState, pendingWorkspaceUpdates,
  );

  return { fileSystem, flushWorkspaceUpdates, inputRef };
};

describe('useFileSystem 并发标签更新', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('异步打开与同批新建都保留', async () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"before":true}'),
    ], 'file-1');

    await scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', '{"opened":true}'),
    ]);
    scenario.fileSystem.createNewTab();

    expect(scenario.flushWorkspaceUpdates().files.map(file => file.name)).toEqual([
      'file-1.json',
      'opened.json',
      'Untitled-1',
    ]);
  });

  it('同批连续新建保留两个递增命名的标签', () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"before":true}'),
    ], 'file-1');

    scenario.fileSystem.createNewTab();
    scenario.fileSystem.createNewTab();

    expect(scenario.flushWorkspaceUpdates().files.map(file => file.name)).toEqual([
      'file-1.json', 'Untitled-1', 'Untitled-2',
    ]);
  });

  it('同批新建后关闭新标签会回到原标签', () => {
    const newFileId = '00000000-0000-4000-8000-000000000001';
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(newFileId);
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"before":true}'),
    ], 'file-1');

    scenario.fileSystem.createNewTab();
    scenario.fileSystem.closeFile(newFileId);

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.id)).toEqual(['file-1']);
    expect(finalState.activeFileId).toBe('file-1');
  });

  it('异步打开与同批关闭不丢文件或覆盖新活动标签', async () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"first":true}'),
      createTab('file-2', '{"second":true}'),
    ], 'file-1');

    await scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', '{"opened":true}'),
    ]);
    scenario.fileSystem.closeFile('file-1');

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.name)).toEqual([
      'file-2.json',
      'opened.json',
    ]);
    expect(finalState.activeFileId).toBe(finalState.files.at(-1)?.id);
  });

  it('不再激活的异步打开与关闭最后旧标签同批时激活新文件', async () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"before":true}'),
    ], 'file-1');

    const openPromise = scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', '{"opened":true}'),
    ]);
    scenario.inputRef.current = '{"edited":true}';
    scenario.fileSystem.updateActiveFileContent('{"edited":true}');
    await openPromise;
    scenario.fileSystem.closeFile('file-1');

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.name)).toEqual(['opened.json']);
    expect(finalState.activeFileId).toBe(finalState.files[0].id);
  });

  it('关闭最后标签后才完成的慢打开会激活新文件', async () => {
    const deferred = createDeferred<string>();
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"before":true}'),
    ], 'file-1');

    const openPromise = scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', deferred.promise),
    ]);
    scenario.fileSystem.closeFile('file-1');
    deferred.resolve('{"opened":true}');
    await openPromise;

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.name)).toEqual(['opened.json']);
    expect(finalState.activeFileId).toBe(finalState.files[0].id);
  });

  it('切换后关闭目标标签会阻止更早的慢打开抢回活动项', async () => {
    const deferred = createDeferred<string>();
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"first":true}'),
      createTab('file-2', '{"second":true}'),
    ], 'file-1');

    scenario.fileSystem.switchTab('file-2');
    const openPromise = scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', deferred.promise),
    ]);
    scenario.fileSystem.closeFile('file-2');
    deferred.resolve('{"opened":true}');
    await openPromise;

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.name)).toEqual(['file-1.json', 'opened.json']);
    expect(finalState.activeFileId).toBe('file-1');
  });

  it('同批连续关闭不会选中已排队关闭的标签', () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"first":true}'),
      createTab('file-2', '{"second":true}'),
      createTab('file-3', '{"third":true}'),
    ], 'file-2');

    scenario.fileSystem.closeFile('file-2');
    scenario.fileSystem.closeFile('file-3');

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.id)).toEqual(['file-1']);
    expect(finalState.activeFileId).toBe('file-1');
  });

  it('同批关闭后不能切回已排队关闭的标签', () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"first":true}'),
      createTab('file-2', '{"second":true}'),
    ], 'file-1');

    scenario.fileSystem.closeFile('file-1');
    scenario.fileSystem.switchTab('file-1');

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.map(file => file.id)).toEqual(['file-2']);
    expect(finalState.activeFileId).toBe('file-2');
  });

  it('同批切换后编辑只更新新的活动标签', () => {
    const scenario = useQueuedFileSystemScenario([
      createTab('file-1', '{"first":true}'),
      createTab('file-2', '{"second":true}'),
    ], 'file-1');

    scenario.fileSystem.switchTab('file-2');
    scenario.fileSystem.updateActiveFileContent('{"edited":true}');

    const finalState = scenario.flushWorkspaceUpdates();
    expect(finalState.files.find(file => file.id === 'file-1')?.content).toBe('{"first":true}');
    expect(finalState.files.find(file => file.id === 'file-2')?.content).toBe('{"edited":true}');
  });

  it('同批切换后保存只写入新的活动标签', async () => {
    const firstWritable = { write: vi.fn(), close: vi.fn() };
    const secondWritable = { write: vi.fn(), close: vi.fn() };
    const scenario = useQueuedFileSystemScenario([
      {
        ...createTab('file-1', '{"first":true}'),
        handle: { createWritable: vi.fn().mockResolvedValue(firstWritable) } as unknown as FileSystemFileHandle,
      },
      {
        ...createTab('file-2', '{"second":true}'),
        handle: { createWritable: vi.fn().mockResolvedValue(secondWritable) } as unknown as FileSystemFileHandle,
      },
    ], 'file-1');

    scenario.fileSystem.switchTab('file-2');
    await scenario.fileSystem.saveFile();

    expect(firstWritable.write).not.toHaveBeenCalled();
    expect(secondWritable.write).toHaveBeenCalledWith('{"second":true}');
  });

  it.each([
    ['SOURCE', undefined, '{"source":2}'],
    ['PREVIEW', '{"preview":true}', '{"source":1}'],
  ])('旧%s保存晚到时不污染已重新绑定的文件', async (_label, savedContent, currentSource) => {
    const oldWrite = createDeferred<void>();
    const oldHandle = {
      name: 'old.json',
      createWritable: vi.fn().mockResolvedValue({ write: vi.fn(() => oldWrite.promise), close: vi.fn() }),
    } as unknown as FileSystemFileHandle;
    const newHandle = {
      name: 'new.json',
      createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }),
    } as unknown as FileSystemFileHandle;
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn().mockResolvedValue(newHandle) });
    const scenario = useQueuedFileSystemScenario([
      { ...createTab('file-1', '{"source":1}'), handle: oldHandle },
    ], 'file-1');
    const oldSave = scenario.fileSystem.saveFile(savedContent);
    if (scenario.inputRef.current !== currentSource) {
      scenario.inputRef.current = currentSource;
      scenario.fileSystem.updateActiveFileContent(currentSource);
    }
    await expect(scenario.fileSystem.saveSourceAs()).resolves.toBe(true);
    oldWrite.resolve();
    await expect(oldSave).resolves.toBe(true);

    expect(scenario.inputRef.current).toBe(currentSource);
    expect(scenario.flushWorkspaceUpdates().files[0]).toMatchObject({
      handle: newHandle, content: currentSource, savedContent: currentSource, isDirty: false,
    });
  });
});

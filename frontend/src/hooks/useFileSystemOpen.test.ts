import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import {
  applyWorkspaceStateUpdate,
  createWorkspaceFileTabState,
  type WorkspaceStateUpdate,
} from './fileSystemTestState';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn(() => undefined),
  useLayoutEffect: vi.fn<(_: () => void) => void>(),
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
  useLayoutEffect: reactMocks.useLayoutEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));
vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));
import { useFileSystem } from './useFileSystem';
import { useFileOpenRequestGuard } from './useFileOpenRequestGuard';

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

const createDeferredText = () => {
  let resolve = (_content: string) => undefined;
  const promise = new Promise<string>(finish => {
    resolve = finish;
  });
  return { promise, resolve };
};

interface ScenarioOptions {
  files: FileTab[];
  activeFileId?: string | null;
  input?: string;
  mode?: TransformMode;
}

const useFileSystemScenario = ({
  files,
  activeFileId = files[0]?.id ?? null,
  input = files.find(file => file.id === activeFileId)?.content ?? '',
  mode = TransformMode.NONE,
}: ScenarioOptions) => {
  let currentWorkspaceState = createWorkspaceFileTabState(files, activeFileId);
  let stateIndex = 0;
  const setWorkspaceState = vi.fn((update: WorkspaceStateUpdate) => {
    currentWorkspaceState = applyWorkspaceStateUpdate(currentWorkspaceState, update);
  });
  reactMocks.useState.mockImplementation(() => {
    const values = [
      [null, vi.fn()],
      [currentWorkspaceState, setWorkspaceState],
      [false, vi.fn()],
    ];
    return values[stateIndex++] ?? [null, vi.fn()];
  });
  const inputRef = { current: input };
  const setInput = vi.fn();
  const setMode = vi.fn();
  const fileSystem = useFileSystem({
    input,
    inputRef,
    mode,
    setInput,
    setMode,
    onBeforeSourceWorkspaceChange: vi.fn(),
  });

  return {
    fileSystem,
    getActiveFileId: () => currentWorkspaceState.activeFileId,
    getFiles: () => currentWorkspaceState.files,
    inputRef,
    replaceFiles: (nextFiles: FileTab[]) => {
      fileSystem.setFiles(nextFiles);
    },
    setWorkspaceState,
    setInput,
    setMode,
  };
};

describe('useFileSystem 打开文件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useRef.mockImplementation((value: unknown) => ({ current: value }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('文件读取期间的工作区更新不会被旧数组覆盖', async () => {
    const deferred = createDeferredText();
    const originalFile = createTab('file-1', '{"before":true}');
    const scenario = useFileSystemScenario({ files: [originalFile] });
    const openPromise = scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', deferred.promise),
    ]);
    const latestFiles = [
      { ...originalFile, content: '{"after":true}', isDirty: true },
      createTab('file-2', '{"new":true}'),
    ];
    scenario.replaceFiles(latestFiles);
    deferred.resolve('{"opened":true}');
    await openPromise;

    expect(scenario.getFiles().slice(0, 2)).toEqual(latestFiles);
    expect(scenario.getFiles().at(-1)).toMatchObject({
      name: 'opened.json',
      content: '{"opened":true}',
    });
  });

  it('批量文件句柄部分读取失败时仍打开成功项', async () => {
    const error = new Error('文件权限已失效');
    const openedFile = createOpenedFile('opened.json', '{"opened":true}');
    vi.stubGlobal('window', {
      showOpenFilePicker: vi.fn().mockResolvedValue([
        { getFile: vi.fn().mockRejectedValue(error) },
        { getFile: vi.fn().mockResolvedValue(openedFile) },
      ]),
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const scenario = useFileSystemScenario({ files: [createTab('file-1', '{"before":true}')] });

    await scenario.fileSystem.openFile();

    expect(toastMocks.toast.error).toHaveBeenCalledWith('打开文件失败：文件权限已失效', {
      duration: 3000,
    });
    expect(scenario.getFiles().at(-1)).toMatchObject({ name: 'opened.json' });
    expect(scenario.setInput).toHaveBeenCalledWith('{"opened":true}');
  });

  it('用户取消原生文件选择器时保持工作区和提示静默', async () => {
    vi.stubGlobal('window', {
      showOpenFilePicker: vi.fn().mockRejectedValue(new DOMException('用户取消', 'AbortError')),
    });
    const originalFile = createTab('file-1', '{"before":true}');
    const scenario = useFileSystemScenario({ files: [originalFile] });

    await scenario.fileSystem.openFile();

    expect(scenario.getFiles()).toEqual([originalFile]);
    expect(scenario.setWorkspaceState).not.toHaveBeenCalled();
    expect(scenario.setInput).not.toHaveBeenCalled();
    expect(toastMocks.toast.error).not.toHaveBeenCalled();
  });

  it('拖入空文件集合时不创建请求或改变工作区', async () => {
    const originalFile = createTab('file-1', '{"before":true}');
    const scenario = useFileSystemScenario({ files: [originalFile] });

    await scenario.fileSystem.openDroppedFiles([]);

    expect(scenario.getFiles()).toEqual([originalFile]);
    expect(scenario.setWorkspaceState).not.toHaveBeenCalled();
    expect(scenario.setInput).not.toHaveBeenCalled();
  });

  it('HAR 派生 JSON 清除原文件元数据并标记为未保存', async () => {
    const harText = JSON.stringify({
      log: { entries: [{
        request: { method: 'GET', url: 'https://api.example.com/data' },
        response: { status: 200, content: { mimeType: 'application/json', text: '{"ok":true}' } },
      }] },
    });
    const sourceFile = Object.assign(createOpenedFile('network.har', harText), { path: '/source/network.har' });
    const sourceHandle = { path: '/source/network.har', getFile: vi.fn().mockResolvedValue(sourceFile) };
    vi.stubGlobal('window', { showOpenFilePicker: vi.fn().mockResolvedValue([sourceHandle]) });
    const scenario = useFileSystemScenario({ files: [] });

    await scenario.fileSystem.openFile();

    expect(scenario.getFiles().at(-1)).toMatchObject({
      name: 'network.har.payloads.json',
      savedContent: '',
      handle: undefined,
      path: undefined,
      isDirty: true,
      mode: TransformMode.DEEP_FORMAT,
    });
  });

  it('旧的慢请求只追加文件，不覆盖后发请求激活的内容', async () => {
    const slow = createDeferredText();
    const fast = createDeferredText();
    const scenario = useFileSystemScenario({ files: [createTab('file-1', '{"before":true}')] });

    const slowOpen = scenario.fileSystem.openDroppedFiles([createOpenedFile('slow.json', slow.promise)]);
    const fastOpen = scenario.fileSystem.openDroppedFiles([createOpenedFile('fast.json', fast.promise)]);
    fast.resolve('{"fast":true}');
    await fastOpen;
    slow.resolve('{"slow":true}');
    await slowOpen;

    const fastFile = scenario.getFiles().find(file => file.name === 'fast.json');
    expect(scenario.getFiles().map(file => file.name)).toEqual([
      'file-1.json',
      'fast.json',
      'slow.json',
    ]);
    expect(scenario.getActiveFileId()).toBe(fastFile?.id);
    expect(scenario.setInput).toHaveBeenCalledOnce();
    expect(scenario.setInput).toHaveBeenCalledWith('{"fast":true}');
  });

  it('读取期间继续编辑无标签草稿时保留草稿内容和模式', async () => {
    const deferred = createDeferredText();
    const scenario = useFileSystemScenario({
      files: [],
      activeFileId: null,
      input: '{"draft":1}',
      mode: TransformMode.DEEP_FORMAT,
    });

    const openPromise = scenario.fileSystem.openDroppedFiles([
      createOpenedFile('opened.json', deferred.promise),
    ]);
    scenario.inputRef.current = '{"draft":2}';
    scenario.fileSystem.updateActiveFileContent('{"draft":2}');
    deferred.resolve('{"opened":true}');
    await openPromise;

    const draft = scenario.getFiles().find(file => file.name.startsWith('Untitled'));
    expect(draft).toMatchObject({
      content: '{"draft":2}',
      mode: TransformMode.DEEP_FORMAT,
      isDirty: true,
    });
    expect(scenario.getActiveFileId()).toBe(draft?.id);
    expect(scenario.setInput).not.toHaveBeenCalled();
    expect(scenario.setMode).not.toHaveBeenCalled();
  });

  it('模式提交后在被动副作用前使旧打开请求失效', () => {
    const stateRef = {
      current: { mode: TransformMode.NONE, requestSequence: 0, workspaceRevision: 0 },
    };
    reactMocks.useRef.mockReturnValue(stateRef);
    const inputRef = { current: '{"before":true}' };
    const request = useFileOpenRequestGuard({ inputRef, mode: TransformMode.NONE }).beginRequest();
    const currentGuard = useFileOpenRequestGuard({ inputRef, mode: TransformMode.FORMAT });
    reactMocks.useLayoutEffect.mock.calls.at(-1)?.[0]();
    expect(currentGuard.captureWorkspaceMode()).toBe(TransformMode.FORMAT);
    expect(currentGuard.inspectRequest(request).shouldActivate).toBe(false);
  });
});

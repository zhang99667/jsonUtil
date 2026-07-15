import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import type { WorkspaceDraftSnapshot } from '../utils/workspaceDraft';

type Effect = () => void | (() => void);

const reactMocks = vi.hoisted(() => ({
  effects: [] as Effect[],
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn((effect: Effect) => {
    reactMocks.effects.push(effect);
  }),
  useRef: vi.fn((value: unknown) => ({ current: value })),
}));

const draftMocks = vi.hoisted(() => ({
  build: vi.fn(),
  save: vi.fn(),
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
}));
vi.mock('../utils/workspaceDraft', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/workspaceDraft')>(),
  buildWorkspaceDraftSnapshot: draftMocks.build,
  saveWorkspaceDraftSnapshot: draftMocks.save,
}));
vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));

import { useWorkspaceDraftPersistence } from './useWorkspaceDraftPersistence';

const createFile = (content = '{"draft":true}'): FileTab => ({
  id: 'file-1',
  name: 'draft.json',
  content,
  savedContent: '{"draft":false}',
  isDirty: true,
  mode: TransformMode.FORMAT,
});

const createSnapshot = (overrides: Partial<WorkspaceDraftSnapshot> = {}): WorkspaceDraftSnapshot => ({
  version: 1,
  updatedAt: 1,
  files: [],
  activeFileId: null,
  standaloneInput: '',
  standaloneMode: TransformMode.NONE,
  ...overrides,
});

describe('useWorkspaceDraftPersistence', () => {
  let timerCallback: (() => void) | undefined;
  let visibilityState = 'visible';
  const windowListeners = new Map<string, () => void>();
  const documentListeners = new Map<string, () => void>();
  const windowMock = {
    setTimeout: vi.fn((callback: () => void) => {
      timerCallback = callback;
      return 1;
    }),
    clearTimeout: vi.fn(),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      windowListeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  };
  const documentMock = {
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: vi.fn((type: string, listener: () => void) => {
      documentListeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.effects.length = 0;
    windowListeners.clear();
    documentListeners.clear();
    timerCallback = undefined;
    visibilityState = 'visible';
    draftMocks.save.mockReturnValue(true);
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    {
      name: '活动标签',
      draft: createSnapshot({ files: [createFile()], activeFileId: 'file-1' }),
      content: '{"draft":true}',
      mode: TransformMode.FORMAT,
      message: '已恢复上次未保存标签',
    },
    {
      name: '无标签草稿',
      draft: createSnapshot({
        standaloneInput: '{"standalone":true}',
        standaloneMode: TransformMode.DEEP_FORMAT,
      }),
      content: '{"standalone":true}',
      mode: TransformMode.DEEP_FORMAT,
      message: '已恢复上次未保存草稿',
    },
  ])('恢复$name并跳过首轮持久化', ({ draft, content, mode, message }) => {
    const applySourceState = vi.fn();
    useWorkspaceDraftPersistence({
      restoredDraft: draft,
      files: draft.files,
      activeFileId: draft.activeFileId,
      input: content,
      mode,
      applySourceState,
    });

    reactMocks.effects[0]?.();
    reactMocks.effects[2]?.();

    expect(applySourceState).toHaveBeenCalledWith(content, mode);
    expect(toastMocks.toast.success).toHaveBeenCalledWith(message, { duration: 2000 });
    expect(windowMock.setTimeout).not.toHaveBeenCalled();
  });

  it('防抖保存当前草稿并对连续失败只提示一次', () => {
    const snapshot = createSnapshot({
      standaloneInput: '{"latest":true}',
      standaloneMode: TransformMode.DEEP_FORMAT,
    });
    draftMocks.build.mockReturnValue(snapshot);
    draftMocks.save.mockReturnValue(false);
    useWorkspaceDraftPersistence({
      restoredDraft: null,
      files: [],
      activeFileId: null,
      input: '{"latest":true}',
      mode: TransformMode.DEEP_FORMAT,
      applySourceState: vi.fn(),
    });

    reactMocks.effects[1]?.();
    const cleanup = reactMocks.effects[2]?.();
    timerCallback?.();
    timerCallback?.();

    expect(draftMocks.build).toHaveBeenCalledWith({
      files: [],
      activeFileId: null,
      standaloneInput: '{"latest":true}',
      standaloneMode: TransformMode.DEEP_FORMAT,
    });
    expect(draftMocks.save).toHaveBeenCalledTimes(2);
    expect(toastMocks.toast.error).toHaveBeenCalledTimes(1);
    expect(toastMocks.toast.error).toHaveBeenCalledWith(
      '当前草稿过大或浏览器存储受限，已暂停本地草稿恢复',
      { duration: 4000 },
    );
    expect(cleanup).toBeTypeOf('function');
    if (typeof cleanup === 'function') cleanup();
    expect(windowMock.clearTimeout).toHaveBeenCalledWith(1);
  });

  it('页面隐藏或卸载时静默保存并在清理时移除监听', () => {
    const snapshot = createSnapshot({ standaloneInput: '{"flush":true}' });
    draftMocks.build.mockReturnValue(snapshot);
    draftMocks.save.mockReturnValue(false);
    const flushWorkspaceDraft = useWorkspaceDraftPersistence({
      restoredDraft: null,
      files: [],
      activeFileId: null,
      input: '{"flush":true}',
      mode: TransformMode.NONE,
      applySourceState: vi.fn(),
    });

    const cleanup = reactMocks.effects[3]?.();
    windowListeners.get('beforeunload')?.();
    documentListeners.get('visibilitychange')?.();
    visibilityState = 'hidden';
    documentListeners.get('visibilitychange')?.();
    flushWorkspaceDraft();

    expect(draftMocks.save).toHaveBeenCalledTimes(3);
    expect(toastMocks.toast.error).not.toHaveBeenCalled();
    if (typeof cleanup === 'function') cleanup();
    expect(windowMock.removeEventListener).toHaveBeenCalledWith('beforeunload', flushWorkspaceDraft);
    expect(documentMock.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      documentListeners.get('visibilitychange'),
    );
  });
});

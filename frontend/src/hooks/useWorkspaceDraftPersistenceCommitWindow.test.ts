import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';

type Effect = () => void | (() => void);

const reactMocks = vi.hoisted(() => {
  const refs: Array<{ current: unknown }> = [];
  let refCursor = 0;
  return {
    effects: [] as Effect[],
    layoutEffects: [] as Effect[],
    beginRender: () => {
      refCursor = 0;
    },
    reset: () => {
      refs.length = 0;
      refCursor = 0;
    },
    useCallback: vi.fn((callback: unknown) => callback),
    useEffect: vi.fn((effect: Effect) => {
      reactMocks.effects.push(effect);
    }),
    useLayoutEffect: vi.fn((effect: Effect) => {
      reactMocks.layoutEffects.push(effect);
    }),
    useRef: vi.fn((value: unknown) => {
      const ref = refs[refCursor] || { current: value };
      refs[refCursor] = ref;
      refCursor += 1;
      return ref;
    }),
  };
});

const draftMocks = vi.hoisted(() => ({
  build: vi.fn(),
  save: vi.fn(() => true),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useLayoutEffect: reactMocks.useLayoutEffect,
  useRef: reactMocks.useRef,
}));
vi.mock('../utils/workspaceDraft', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/workspaceDraft')>(),
  buildWorkspaceDraftSnapshot: draftMocks.build,
  saveWorkspaceDraftSnapshot: draftMocks.save,
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

import { useWorkspaceDraftPersistence } from './useWorkspaceDraftPersistence';

describe('useWorkspaceDraftPersistence 提交窗口', () => {
  const windowListeners = new Map<string, () => void>();
  const windowMock = {
    setTimeout: vi.fn(() => 1),
    clearTimeout: vi.fn(),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      windowListeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  };
  const documentMock = {
    visibilityState: 'visible',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.effects.length = 0;
    reactMocks.layoutEffects.length = 0;
    reactMocks.reset();
    windowListeners.clear();
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const WorkspaceDraftPersistenceHarness = (input: string) => {
    reactMocks.beginRender();
    const effectStart = reactMocks.effects.length;
    const layoutEffectStart = reactMocks.layoutEffects.length;
    useWorkspaceDraftPersistence({
      restoredDraft: null,
      files: [],
      activeFileId: null,
      input,
      mode: TransformMode.FORMAT,
      applySourceState: vi.fn(),
    });
    return {
      effects: reactMocks.effects.slice(effectStart),
      layoutEffects: reactMocks.layoutEffects.slice(layoutEffectStart),
    };
  };

  it('新状态提交后立即卸载也保存已提交快照', () => {
    const firstRender = WorkspaceDraftPersistenceHarness('{"version":1}');
    firstRender.layoutEffects.forEach(effect => effect());
    firstRender.effects.forEach(effect => effect());

    const secondRender = WorkspaceDraftPersistenceHarness('{"version":2}');
    secondRender.layoutEffects.forEach(effect => effect());
    windowListeners.get('beforeunload')?.();

    expect(draftMocks.build).toHaveBeenLastCalledWith({
      files: [],
      activeFileId: null,
      standaloneInput: '{"version":2}',
      standaloneMode: TransformMode.FORMAT,
    });
  });
});

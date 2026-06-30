import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileTab } from '../types';
import { useAppFileCloseGuard } from './useAppFileCloseGuard';

const reactMocks = vi.hoisted(() => ({
  setPendingCloseFileId: vi.fn(),
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useMemo: reactMocks.useMemo,
  useState: reactMocks.useState,
}));

const createFile = (overrides: Partial<FileTab> = {}): FileTab => ({
  id: 'clean',
  name: 'clean.json',
  content: '{}',
  isDirty: false,
  ...overrides,
});

const useGuardFixture = (
  overrides: Partial<Parameters<typeof useAppFileCloseGuard>[0]> = {},
  pendingCloseFileId: string | null = null
) => {
  reactMocks.useState.mockReturnValue([pendingCloseFileId, reactMocks.setPendingCloseFileId]);
  const onCloseFile = vi.fn();
  const files = [
    createFile(),
    createFile({ id: 'dirty', name: 'dirty.json', isDirty: true }),
  ];

  const guard = useAppFileCloseGuard({
    files,
    activeFileId: 'clean',
    sourceText: '{}',
    onCloseFile,
    ...overrides,
  });

  return { files, guard, onCloseFile };
};

describe('useAppFileCloseGuard', () => {
  const listeners = new Map<string, EventListener>();

  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('存在脏文件时注册 beforeunload 阻止直接离开页面', () => {
    const { guard } = useGuardFixture();
    const preventDefault = vi.fn();
    const event = { preventDefault, returnValue: undefined } as unknown as BeforeUnloadEvent;

    listeners.get('beforeunload')?.(event);

    expect(guard.hasUnsavedChanges).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(event.returnValue).toBe('');
  });

  it('无脏文件但 SOURCE 有未保存内容时也提示离开确认', () => {
    const { guard } = useGuardFixture({
      files: [createFile()],
      activeFileId: null,
      sourceText: '  {"draft":true}  ',
    });

    expect(guard.hasUnsavedChanges).toBe(true);
  });

  it('无未保存内容时 beforeunload 不拦截', () => {
    const { guard } = useGuardFixture({
      files: [createFile()],
      activeFileId: null,
      sourceText: '   ',
    });
    const preventDefault = vi.fn();
    const event = { preventDefault, returnValue: undefined } as unknown as BeforeUnloadEvent;

    listeners.get('beforeunload')?.(event);

    expect(guard.hasUnsavedChanges).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(event.returnValue).toBeUndefined();
  });

  it('effect 清理时移除 beforeunload 监听', () => {
    let cleanup: (() => void) | undefined;
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useGuardFixture();
    cleanup?.();

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', listeners.get('beforeunload'));
  });

  it('关闭脏文件时进入 pending 状态而不是直接关闭', () => {
    const { guard, onCloseFile } = useGuardFixture();

    guard.requestCloseFile('dirty');

    expect(reactMocks.setPendingCloseFileId).toHaveBeenCalledWith('dirty');
    expect(onCloseFile).not.toHaveBeenCalled();
  });

  it('关闭干净文件时直接调用关闭回调', () => {
    const { guard, onCloseFile } = useGuardFixture();

    guard.requestCloseFile('clean');

    expect(onCloseFile).toHaveBeenCalledWith('clean');
    expect(reactMocks.setPendingCloseFileId).not.toHaveBeenCalled();
  });

  it('确认 pending 关闭时关闭对应文件并清理 pending', () => {
    const { guard, onCloseFile } = useGuardFixture({}, 'dirty');

    guard.confirmPendingCloseFile();

    expect(guard.pendingCloseFile?.name).toBe('dirty.json');
    expect(onCloseFile).toHaveBeenCalledWith('dirty');
    expect(reactMocks.setPendingCloseFileId).toHaveBeenCalledWith(null);
  });

  it('取消 pending 关闭时只清理 pending', () => {
    const { guard, onCloseFile } = useGuardFixture({}, 'dirty');

    guard.cancelPendingCloseFile();

    expect(onCloseFile).not.toHaveBeenCalled();
    expect(reactMocks.setPendingCloseFileId).toHaveBeenCalledWith(null);
  });
});

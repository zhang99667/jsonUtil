import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileTab } from '../types';
import { useAppFileCloseGuard } from './useAppFileCloseGuard';

const beforeUnloadMocks = vi.hoisted(() => ({
  useAppBeforeUnloadGuard: vi.fn(),
}));

const reactMocks = vi.hoisted(() => ({
  setPendingCloseFileId: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('./useAppBeforeUnloadGuard', () => beforeUnloadMocks);

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
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
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it('存在脏文件时把未保存状态同步给 beforeunload guard', () => {
    const { guard } = useGuardFixture();

    expect(guard.hasUnsavedChanges).toBe(true);
    expect(beforeUnloadMocks.useAppBeforeUnloadGuard).toHaveBeenCalledWith(true);
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

    expect(guard.hasUnsavedChanges).toBe(false);
    expect(beforeUnloadMocks.useAppBeforeUnloadGuard).toHaveBeenCalledWith(false);
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

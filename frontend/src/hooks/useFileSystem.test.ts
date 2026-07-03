import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { useFileSystem } from './useFileSystem';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

const toastMocks = vi.hoisted(() => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };
  toast.error = vi.fn();
  toast.success = vi.fn();
  return { toast };
});

vi.mock('react-hot-toast', () => ({
  default: toastMocks.toast,
}));

const createFile = (id: string, content: string, mode = TransformMode.NONE): FileTab => ({
  id,
  name: `${id}.json`,
  content,
  savedContent: content,
  isDirty: false,
  mode,
});

const createHookInput = (events: string[], files: FileTab[], activeFileId: string) => ({
  input: files.find(file => file.id === activeFileId)?.content ?? '',
  setInput: vi.fn(() => events.push('input')),
  inputRef: { current: 'old' },
  mode: TransformMode.NONE,
  setMode: vi.fn(() => events.push('mode')),
  onBeforeSourceWorkspaceChange: vi.fn(() => events.push('before')),
});

const mockReactState = (files: FileTab[], activeFileId: string) => {
  let stateIndex = 0;
  const setFiles = vi.fn();
  const setActiveFileId = vi.fn();
  const setIsAutoSaveEnabled = vi.fn();
  reactMocks.useState.mockImplementation(() => {
    const values = [
      [null, vi.fn()],
      [files, setFiles],
      [activeFileId, setActiveFileId],
      [false, setIsAutoSaveEnabled],
    ];
    return values[stateIndex++] ?? [null, vi.fn()];
  });
};

describe('useFileSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation(() => undefined);
    reactMocks.useRef.mockImplementation((value: unknown) => ({ current: value }));
  });

  it('切换标签替换 SOURCE 和模式前先触发 before-change', () => {
    const events: string[] = [];
    const files = [
      createFile('file-1', '{"a":1}'),
      createFile('file-2', '{"b":2}', TransformMode.DEEP_FORMAT),
    ];
    mockReactState(files, 'file-1');
    const input = createHookInput(events, files, 'file-1');

    const fileSystem = useFileSystem(input);
    fileSystem.switchTab('file-2');

    expect(input.onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(1);
    expect(input.setInput).toHaveBeenCalledWith('{"b":2}');
    expect(input.inputRef.current).toBe('{"b":2}');
    expect(input.setMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(events).toEqual(['before', 'input', 'mode']);
  });

  it('新建标签清空 SOURCE 和模式前先触发 before-change', () => {
    const events: string[] = [];
    const files = [createFile('file-1', '{"a":1}', TransformMode.DEEP_FORMAT)];
    mockReactState(files, 'file-1');
    const input = createHookInput(events, files, 'file-1');

    const fileSystem = useFileSystem(input);
    fileSystem.createNewTab();

    expect(input.onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(1);
    expect(input.setInput).toHaveBeenCalledWith('');
    expect(input.inputRef.current).toBe('');
    expect(input.setMode).toHaveBeenCalledWith(TransformMode.NONE);
    expect(events).toEqual(['before', 'input', 'mode']);
  });

  it('保存 PREVIEW 到文件时先触发 before-change 再写回 SOURCE', async () => {
    const events: string[] = [];
    const writable = { write: vi.fn(), close: vi.fn() };
    const files = [{
      ...createFile('file-1', '{"a":1}'),
      handle: { createWritable: vi.fn().mockResolvedValue(writable) } as unknown as FileSystemFileHandle,
    }];
    mockReactState(files, 'file-1');
    const input = createHookInput(events, files, 'file-1');

    const fileSystem = useFileSystem(input);
    const result = await fileSystem.saveFile('{"preview":true}');

    expect(result).toBe(true);
    expect(writable.write).toHaveBeenCalledWith('{"preview":true}');
    expect(input.onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(1);
    expect(input.setInput).toHaveBeenCalledWith('{"preview":true}');
    expect(input.inputRef.current).toBe('{"preview":true}');
    expect(input.setMode).not.toHaveBeenCalled();
    expect(events).toEqual(['before', 'input']);
  });
});

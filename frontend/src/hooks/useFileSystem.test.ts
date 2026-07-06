import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { useFileSystem } from './useFileSystem';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn(() => undefined),
  useRef: vi.fn((value: unknown) => ({ current: value })),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

const toastMocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({ default: toastMocks.toast }));

const createFile = (id: string, content: string, mode = TransformMode.NONE): FileTab => ({
  id,
  name: `${id}.json`,
  content,
  savedContent: content,
  isDirty: false,
  mode,
});

const useFileSystemScenario = (files: FileTab[], activeFileId = 'file-1') => {
  const events: string[] = [];
  let stateIndex = 0;
  reactMocks.useState.mockImplementation(() => {
    const values = [
      [null, vi.fn()],
      [files, vi.fn()],
      [activeFileId, vi.fn()],
      [false, vi.fn()],
    ];
    return values[stateIndex++] ?? [null, vi.fn()];
  });

  const input = {
    input: files.find(file => file.id === activeFileId)?.content ?? '',
    setInput: vi.fn(() => events.push('input')),
    inputRef: { current: 'old' },
    mode: TransformMode.NONE,
    setMode: vi.fn(() => events.push('mode')),
    onBeforeSourceWorkspaceChange: vi.fn(() => events.push('before')),
  };

  return { events, input, fileSystem: useFileSystem(input) };
};

type FileSystemScenario = ReturnType<typeof useFileSystemScenario>;

const expectSourceStateApplied = ({ input, events }: FileSystemScenario, content: string, mode?: TransformMode) => {
  expect(input.onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(1);
  expect(input.setInput).toHaveBeenCalledWith(content);
  expect(input.inputRef.current).toBe(content);
  if (mode === undefined) expect(input.setMode).not.toHaveBeenCalled();
  else expect(input.setMode).toHaveBeenCalledWith(mode);
  expect(events).toEqual(mode === undefined ? ['before', 'input'] : ['before', 'input', 'mode']);
};

describe('useFileSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('切换标签替换 SOURCE 和模式前先触发 before-change', () => {
    const scenario = useFileSystemScenario([
      createFile('file-1', '{"a":1}'),
      createFile('file-2', '{"b":2}', TransformMode.DEEP_FORMAT),
    ]);

    scenario.fileSystem.switchTab('file-2');

    expectSourceStateApplied(scenario, '{"b":2}', TransformMode.DEEP_FORMAT);
  });

  it('新建标签清空 SOURCE 和模式前先触发 before-change', () => {
    const scenario = useFileSystemScenario([
      createFile('file-1', '{"a":1}', TransformMode.DEEP_FORMAT),
    ]);

    scenario.fileSystem.createNewTab();

    expectSourceStateApplied(scenario, '', TransformMode.NONE);
  });

  it('保存 PREVIEW 到文件时先触发 before-change 再写回 SOURCE', async () => {
    const writable = { write: vi.fn(), close: vi.fn() };
    const scenario = useFileSystemScenario([{
      ...createFile('file-1', '{"a":1}'),
      handle: { createWritable: vi.fn().mockResolvedValue(writable) } as unknown as FileSystemFileHandle,
    }]);

    const result = await scenario.fileSystem.saveFile('{"preview":true}');

    expect(result).toBe(true);
    expect(writable.write).toHaveBeenCalledWith('{"preview":true}');
    expectSourceStateApplied(scenario, '{"preview":true}');
  });
});

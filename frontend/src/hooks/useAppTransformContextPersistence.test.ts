import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab, type TransformContext, type TransformResult } from '../types';
import { useAppTransformContextPersistence } from './useAppTransformContextPersistence';

const mocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
}));

const context: TransformContext = {
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  timestamp: 1,
  originalIndentation: 2,
};

const deepFormatResult: TransformResult = {
  output: '{\n  "a": 1\n}',
  context,
};

const createFiles = (): FileTab[] => [
  { id: 'source-a', name: 'a.json', content: '{"a":1}' },
  { id: 'source-b', name: 'b.json', content: '{"b":1}' },
];

describe('useAppTransformContextPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useEffect.mockImplementation((effect: () => void) => effect());
  });

  it('没有 deep format 结果时不写文件也不写 fallback context', () => {
    const fallbackContextRef = { current: null };
    const onSetFiles = vi.fn();

    useAppTransformContextPersistence({
      activeDeepFormatResult: null,
      activeFileId: 'source-a',
      fallbackContextRef,
      onSetFiles,
    });

    expect(onSetFiles).not.toHaveBeenCalled();
    expect(fallbackContextRef.current).toBeNull();
  });

  it('有活动文件时只把 context 写回当前 Tab', () => {
    const fallbackContextRef = { current: null };
    const onSetFiles = vi.fn();

    useAppTransformContextPersistence({
      activeDeepFormatResult: deepFormatResult,
      activeFileId: 'source-b',
      fallbackContextRef,
      onSetFiles,
    });

    const updateFiles = onSetFiles.mock.calls[0][0];
    const nextFiles = updateFiles(createFiles());

    expect(fallbackContextRef.current).toBeNull();
    expect(nextFiles[0].transformContext).toBeUndefined();
    expect(nextFiles[1].transformContext).toBe(context);
  });

  it('无活动文件时写入 fallback context，避免无 Tab 场景丢失报告上下文', () => {
    const fallbackContextRef = { current: null };
    const onSetFiles = vi.fn();

    useAppTransformContextPersistence({
      activeDeepFormatResult: deepFormatResult,
      activeFileId: null,
      fallbackContextRef,
      onSetFiles,
    });

    expect(onSetFiles).not.toHaveBeenCalled();
    expect(fallbackContextRef.current).toBe(context);
  });
});

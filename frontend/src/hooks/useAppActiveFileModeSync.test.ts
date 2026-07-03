import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { useAppActiveFileModeSync } from './useAppActiveFileModeSync';

const mocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
}));

const createFiles = (): FileTab[] => [
  { id: 'source-a', name: 'a.json', content: '{"a":1}', mode: TransformMode.FORMAT },
  { id: 'source-b', name: 'b.json', content: '{"b":1}', mode: TransformMode.MINIFY },
];

describe('useAppActiveFileModeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useEffect.mockImplementation((effect: () => void) => effect());
  });

  it('没有活动 Tab 时不写入文件模式', () => {
    const onSetFiles = vi.fn();

    useAppActiveFileModeSync({ activeFileId: null, mode: TransformMode.URL_DECODE, onSetFiles });

    expect(onSetFiles).not.toHaveBeenCalled();
  });

  it('有活动 Tab 时只同步当前 Tab 的模式', () => {
    const onSetFiles = vi.fn();

    useAppActiveFileModeSync({ activeFileId: 'source-b', mode: TransformMode.URL_DECODE, onSetFiles });

    const nextFiles = onSetFiles.mock.calls[0][0](createFiles());

    expect(nextFiles[0].mode).toBe(TransformMode.FORMAT);
    expect(nextFiles[1].mode).toBe(TransformMode.URL_DECODE);
  });

  it('当前 Tab 已是同一模式时仍保持原有写回行为', () => {
    const onSetFiles = vi.fn();
    const files = createFiles();

    useAppActiveFileModeSync({ activeFileId: 'source-a', mode: TransformMode.FORMAT, onSetFiles });

    const nextFiles = onSetFiles.mock.calls[0][0](files);

    expect(nextFiles).not.toBe(files);
    expect(nextFiles[0]).not.toBe(files[0]);
    expect(nextFiles[0].mode).toBe(TransformMode.FORMAT);
  });
});

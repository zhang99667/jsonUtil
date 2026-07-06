import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppPreviewDraftFileChangeReset } from './useAppPreviewDraftFileChangeReset';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

describe('useAppPreviewDraftFileChangeReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useEffect.mockImplementation((effect: () => void) => effect());
    reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
  });

  it('首次渲染不取消 PREVIEW 草稿', () => {
    const onCancelOutputDraft = vi.fn();

    useAppPreviewDraftFileChangeReset({ activeFileId: 'file-a', onCancelOutputDraft });

    expect(onCancelOutputDraft).not.toHaveBeenCalled();
  });

  it.each([
    ['file-a', 'file-a', false],
    ['file-a', 'file-b', true],
    [null, 'file-a', true],
    ['file-a', null, true],
  ])('previous=%s next=%s 时按文件变化状态处理 PREVIEW 草稿', (previous, next, shouldCancel) => {
    const lastFileRef = { current: previous };
    const onCancelOutputDraft = vi.fn();
    reactMocks.useRef.mockReturnValue(lastFileRef);

    useAppPreviewDraftFileChangeReset({ activeFileId: next, onCancelOutputDraft });

    expect(lastFileRef.current).toBe(shouldCancel ? next : previous);
    expect(onCancelOutputDraft).toHaveBeenCalledTimes(shouldCancel ? 1 : 0);
  });
});

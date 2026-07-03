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

  it('活动文件未变化时不重复取消 PREVIEW 草稿', () => {
    const lastFileRef = { current: 'file-a' };
    const onCancelOutputDraft = vi.fn();
    reactMocks.useRef.mockReturnValue(lastFileRef);

    useAppPreviewDraftFileChangeReset({ activeFileId: 'file-a', onCancelOutputDraft });

    expect(onCancelOutputDraft).not.toHaveBeenCalled();
    expect(lastFileRef.current).toBe('file-a');
  });

  it.each([
    { previous: 'file-a', next: 'file-b' },
    { previous: null, next: 'file-a' },
    { previous: 'file-a', next: null },
  ])('活动文件在 $previous 和 $next 之间变化时取消 PREVIEW 草稿', ({ previous, next }) => {
    const lastFileRef = { current: previous };
    const onCancelOutputDraft = vi.fn();
    reactMocks.useRef.mockReturnValue(lastFileRef);

    useAppPreviewDraftFileChangeReset({ activeFileId: next, onCancelOutputDraft });

    expect(lastFileRef.current).toBe(next);
    expect(onCancelOutputDraft).toHaveBeenCalledTimes(1);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shouldCancelPreviewDraftOnFileChange, useAppPreviewDraftFileChangeReset } from './useAppPreviewDraftFileChangeReset';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

describe('shouldCancelPreviewDraftOnFileChange', () => {
  it.each([
    ['file-a', 'file-a', false],
    ['file-a', 'file-b', true],
    [null, 'file-a', true],
    ['file-a', null, true],
  ])('previous=%s next=%s 时返回 %s', (previous, next, expected) => {
    expect(shouldCancelPreviewDraftOnFileChange(previous, next)).toBe(expected);
  });
});

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

  it('活动文件变化时更新记录并取消 PREVIEW 草稿', () => {
    const lastFileRef = { current: 'file-a' };
    const onCancelOutputDraft = vi.fn();
    reactMocks.useRef.mockReturnValue(lastFileRef);

    useAppPreviewDraftFileChangeReset({ activeFileId: 'file-b', onCancelOutputDraft });

    expect(lastFileRef.current).toBe('file-b');
    expect(onCancelOutputDraft).toHaveBeenCalledTimes(1);
  });
});

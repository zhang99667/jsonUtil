import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import {
  useAppPreviewSafeModeSetter,
  useAppPreviewSafeSourceSetter,
} from './useAppPreviewSafeSetters';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

describe('useAppPreviewSafeSetters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('切换模式前先取消 PREVIEW 待回写', () => {
    const events: string[] = [];
    const onCancelOutputDraft = vi.fn(() => events.push('cancel'));
    const onSetMode = vi.fn(() => events.push('set-mode'));
    const setModeSafely = useAppPreviewSafeModeSetter({
      onCancelOutputDraft,
      onSetMode,
    });

    setModeSafely(TransformMode.DEEP_FORMAT);

    expect(onCancelOutputDraft).toHaveBeenCalledTimes(1);
    expect(onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(events).toEqual(['cancel', 'set-mode']);
  });

  it('替换 SOURCE 前先取消 PREVIEW 待回写', () => {
    const events: string[] = [];
    const onCancelOutputDraft = vi.fn(() => events.push('cancel'));
    const onSetSourceText = vi.fn(() => events.push('set-source'));
    const setSourceSafely = useAppPreviewSafeSourceSetter({
      onCancelOutputDraft,
      onSetSourceText,
    });

    setSourceSafely('{"next":true}');

    expect(onCancelOutputDraft).toHaveBeenCalledTimes(1);
    expect(onSetSourceText).toHaveBeenCalledWith('{"next":true}');
    expect(events).toEqual(['cancel', 'set-source']);
  });
});

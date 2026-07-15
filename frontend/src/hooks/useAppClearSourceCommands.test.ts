import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSourceReplacementTarget } from '../utils/appSourceReplacementCommandTypes';
import { useAppClearSourceCommands } from './useAppClearSourceCommands';

const reactMocks = vi.hoisted(() => ({
  setPendingClearTarget: vi.fn(),
  useCallback: vi.fn((callback: unknown) => callback),
  useState: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useState: reactMocks.useState,
}));

vi.mock('../utils/toast', () => toastMocks);

const INITIAL_TARGET: AppSourceReplacementTarget = {
  activeFileId: 'file-a',
  sourceText: 'source-a',
};

const useClearFixture = (
  pendingTarget: AppSourceReplacementTarget | null = INITIAL_TARGET,
  currentTarget: AppSourceReplacementTarget = INITIAL_TARGET,
) => {
  reactMocks.useState.mockReturnValue([pendingTarget, reactMocks.setPendingClearTarget]);
  const onInputChange = vi.fn();
  const onSetHighlightRange = vi.fn();
  const onTrackToolEvent = vi.fn();
  const command = useAppClearSourceCommands({
    sourceTargetRef: { current: currentTarget },
    onInputChange,
    onSetHighlightRange,
    onTrackToolEvent,
  });

  return { command, onInputChange, onSetHighlightRange, onTrackToolEvent };
};

describe('useAppClearSourceCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('请求清空时保存当前目标快照', () => {
    const { command, onInputChange } = useClearFixture(null);

    command.handleRequestClearSource();

    expect(reactMocks.setPendingClearTarget).toHaveBeenCalledWith(INITIAL_TARGET);
    expect(onInputChange).not.toHaveBeenCalled();
  });

  it('空 SOURCE 不打开确认并记录跳过', () => {
    const emptyTarget = { activeFileId: 'file-a', sourceText: '   ' };
    const { command, onTrackToolEvent } = useClearFixture(null, emptyTarget);

    command.handleRequestClearSource();

    expect(reactMocks.setPendingClearTarget).not.toHaveBeenCalled();
    expect(toastMocks.showError).toHaveBeenCalledWith('源内容已经是空的');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_CLEAR',
      'editor',
      'skipped',
      expect.any(Number),
    );
  });

  it.each([
    ['活动标签已切换', { activeFileId: 'file-b', sourceText: 'source-a' }],
    ['当前标签内容已编辑', { activeFileId: 'file-a', sourceText: 'edited' }],
  ])('%s 时拒绝旧清空确认', (_scenario, currentTarget) => {
    const { command, onInputChange, onTrackToolEvent } = useClearFixture(
      INITIAL_TARGET,
      currentTarget,
    );

    command.handleConfirmClearSource();

    expect(onInputChange).not.toHaveBeenCalled();
    expect(reactMocks.setPendingClearTarget).toHaveBeenCalledWith(null);
    expect(toastMocks.showError).toHaveBeenCalledWith('SOURCE 已变化，请重新操作');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_CLEAR',
      'editor',
      'skipped',
      expect.any(Number),
    );
  });

  it('目标未变化时清空内容、高亮和 pending', () => {
    const { command, onInputChange, onSetHighlightRange, onTrackToolEvent } =
      useClearFixture();

    command.handleConfirmClearSource();

    expect(onInputChange).toHaveBeenCalledWith('');
    expect(onSetHighlightRange).toHaveBeenCalledWith(null);
    expect(reactMocks.setPendingClearTarget).toHaveBeenCalledWith(null);
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('源内容已清空');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_CLEAR',
      'editor',
      'success',
      expect.any(Number),
    );
  });
});

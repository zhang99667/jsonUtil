import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

const reactMocks = vi.hoisted(() => ({
  setPendingText: vi.fn(),
  useCallback: vi.fn((callback: () => unknown) => callback),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useState: reactMocks.useState,
}));

const useCommandFixture = (pendingText: string | null = 'preview') => {
  reactMocks.useState.mockReturnValue([pendingText, reactMocks.setPendingText]);

  const onApply = vi.fn();
  const onTrackToolEvent = vi.fn();
  const command = usePendingSourceReplacementCommand({
    eventName: 'PREVIEW_APPLY_TO_SOURCE',
    category: 'editor',
    confirmSuccessMessage: '已用 PREVIEW 替换 SOURCE',
    onApply,
    onTrackToolEvent,
  });

  return { command, onApply, onTrackToolEvent };
};

describe('usePendingSourceReplacementCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('请求 confirm 计划时复用命令配置设置 pending 文本', () => {
    const { command, onTrackToolEvent } = useCommandFixture(null);

    command.handleRequest(
      { action: 'confirm', pendingText: 'next source' },
      { startedAt: 123 },
    );

    expect(reactMocks.setPendingText).toHaveBeenCalledWith('next source');
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('确认 pending 文本时应用替换、清理 pending 并记录成功打点', () => {
    const { command, onApply, onTrackToolEvent } = useCommandFixture('next source');

    command.handleConfirm();

    expect(onApply).toHaveBeenCalledWith('next source', '已用 PREVIEW 替换 SOURCE');
    expect(reactMocks.setPendingText).toHaveBeenCalledWith(null);
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'PREVIEW_APPLY_TO_SOURCE',
      'editor',
      'success',
      expect.any(Number),
    );
  });

  it('没有 pending 文本时确认保持 no-op', () => {
    const { command, onApply, onTrackToolEvent } = useCommandFixture(null);

    command.handleConfirm();

    expect(onApply).not.toHaveBeenCalled();
    expect(reactMocks.setPendingText).not.toHaveBeenCalled();
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('取消 pending 时只清理并记录取消打点', () => {
    const { command, onApply, onTrackToolEvent } = useCommandFixture('next source');

    command.handleCancel();

    expect(onApply).not.toHaveBeenCalled();
    expect(reactMocks.setPendingText).toHaveBeenCalledWith(null);
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'PREVIEW_APPLY_TO_SOURCE',
      'editor',
      'cancelled',
      expect.any(Number),
    );
  });
});

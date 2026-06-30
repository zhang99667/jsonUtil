import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

const reactMocks = vi.hoisted(() => ({
  setPendingText: vi.fn(),
  useCallback: vi.fn((callback: () => unknown) => callback),
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

  it('请求 apply 计划时保留调用方传入的开始时间和直接应用文案', () => {
    const { command, onApply, onTrackToolEvent } = useCommandFixture(null);

    command.handleRequest(
      { action: 'apply', text: 'next source', successMessage: '已直接应用' },
      { startedAt: 123 },
    );

    expect(onApply).toHaveBeenCalledWith('next source', '已直接应用');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'PREVIEW_APPLY_TO_SOURCE',
      'editor',
      'success',
      123,
    );
  });

  it('请求需要确认且按跳过记录的计划时保留特殊打点语义', () => {
    const { command, onTrackToolEvent } = useCommandFixture(null);

    command.handleRequest(
      { action: 'confirm', pendingText: 'scheme source' },
      { startedAt: 456, shouldTrackConfirmAsSkipped: true },
    );

    expect(reactMocks.setPendingText).toHaveBeenCalledWith('scheme source');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'PREVIEW_APPLY_TO_SOURCE',
      'editor',
      'skipped',
      456,
    );
  });

  it('请求成功跳过计划时透传成功副作用', () => {
    const { command, onApply, onTrackToolEvent } = useCommandFixture(null);
    const onSuccessSkip = vi.fn();

    command.handleRequest(
      { action: 'skip', feedback: 'success', message: '内容已相同' },
      { startedAt: 789, onSuccessSkip },
    );

    expect(toastMocks.showSuccess).toHaveBeenCalledWith('内容已相同');
    expect(toastMocks.showError).not.toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(reactMocks.setPendingText).not.toHaveBeenCalled();
    expect(onSuccessSkip).toHaveBeenCalledTimes(1);
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'PREVIEW_APPLY_TO_SOURCE',
      'editor',
      'skipped',
      789,
    );
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

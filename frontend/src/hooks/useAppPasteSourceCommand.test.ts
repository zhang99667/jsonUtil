import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSourceReplacementTarget } from '../utils/appSourceReplacementCommandTypes';
import { useAppPasteSourceCommand } from './useAppPasteSourceCommand';

const clipboardMocks = vi.hoisted(() => ({
  getClipboardErrorMessage: vi.fn(),
  readClipboardText: vi.fn(),
}));

const reactMocks = vi.hoisted(() => ({
  setPendingRequest: vi.fn(),
  useCallback: vi.fn((callback: unknown) => callback),
  useRef: vi.fn(() => ({ current: 0 })),
  useState: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

vi.mock('../utils/clipboard', () => clipboardMocks);
vi.mock('../utils/toast', () => toastMocks);

const INITIAL_TARGET: AppSourceReplacementTarget = {
  activeFileId: 'file-a',
  sourceText: 'source-a',
};

const usePasteFixture = () => {
  const sourceTargetRef = { current: INITIAL_TARGET };
  const onApply = vi.fn();
  const onTrackToolEvent = vi.fn();
  reactMocks.useState.mockReturnValue([null, reactMocks.setPendingRequest]);

  const command = useAppPasteSourceCommand({
    sourceTargetRef,
    onApply,
    onTrackToolEvent,
  });

  return { command, onApply, onTrackToolEvent, sourceTargetRef };
};

describe('useAppPasteSourceCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['活动标签已切换', { activeFileId: 'file-b', sourceText: 'source-a' }],
    ['当前标签内容已编辑', { activeFileId: 'file-a', sourceText: 'edited' }],
  ])('剪贴板返回前%s时拒绝旧结果', async (_scenario, currentTarget) => {
    let resolveClipboard: ((text: string) => void) | undefined;
    clipboardMocks.readClipboardText.mockReturnValue(new Promise<string>(resolve => {
      resolveClipboard = resolve;
    }));
    const { command, onApply, onTrackToolEvent, sourceTargetRef } = usePasteFixture();

    const pastePromise = command.handlePasteSource();
    sourceTargetRef.current = currentTarget;
    resolveClipboard?.('clipboard source');
    await pastePromise;

    expect(onApply).not.toHaveBeenCalled();
    expect(reactMocks.setPendingRequest).not.toHaveBeenCalled();
    expect(toastMocks.showError).toHaveBeenCalledWith('SOURCE 已变化，请重新操作');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_PASTE',
      'editor',
      'skipped',
      expect.any(Number),
    );
  });

  it('目标未变化时把剪贴板内容与目标快照一起进入确认', async () => {
    clipboardMocks.readClipboardText.mockResolvedValue('clipboard source');
    const { command, onTrackToolEvent } = usePasteFixture();

    await command.handlePasteSource();

    expect(reactMocks.setPendingRequest).toHaveBeenCalledWith({
      text: 'clipboard source',
      target: INITIAL_TARGET,
    });
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('读取剪贴板失败时保留错误提示和失败打点', async () => {
    clipboardMocks.readClipboardText.mockRejectedValue(new Error('denied'));
    clipboardMocks.getClipboardErrorMessage.mockReturnValue('浏览器拒绝读取剪贴板');
    const { command, onTrackToolEvent } = usePasteFixture();

    await command.handlePasteSource();

    expect(toastMocks.showError).toHaveBeenCalledWith('浏览器拒绝读取剪贴板');
    expect(onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_PASTE',
      'editor',
      'error',
      expect.any(Number),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
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
const toastMocks = vi.hoisted(() => ({ showError: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));
vi.mock('../utils/clipboard', () => clipboardMocks);
vi.mock('../utils/toast', () => toastMocks);

const INITIAL_TARGET = { activeFileId: 'file-a', sourceText: 'source-a' };
const createClipboardDeferred = () => {
  let resolve!: (text: string) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<string>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

describe('useAppPasteSourceCommand 连续读取', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useState.mockReturnValue([null, reactMocks.setPendingRequest]);
  });

  it.each([
    ['旧成功', false],
    ['旧失败', true],
  ] as const)('忽略%s结果', async (_scenario, shouldRejectOlder) => {
    const older = createClipboardDeferred();
    const newer = createClipboardDeferred();
    clipboardMocks.readClipboardText
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const onTrackToolEvent = vi.fn();
    const command = useAppPasteSourceCommand({
      sourceTargetRef: { current: INITIAL_TARGET },
      onApply: vi.fn(),
      onTrackToolEvent,
    });

    const olderPaste = command.handlePasteSource();
    const newerPaste = command.handlePasteSource();
    newer.resolve('新内容');
    await newerPaste;
    if (shouldRejectOlder) older.reject(new Error('旧读取失败'));
    else older.resolve('旧内容');
    await olderPaste;

    expect(reactMocks.setPendingRequest).toHaveBeenCalledTimes(1);
    expect(reactMocks.setPendingRequest).toHaveBeenCalledWith({
      text: '新内容',
      target: INITIAL_TARGET,
    });
    expect(toastMocks.showError).not.toHaveBeenCalled();
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });
});

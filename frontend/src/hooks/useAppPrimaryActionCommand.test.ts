import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { useAppPrimaryActionCommand } from './useAppPrimaryActionCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn(), useMemo: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useMemo: reactMocks.useMemo,
}));

const createCallbacks = () => ({
  onAiRepair: vi.fn(() => Promise.resolve()),
  onToolbarSave: vi.fn(() => Promise.resolve()),
  onOpenFile: vi.fn(() => Promise.resolve()),
  onCreateNewTab: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

describe('useAppPrimaryActionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it('把 AI 修复和保存动作交给对应命令', async () => {
    const callbacks = createCallbacks();
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now: () => 100 });

    await handleAction(ActionType.AI_FIX);
    await handleAction(ActionType.SAVE);

    expect(callbacks.onAiRepair).toHaveBeenCalledTimes(1);
    expect(callbacks.onToolbarSave).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFile).not.toHaveBeenCalled();
    expect(callbacks.onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('打开文件成功后记录文件事件耗时起点', async () => {
    const callbacks = createCallbacks();
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now: () => 321 });

    await handleAction(ActionType.OPEN);

    expect(callbacks.onOpenFile).toHaveBeenCalledTimes(1);
    expect(callbacks.onTrackToolEvent).toHaveBeenCalledWith(ActionType.OPEN, 'file', 'success', 321);
  });

  it('新建标签后记录文件事件耗时起点', async () => {
    const callbacks = createCallbacks();
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now: () => 654 });

    await handleAction(ActionType.NEW_TAB);

    expect(callbacks.onCreateNewTab).toHaveBeenCalledTimes(1);
    expect(callbacks.onTrackToolEvent).toHaveBeenCalledWith(ActionType.NEW_TAB, 'file', 'success', 654);
  });

  it('忽略暂未接入的动作', async () => {
    const callbacks = createCallbacks();
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now: () => 777 });

    await handleAction(ActionType.STATISTICS);

    expect(callbacks.onAiRepair).not.toHaveBeenCalled();
    expect(callbacks.onToolbarSave).not.toHaveBeenCalled();
    expect(callbacks.onOpenFile).not.toHaveBeenCalled();
    expect(callbacks.onCreateNewTab).not.toHaveBeenCalled();
    expect(callbacks.onTrackToolEvent).not.toHaveBeenCalled();
  });
});

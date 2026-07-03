import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { useAppPrimaryActionCommand } from './useAppPrimaryActionCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

const createCallbacks = () => ({
  onAiRepair: vi.fn(() => Promise.resolve()),
  onToolbarSave: vi.fn(() => Promise.resolve()),
  onOpenFile: vi.fn(() => Promise.resolve()),
  onCreateNewTab: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

const fileActionCases = [
  { action: ActionType.OPEN, effect: 'onOpenFile', now: 321 },
  { action: ActionType.NEW_TAB, effect: 'onCreateNewTab', now: 654 },
] as const;

describe('useAppPrimaryActionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
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

  it.each(fileActionCases)('$action 成功后记录文件事件耗时起点', async ({ action, effect, now }) => {
    const callbacks = createCallbacks();
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now: () => now });

    await handleAction(action);

    expect(callbacks[effect]).toHaveBeenCalledTimes(1);
    expect(callbacks.onTrackToolEvent).toHaveBeenCalledWith(action, 'file', 'success', now);
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

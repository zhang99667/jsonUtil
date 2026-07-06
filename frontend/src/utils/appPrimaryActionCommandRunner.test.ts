import { describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { runAppPrimaryActionCommand, type AppPrimaryActionCommandEffects } from './appPrimaryActionCommandRunner';

const createEffects = (startedAt = 123): AppPrimaryActionCommandEffects => ({
  onAiRepair: vi.fn(() => Promise.resolve()),
  onToolbarSave: vi.fn(() => Promise.resolve()),
  onOpenFile: vi.fn(() => Promise.resolve()),
  onCreateNewTab: vi.fn(),
  onTrackToolEvent: vi.fn(),
  now: vi.fn(() => startedAt),
});

const fileActionCases = [
  { action: ActionType.OPEN, effect: 'onOpenFile', startedAt: 321 },
  { action: ActionType.NEW_TAB, effect: 'onCreateNewTab', startedAt: 654 },
] as const;

describe('appPrimaryActionCommandRunner', () => {
  it('执行 AI 修复和保存动作时不记录文件事件', async () => {
    const effects = createEffects();

    await runAppPrimaryActionCommand(ActionType.AI_FIX, effects);
    await runAppPrimaryActionCommand(ActionType.SAVE, effects);

    expect(effects.onAiRepair).toHaveBeenCalledTimes(1);
    expect(effects.onToolbarSave).toHaveBeenCalledTimes(1);
    expect(effects.now).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).not.toHaveBeenCalled();
  });

  it.each(fileActionCases)('$action 成功后记录文件事件耗时起点', async ({ action, effect, startedAt }) => {
    const effects = createEffects(startedAt);

    await runAppPrimaryActionCommand(action, effects);

    expect(effects.now).toHaveBeenCalledTimes(1);
    expect(effects[effect]).toHaveBeenCalledTimes(1);
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(action, 'file', 'success', startedAt);
  });

  it('忽略暂未接入的动作且不读取耗时起点', async () => {
    const effects = createEffects();

    await runAppPrimaryActionCommand(ActionType.STATISTICS, effects);

    expect(effects.onAiRepair).not.toHaveBeenCalled();
    expect(effects.onToolbarSave).not.toHaveBeenCalled();
    expect(effects.onOpenFile).not.toHaveBeenCalled();
    expect(effects.onCreateNewTab).not.toHaveBeenCalled();
    expect(effects.now).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).not.toHaveBeenCalled();
  });
});

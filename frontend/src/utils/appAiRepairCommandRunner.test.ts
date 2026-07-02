import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType, TransformMode } from '../types';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { runAppAiRepairCommand } from './appAiRepairCommandRunner';
import {
  createAiRepairEffects,
  createAiRepairInput,
  createFailingAiRepairRuntime,
} from './appAiRepairCommandRunnerTestFixture';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

describe('appAiRepairCommandRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(false);
  });

  it('空 SOURCE 时跳过运行并记录 skipped', async () => {
    const effects = createAiRepairEffects();

    await runAppAiRepairCommand(createAiRepairInput({
      sourceText: '  ',
      startedAt: 10,
    }), effects);

    expect(effects.onShowError).toHaveBeenCalledWith('请先输入需要修复的 JSON 内容');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'skipped', 10);
    expect(effects.onSetRepairing).not.toHaveBeenCalled();
    expect(effects.onLoadRuntime).not.toHaveBeenCalled();
  });

  it('修复成功时写入快照、应用结果并切回格式化模式', async () => {
    const effects = createAiRepairEffects();
    const input = createAiRepairInput({ startedAt: 12 });

    await runAppAiRepairCommand(input, effects);

    expect(input.aiRepairSnapshotRef.current).toBe('{"ok":1}');
    expect(effects.onApplyFixedJson).toHaveBeenCalledWith('{"ok":1}', expect.objectContaining({
      rootDescription: '对象 1 个键',
    }));
    expect(effects.onSetMode).toHaveBeenCalledWith(TransformMode.FORMAT);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('本地修复成功');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'success', 12);
    expect(effects.onSetRepairing).toHaveBeenNthCalledWith(1, true);
    expect(effects.onSetRepairing).toHaveBeenLastCalledWith(false);
  });

  it('API Key 错误时提示设置入口', async () => {
    const effects = createAiRepairEffects(createFailingAiRepairRuntime(new Error('API Key 未配置')));

    await runAppAiRepairCommand(createAiRepairInput({ startedAt: 13 }), effects);

    expect(effects.onShowError).toHaveBeenCalledWith('请先配置 AI API Key');
    expect(effects.onOpenAiSettings).toHaveBeenCalledTimes(1);
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'error', 13);
  });

  it('旧 chunk 失效时交给统一刷新恢复', async () => {
    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);
    const effects = createAiRepairEffects(createFailingAiRepairRuntime(chunkError));

    await runAppAiRepairCommand(createAiRepairInput({ startedAt: 14 }), effects);

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(chunkError);
    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onOpenAiSettings).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'error', 14);
  });
});

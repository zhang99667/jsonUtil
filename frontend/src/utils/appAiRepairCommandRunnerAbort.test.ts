import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { runAppAiRepairCommand } from './appAiRepairCommandRunner';
import {
  createAiRepairEffects,
  createAiRepairInput,
  createAiRepairSummary,
} from './appAiRepairCommandRunnerTestFixture';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

describe('appAiRepairCommandRunner abort handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(false);
  });

  it('运行 AI 修复时向 service 透传 AbortSignal', async () => {
    const abortController = new AbortController();
    const runtime = {
      fixJsonWithRepairDetails: vi.fn(async () => ({
        fixedJson: '{"ok":1}',
        repairMethod: 'local' as const,
        localRuleLabels: ['本地规则'],
      })),
      buildAiRepairSummary: vi.fn(() => createAiRepairSummary()),
    };
    const effects = createAiRepairEffects(runtime);
    const input = createAiRepairInput({
      startedAt: 15,
      signal: abortController.signal,
    });

    await runAppAiRepairCommand(input, effects);

    expect(runtime.fixJsonWithRepairDetails).toHaveBeenCalledWith(
      input.sourceText,
      input.aiConfig,
      { signal: abortController.signal }
    );
  });

  it('启动前已取消时不加载 runtime 并记录 cancelled', async () => {
    const abortController = new AbortController();
    abortController.abort();
    const effects = createAiRepairEffects();

    await runAppAiRepairCommand(createAiRepairInput({
      startedAt: 16,
      signal: abortController.signal,
    }), effects);

    expect(effects.onLoadRuntime).not.toHaveBeenCalled();
    expect(effects.onSetRepairing).not.toHaveBeenCalled();
    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'cancelled', 16);
  });

  it('运行中取消时不弹错误并记录 cancelled', async () => {
    const abortController = new AbortController();
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    const effects = createAiRepairEffects({
      fixJsonWithRepairDetails: vi.fn(async () => {
        abortController.abort();
        throw abortError;
      }),
      buildAiRepairSummary: vi.fn(),
    });

    await runAppAiRepairCommand(createAiRepairInput({
      startedAt: 17,
      signal: abortController.signal,
    }), effects);

    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onOpenAiSettings).not.toHaveBeenCalled();
    expect(dispatchChunkLoadRecoveryEvent).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'cancelled', 17);
  });
});

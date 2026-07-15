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

  it.each(['runtime 加载后', 'service 返回后'] as const)(
    '%s取消时不应应用修复结果',
    async cancelAt => {
      const abortController = new AbortController();
      const repairResult = {
        fixedJson: '{"ok":1}',
        repairMethod: 'local' as const,
        localRuleLabels: ['本地规则'],
      };
      const runtime = {
        fixJsonWithRepairDetails: vi.fn(async () => repairResult),
        buildAiRepairSummary: vi.fn(() => createAiRepairSummary()),
      };
      const effects = createAiRepairEffects(runtime);
      if (cancelAt === 'runtime 加载后') {
        effects.onLoadRuntime.mockImplementation(async () => {
          abortController.abort();
          return runtime;
        });
      } else {
        runtime.fixJsonWithRepairDetails.mockImplementation(async () => {
          abortController.abort();
          return repairResult;
        });
      }

      await runAppAiRepairCommand(createAiRepairInput({
        startedAt: 18,
        signal: abortController.signal,
      }), effects);

      if (cancelAt === 'runtime 加载后') expect(runtime.fixJsonWithRepairDetails).not.toHaveBeenCalled();
      expect(effects.onApplyFixedJson).not.toHaveBeenCalled();
      expect(effects.onShowSuccess).not.toHaveBeenCalled();
      expect(effects.onTrackToolEvent).toHaveBeenCalledWith(ActionType.AI_FIX, 'ai', 'cancelled', 18);
      expect(effects.onSetRepairing).toHaveBeenNthCalledWith(1, true);
      expect(effects.onSetRepairing).toHaveBeenLastCalledWith(false);
    },
  );
});

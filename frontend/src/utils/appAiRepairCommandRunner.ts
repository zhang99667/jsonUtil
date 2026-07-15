import { ActionType, TransformMode } from '../types';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { isAbortError } from './errors';
import {
  buildAppAiRepairApplyResult,
  getAppAiRepairErrorFeedback,
  getAppAiRepairSkipMessage,
} from './appAiRepairCommand';
import type {
  AppAiRepairRuntime,
  RunAppAiRepairCommandEffects,
  RunAppAiRepairCommandInput,
} from './appAiRepairCommandRunnerTypes';

export const loadAppAiRepairRuntime = async (): Promise<AppAiRepairRuntime> => {
  const { fixJsonWithRepairDetails } = await import('../services/aiService');
  const { buildAiRepairSummary } = await import('./aiRepairSummary');
  return { fixJsonWithRepairDetails, buildAiRepairSummary };
};

export const runAppAiRepairCommand = async (
  input: RunAppAiRepairCommandInput,
  effects: RunAppAiRepairCommandEffects,
) => {
  const skipMessage = getAppAiRepairSkipMessage(input.sourceText);
  if (skipMessage) {
    effects.onShowError(skipMessage);
    effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'skipped', input.startedAt);
    return;
  }

  if (input.signal?.aborted) {
    effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'cancelled', input.startedAt);
    return;
  }

  effects.onSetRepairing(true);
  try {
    const { fixJsonWithRepairDetails, buildAiRepairSummary } = await effects.onLoadRuntime();
    input.signal?.throwIfAborted();
    const repairResult = await fixJsonWithRepairDetails(input.sourceText, input.aiConfig, {
      signal: input.signal,
    });
    input.signal?.throwIfAborted();
    const applyResult = buildAppAiRepairApplyResult({
      sourceText: input.sourceText,
      repairResult,
      buildAiRepairSummary,
    });

    effects.onApplyFixedJson(applyResult.fixedJson, applyResult.summary);
    effects.onSetMode(TransformMode.FORMAT);
    effects.onShowSuccess(applyResult.successMessage);
    effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'success', input.startedAt);
  } catch (error) {
    if (isAppAiRepairCancelled(input.signal, error)) {
      effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'cancelled', input.startedAt);
      return;
    }

    if (dispatchChunkLoadRecoveryEvent(error)) {
      effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'error', input.startedAt);
      return;
    }

    const feedback = getAppAiRepairErrorFeedback(error);
    effects.onShowError(feedback.message);
    if (feedback.shouldOpenAiSettings) effects.onOpenAiSettings();
    effects.onTrackToolEvent(ActionType.AI_FIX, 'ai', 'error', input.startedAt);
  } finally {
    effects.onSetRepairing(false);
  }
};

const isAppAiRepairCancelled = (signal: AbortSignal | undefined, error: unknown): boolean => (
  signal?.aborted === true || isAbortError(error)
);

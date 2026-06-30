import { useCallback, useState, type MutableRefObject } from 'react';
import { ActionType, TransformMode, type AIConfig } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { showError, showSuccess } from '../utils/toast';
import type { ToolEventStatus } from '../utils/productTelemetry';
import {
  buildAppAiRepairApplyResult,
  getAppAiRepairErrorFeedback,
  getAppAiRepairSkipMessage,
} from '../utils/appAiRepairCommand';

type AppAiRepairTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface UseAppAiRepairCommandInput {
  sourceText: string;
  aiConfig: AIConfig;
  aiRepairSnapshotRef: MutableRefObject<string | null>;
  onApplyFixedJson: (fixedJson: string, summary: AiRepairSummary) => void;
  onSetMode: (mode: TransformMode) => void;
  onOpenAiSettings: () => void;
  onTriggerFeatureFirstUse: () => void;
  onTrackToolEvent: AppAiRepairTrackEvent;
}

export const useAppAiRepairCommand = ({
  sourceText,
  aiConfig,
  aiRepairSnapshotRef,
  onApplyFixedJson,
  onSetMode,
  onOpenAiSettings,
  onTriggerFeatureFirstUse,
  onTrackToolEvent,
}: UseAppAiRepairCommandInput) => {
  const [isAiRepairing, setIsAiRepairing] = useState(false);

  const handleAiRepair = useCallback(async () => {
    const startedAt = performance.now();
    onTriggerFeatureFirstUse();

    const skipMessage = getAppAiRepairSkipMessage(sourceText);
    if (skipMessage) {
      showError(skipMessage);
      onTrackToolEvent(ActionType.AI_FIX, 'ai', 'skipped', startedAt);
      return;
    }

    setIsAiRepairing(true);
    try {
      const { fixJsonWithRepairDetails } = await import('../services/aiService');
      const repairResult = await fixJsonWithRepairDetails(sourceText, aiConfig);
      const { buildAiRepairSummary } = await import('../utils/aiRepairSummary');
      const applyResult = buildAppAiRepairApplyResult({
        sourceText,
        repairResult,
        buildAiRepairSummary,
      });

      aiRepairSnapshotRef.current = applyResult.fixedJson;
      onApplyFixedJson(applyResult.fixedJson, applyResult.summary);
      onSetMode(TransformMode.FORMAT);
      showSuccess(applyResult.successMessage);
      onTrackToolEvent(ActionType.AI_FIX, 'ai', 'success', startedAt);
    } catch (error) {
      const feedback = getAppAiRepairErrorFeedback(error);
      showError(feedback.message);
      if (feedback.shouldOpenAiSettings) {
        onOpenAiSettings();
      }
      onTrackToolEvent(ActionType.AI_FIX, 'ai', 'error', startedAt);
    } finally {
      setIsAiRepairing(false);
    }
  }, [
    aiConfig,
    aiRepairSnapshotRef,
    onApplyFixedJson,
    onOpenAiSettings,
    onSetMode,
    onTrackToolEvent,
    onTriggerFeatureFirstUse,
    sourceText,
  ]);

  return {
    isAiRepairing,
    handleAiRepair,
  };
};

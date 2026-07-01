import { useCallback, useState, type MutableRefObject } from 'react';
import type { AIConfig, TransformMode } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { showError, showSuccess } from '../utils/toast';
import type { ToolEventStatus } from '../utils/productTelemetry';
import {
  loadAppAiRepairRuntime,
  runAppAiRepairCommand,
} from '../utils/appAiRepairCommandRunner';

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

    await runAppAiRepairCommand({
      sourceText,
      aiConfig,
      aiRepairSnapshotRef,
      startedAt,
    }, {
      onLoadRuntime: loadAppAiRepairRuntime,
      onSetRepairing: setIsAiRepairing,
      onApplyFixedJson,
      onSetMode,
      onOpenAiSettings,
      onTrackToolEvent,
      onShowError: showError,
      onShowSuccess: showSuccess,
    });
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

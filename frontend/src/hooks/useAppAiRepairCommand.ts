import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIConfig, TransformMode } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { showError, showSuccess } from '../utils/toast';
import type { ToolEventStatus } from '../utils/productTelemetry';
import { loadAppAiRepairRuntime, runAppAiRepairCommand } from '../utils/appAiRepairCommandRunner';

type AppAiRepairTrackEvent = (eventName: string, category: string, status?: ToolEventStatus, startedAt?: number) => void;

interface UseAppAiRepairCommandInput {
  sourceText: string;
  aiConfig: AIConfig;
  onApplyFixedJson: (fixedJson: string, summary: AiRepairSummary) => void;
  onSetMode: (mode: TransformMode) => void;
  onOpenAiSettings: () => void;
  onTriggerFeatureFirstUse: () => void;
  onTrackToolEvent: AppAiRepairTrackEvent;
}

export const useAppAiRepairCommand = ({
  sourceText,
  aiConfig,
  onApplyFixedJson,
  onSetMode,
  onOpenAiSettings,
  onTriggerFeatureFirstUse,
  onTrackToolEvent,
}: UseAppAiRepairCommandInput) => {
  const [isAiRepairing, setIsAiRepairing] = useState(false);
  const isMountedRef = useRef(true);
  const aiRepairAbortControllerRef = useRef<AbortController | null>(null);
  const latestSourceTextRef = useRef(sourceText);
  latestSourceTextRef.current = sourceText;

  useEffect(() => () => {
    isMountedRef.current = false;
    aiRepairAbortControllerRef.current?.abort();
    aiRepairAbortControllerRef.current = null;
  }, []);

  useEffect(() => { aiRepairAbortControllerRef.current?.abort(); aiRepairAbortControllerRef.current = null; }, [sourceText]);

  const setAiRepairingIfMounted = useCallback((nextIsAiRepairing: boolean) => {
    if (isMountedRef.current) setIsAiRepairing(nextIsAiRepairing);
  }, []);

  const handleAiRepair = useCallback(async () => {
    if (aiRepairAbortControllerRef.current && !aiRepairAbortControllerRef.current.signal.aborted) {
      return;
    }

    const startedAt = performance.now();
    const abortController = new AbortController();
    aiRepairAbortControllerRef.current = abortController;
    onTriggerFeatureFirstUse();

    const shouldApplyAiRepairEffect = () => (
      isMountedRef.current && !abortController.signal.aborted && latestSourceTextRef.current === sourceText
    );
    const runIfActive = <Args extends unknown[]>(effect: (...args: Args) => void) => (
      ...args: Args
    ) => {
      if (shouldApplyAiRepairEffect()) effect(...args);
    };

    try {
      await runAppAiRepairCommand({
        sourceText,
        aiConfig,
        startedAt,
        signal: abortController.signal,
      }, {
        onLoadRuntime: loadAppAiRepairRuntime,
        onSetRepairing: setAiRepairingIfMounted,
        onApplyFixedJson: runIfActive(onApplyFixedJson),
        onSetMode: runIfActive(onSetMode),
        onOpenAiSettings: runIfActive(onOpenAiSettings),
        onTrackToolEvent,
        onShowError: runIfActive(showError),
        onShowSuccess: runIfActive(showSuccess),
      });
    } finally {
      if (aiRepairAbortControllerRef.current === abortController) {
        aiRepairAbortControllerRef.current = null;
      }
    }
  }, [aiConfig, onApplyFixedJson, onOpenAiSettings, onSetMode, onTrackToolEvent, onTriggerFeatureFirstUse, setAiRepairingIfMounted, sourceText]);

  return { isAiRepairing, handleAiRepair };
};

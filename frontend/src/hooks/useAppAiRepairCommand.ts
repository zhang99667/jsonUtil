import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AIConfig, TransformMode } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { showError, showSuccess } from '../utils/toast';
import { loadAppAiRepairRuntime, runAppAiRepairCommand } from '../utils/appAiRepairCommandRunner';
import type { AppAiRepairTrackEvent } from '../utils/appAiRepairCommandRunnerTypes';

interface UseAppAiRepairCommandInput {
  activeFileId: string | null;
  sourceText: string;
  aiConfig: AIConfig;
  onApplyFixedJson: (fixedJson: string, summary: AiRepairSummary) => void;
  onSetMode: (mode: TransformMode) => void;
  onOpenAiSettings: () => void;
  onTriggerFeatureFirstUse: () => void;
  onTrackToolEvent: AppAiRepairTrackEvent;
}

export const useAppAiRepairCommand = ({
  activeFileId,
  sourceText,
  aiConfig,
  onApplyFixedJson,
  onSetMode,
  onOpenAiSettings,
  onTriggerFeatureFirstUse,
  onTrackToolEvent,
}: UseAppAiRepairCommandInput) => {
  const [isAiRepairing, setIsAiRepairing] = useState(false);
  const aiRepairAbortControllerRef = useRef<AbortController | null>(null);
  const latestSourceRef = useRef({ activeFileId, sourceText });
  // 只在提交阶段更新请求身份，避免未提交渲染污染当前请求
  useLayoutEffect(() => {
    latestSourceRef.current = { activeFileId, sourceText };
  }, [activeFileId, sourceText]);

  useEffect(() => () => {
    const activeRequest = aiRepairAbortControllerRef.current;
    aiRepairAbortControllerRef.current = null;
    activeRequest?.abort();
  }, []);

  useEffect(() => {
    const activeRequest = aiRepairAbortControllerRef.current;
    if (!activeRequest) return;
    aiRepairAbortControllerRef.current = null;
    activeRequest.abort();
    setIsAiRepairing(false);
  }, [activeFileId, sourceText]);

  const handleAiRepair = useCallback(async () => {
    if (aiRepairAbortControllerRef.current) return;

    const startedAt = performance.now();
    const abortController = new AbortController();
    aiRepairAbortControllerRef.current = abortController;
    onTriggerFeatureFirstUse();
    // 回调同时绑定请求控制器、源内容和活动文件，避免迟到结果跨标签生效。
    const shouldApplyAiRepairEffect = () => (
      aiRepairAbortControllerRef.current === abortController && !abortController.signal.aborted
      && latestSourceRef.current.sourceText === sourceText && latestSourceRef.current.activeFileId === activeFileId
    );
    const runIfActive = <Args extends unknown[]>(effect: (...args: Args) => void) => (...args: Args) => {
      if (shouldApplyAiRepairEffect()) effect(...args);
    };
    const setRepairingIfCurrent = (nextIsRepairing: boolean) => {
      if (aiRepairAbortControllerRef.current === abortController) setIsAiRepairing(nextIsRepairing);
    };

    try {
      await runAppAiRepairCommand({
        sourceText,
        aiConfig,
        startedAt,
        signal: abortController.signal,
      }, {
        onLoadRuntime: loadAppAiRepairRuntime,
        onSetRepairing: setRepairingIfCurrent,
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
  }, [activeFileId, aiConfig, onApplyFixedJson, onOpenAiSettings, onSetMode, onTrackToolEvent, onTriggerFeatureFirstUse, sourceText]);

  return { isAiRepairing, handleAiRepair };
};

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

type ActiveAiRepairRequest = Pick<UseAppAiRepairCommandInput, 'activeFileId' | 'sourceText'>
  & { abortController: AbortController };

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
  const activeRequestRef = useRef<ActiveAiRepairRequest | null>(null);
  // 在提交阶段使旧请求失效，避免未提交渲染污染当前请求
  useLayoutEffect(() => {
    const request = activeRequestRef.current;
    if (!request || (request.activeFileId === activeFileId && request.sourceText === sourceText)) return;
    activeRequestRef.current = null;
    request.abortController.abort();
    setIsAiRepairing(false);
  }, [activeFileId, sourceText]);

  useEffect(() => () => {
    const request = activeRequestRef.current;
    activeRequestRef.current = null;
    request?.abortController.abort();
  }, []);

  const handleAiRepair = useCallback(async () => {
    if (activeRequestRef.current) return;

    const startedAt = performance.now();
    const abortController = new AbortController();
    const request = { abortController, activeFileId, sourceText };
    activeRequestRef.current = request;
    // 回调同时绑定请求控制器、源内容和活动文件，避免迟到结果跨标签生效。
    const runIfActive = <Args extends unknown[]>(effect: (...args: Args) => void) => (...args: Args) => {
      if (activeRequestRef.current === request && !abortController.signal.aborted) effect(...args);
    };

    try {
      onTriggerFeatureFirstUse();
      await runAppAiRepairCommand({
        sourceText,
        aiConfig,
        startedAt,
        signal: abortController.signal,
      }, {
        onLoadRuntime: loadAppAiRepairRuntime,
        onSetRepairing: runIfActive(setIsAiRepairing),
        onApplyFixedJson: runIfActive(onApplyFixedJson),
        onSetMode: runIfActive(onSetMode),
        onOpenAiSettings: runIfActive(onOpenAiSettings),
        onTrackToolEvent,
        onShowError: runIfActive(showError),
        onShowSuccess: runIfActive(showSuccess),
      });
    } finally {
      if (activeRequestRef.current === request) {
        setIsAiRepairing(false);
        activeRequestRef.current = null;
      }
    }
  }, [activeFileId, aiConfig, onApplyFixedJson, onOpenAiSettings, onSetMode, onTrackToolEvent, onTriggerFeatureFirstUse, sourceText]);

  return { isAiRepairing, handleAiRepair };
};

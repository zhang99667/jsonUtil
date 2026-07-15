import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { PreviewOutputSyncTask } from '../utils/appPreviewOutputSyncTaskTypes';

interface UseAppPreviewOutputSyncSchedulerInput {
  clearOutputDraft: () => void;
  onBeforeSync?: () => void;
}

export const PREVIEW_SYNC_DEBOUNCE_MS = 400;
export const PREVIEW_SYNC_UNLOCK_DELAY_MS = 600;

const invalidatePendingPreviewOutputSync = (
  outputChangeTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  outputSyncRequestIdRef: MutableRefObject<number>,
  outputSyncAbortControllerRef: MutableRefObject<AbortController | null>
) => {
  clearTimeout(outputChangeTimer.current ?? undefined);
  outputChangeTimer.current = null;
  outputSyncRequestIdRef.current++;
  outputSyncAbortControllerRef.current?.abort();
  outputSyncAbortControllerRef.current = null;
};

export const useAppPreviewOutputSyncScheduler = ({
  clearOutputDraft,
  onBeforeSync,
}: UseAppPreviewOutputSyncSchedulerInput) => {
  const outputChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputSyncRequestIdRef = useRef(0);
  const outputSyncAbortControllerRef = useRef<AbortController | null>(null);

  const invalidatePendingSync = useCallback(() => {
    invalidatePendingPreviewOutputSync(
      outputChangeTimer,
      outputSyncRequestIdRef,
      outputSyncAbortControllerRef
    );
  }, []);

  useEffect(() => () => {
    invalidatePendingSync();
  }, [invalidatePendingSync]);

  const cancelOutputDraft = useCallback(() => {
    invalidatePendingSync();
    clearOutputDraft();
  }, [clearOutputDraft, invalidatePendingSync]);

  const scheduleOutputSync = useCallback((task: PreviewOutputSyncTask) => {
    invalidatePendingSync();
    const abortController = new AbortController();
    outputSyncAbortControllerRef.current = abortController;
    const outputSyncRequestId = outputSyncRequestIdRef.current;
    const isCurrent = () => outputSyncRequestId === outputSyncRequestIdRef.current;

    outputChangeTimer.current = setTimeout(() => {
      outputChangeTimer.current = null;

      const runSyncTask = async () => {
        onBeforeSync?.();
        const didSync = await task(isCurrent, abortController.signal);
        if (outputSyncAbortControllerRef.current === abortController) {
          outputSyncAbortControllerRef.current = null;
        }
        if (!didSync || !isCurrent()) return;

        setTimeout(() => {
          if (!outputChangeTimer.current && isCurrent()) {
            clearOutputDraft();
          }
        }, PREVIEW_SYNC_UNLOCK_DELAY_MS);
      };

      void runSyncTask();
    }, PREVIEW_SYNC_DEBOUNCE_MS);
  }, [clearOutputDraft, invalidatePendingSync, onBeforeSync]);

  return {
    cancelOutputDraft,
    scheduleOutputSync,
  };
};

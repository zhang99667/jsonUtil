import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

interface UseAppPreviewOutputSyncSchedulerInput {
  clearOutputDraft: () => void;
}

export const PREVIEW_SYNC_DEBOUNCE_MS = 400;
export const PREVIEW_SYNC_UNLOCK_DELAY_MS = 600;

const invalidatePendingPreviewOutputSync = (
  outputChangeTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  outputSyncRequestIdRef: MutableRefObject<number>
) => {
  clearTimeout(outputChangeTimer.current ?? undefined);
  outputChangeTimer.current = null;
  outputSyncRequestIdRef.current++;
};

export const useAppPreviewOutputSyncScheduler = ({
  clearOutputDraft,
}: UseAppPreviewOutputSyncSchedulerInput) => {
  const outputChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputSyncRequestIdRef = useRef(0);

  const invalidatePendingSync = useCallback(() => {
    invalidatePendingPreviewOutputSync(outputChangeTimer, outputSyncRequestIdRef);
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
    const outputSyncRequestId = outputSyncRequestIdRef.current;
    const isCurrent = () => outputSyncRequestId === outputSyncRequestIdRef.current;

    outputChangeTimer.current = setTimeout(() => {
      outputChangeTimer.current = null;

      const runSyncTask = async () => {
        const didSync = await task(isCurrent);
        if (!didSync || !isCurrent()) return;

        setTimeout(() => {
          if (!outputChangeTimer.current && isCurrent()) {
            clearOutputDraft();
          }
        }, PREVIEW_SYNC_UNLOCK_DELAY_MS);
      };

      void runSyncTask();
    }, PREVIEW_SYNC_DEBOUNCE_MS);
  }, [clearOutputDraft, invalidatePendingSync]);

  return {
    cancelOutputDraft,
    scheduleOutputSync,
  };
};

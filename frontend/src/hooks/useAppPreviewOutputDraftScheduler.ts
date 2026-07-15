import { useCallback, type MutableRefObject } from 'react';
import { clearPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { useAppPreviewOutputSyncScheduler } from './useAppPreviewOutputSyncScheduler';

interface UseAppPreviewOutputDraftSchedulerInput {
  isUpdatingFromOutput: MutableRefObject<boolean>;
  pendingOutputValue: MutableRefObject<string>;
  onBeforeSync: () => void;
}

export const useAppPreviewOutputDraftScheduler = ({
  isUpdatingFromOutput,
  pendingOutputValue,
  onBeforeSync,
}: UseAppPreviewOutputDraftSchedulerInput) => {
  const clearOutputDraft = useCallback(() => {
    clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
  }, [isUpdatingFromOutput, pendingOutputValue]);

  return useAppPreviewOutputSyncScheduler({ clearOutputDraft, onBeforeSync });
};

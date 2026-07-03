import { useCallback, type MutableRefObject } from 'react';
import { clearPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { useAppPreviewOutputSyncScheduler } from './useAppPreviewOutputSyncScheduler';

interface UseAppPreviewOutputDraftSchedulerInput {
  isUpdatingFromOutput: MutableRefObject<boolean>;
  pendingOutputValue: MutableRefObject<string>;
}

export const useAppPreviewOutputDraftScheduler = ({
  isUpdatingFromOutput,
  pendingOutputValue,
}: UseAppPreviewOutputDraftSchedulerInput) => {
  const clearOutputDraft = useCallback(() => {
    clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
  }, [isUpdatingFromOutput, pendingOutputValue]);

  return useAppPreviewOutputSyncScheduler({ clearOutputDraft });
};

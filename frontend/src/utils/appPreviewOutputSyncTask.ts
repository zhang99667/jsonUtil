import { runAppPreviewOutputSyncRequest } from './appPreviewOutputSyncRequest';
import { applyAppPreviewOutputSyncResult } from './appPreviewOutputSyncResult';
import type { AppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskTypes';

export const createAppPreviewOutputSyncTask = ({
  request,
  refs,
  applyEffects,
}: AppPreviewOutputSyncTaskInput) => async (isCurrent: () => boolean): Promise<boolean> => {
  const { inputRef, fallbackContextRef, pendingOutputValue } = refs;

  const syncResult = await runAppPreviewOutputSyncRequest({
    ...request,
    originalInput: inputRef.current,
    fallbackContext: fallbackContextRef.current,
  });

  if (!isCurrent()) return false;

  return applyAppPreviewOutputSyncResult({
    syncResult,
    previewText: request.previewText,
    inputRef,
    pendingOutputValue,
    ...applyEffects,
  });
};

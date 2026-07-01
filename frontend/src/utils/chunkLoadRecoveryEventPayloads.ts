import { getChunkLoadResourceTargetUrl } from './chunkLoadRecoveryResourceTargets';
import type { GlobalErrorLikeEvent, ManualChunkLoadRecoveryEvent } from './chunkLoadRecoveryEventTypes';

export const getGlobalErrorPayload = (event: GlobalErrorLikeEvent): unknown => {
  const error = event.error ?? event.message;
  if (error) return error;

  const targetUrl = getChunkLoadResourceTargetUrl(event.target);
  return targetUrl ? `Failed to load module script: ${targetUrl}` : undefined;
};

export const getManualRecoveryPayload = (event: ManualChunkLoadRecoveryEvent): unknown => (
  event.payload ?? event.detail
);

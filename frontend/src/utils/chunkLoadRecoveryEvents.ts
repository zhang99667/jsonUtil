import { shouldPromptChunkLoadRecovery } from './chunkLoadRecovery';
import { getChunkLoadResourceTargetUrl } from './chunkLoadRecoveryResourceTargets';
import type { ChunkLoadRecoveryEventTarget, GlobalErrorLikeEvent, PromiseRejectionLikeEvent, VitePreloadErrorEvent } from './chunkLoadRecoveryEventTypes';

const getGlobalErrorPayload = (event: GlobalErrorLikeEvent): unknown => {
  const error = event.error ?? event.message;
  if (error) return error;

  const targetUrl = getChunkLoadResourceTargetUrl(event.target);
  return targetUrl ? `Failed to load module script: ${targetUrl}` : undefined;
};

export const installChunkLoadRecoveryListeners = (
  target: ChunkLoadRecoveryEventTarget,
  promptRefresh: () => void
): (() => void) => {
  let hasPrompted = false;

  const promptRefreshOnce = () => {
    if (hasPrompted) return;
    hasPrompted = true;
    promptRefresh();
  };

  const handlePreloadError = (event: Event) => {
    const preloadEvent = event as VitePreloadErrorEvent;
    if (!shouldPromptChunkLoadRecovery('vite-preload', preloadEvent.payload)) return;

    event.preventDefault();
    promptRefreshOnce();
  };

  const handleUnhandledRejection = (event: Event) => {
    const rejectionEvent = event as PromiseRejectionLikeEvent;
    if (!shouldPromptChunkLoadRecovery('promise-rejection', rejectionEvent.reason)) return;

    event.preventDefault();
    promptRefreshOnce();
  };

  const handleGlobalError = (event: Event) => {
    const errorEvent = event as GlobalErrorLikeEvent;
    if (!shouldPromptChunkLoadRecovery('global-error', getGlobalErrorPayload(errorEvent))) return;

    event.preventDefault();
    promptRefreshOnce();
  };

  target.addEventListener('vite:preloadError', handlePreloadError);
  target.addEventListener('unhandledrejection', handleUnhandledRejection);
  target.addEventListener('error', handleGlobalError);

  return () => {
    target.removeEventListener('vite:preloadError', handlePreloadError);
    target.removeEventListener('unhandledrejection', handleUnhandledRejection);
    target.removeEventListener('error', handleGlobalError);
  };
};

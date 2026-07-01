import { shouldPromptChunkLoadRecovery } from './chunkLoadRecovery';
import { getGlobalErrorPayload, getManualRecoveryPayload } from './chunkLoadRecoveryEventPayloads';
import {
  CHUNK_LOAD_RECOVERY_EVENT,
  type ChunkLoadRecoveryEventTarget,
  type GlobalErrorLikeEvent,
  type ManualChunkLoadRecoveryEvent,
  type PromiseRejectionLikeEvent,
  type VitePreloadErrorEvent,
} from './chunkLoadRecoveryEventTypes';

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

  const handleManualRecovery = (event: Event) => {
    const recoveryEvent = event as ManualChunkLoadRecoveryEvent;
    if (!shouldPromptChunkLoadRecovery('manual-catch', getManualRecoveryPayload(recoveryEvent))) return;

    event.preventDefault();
    promptRefreshOnce();
  };

  target.addEventListener('vite:preloadError', handlePreloadError);
  target.addEventListener('unhandledrejection', handleUnhandledRejection);
  target.addEventListener('error', handleGlobalError);
  target.addEventListener(CHUNK_LOAD_RECOVERY_EVENT, handleManualRecovery);

  return () => {
    target.removeEventListener('vite:preloadError', handlePreloadError);
    target.removeEventListener('unhandledrejection', handleUnhandledRejection);
    target.removeEventListener('error', handleGlobalError);
    target.removeEventListener(CHUNK_LOAD_RECOVERY_EVENT, handleManualRecovery);
  };
};

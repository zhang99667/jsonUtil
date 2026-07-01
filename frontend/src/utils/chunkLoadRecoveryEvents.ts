import { shouldPromptChunkLoadRecovery } from './chunkLoadRecovery';
import type {
  ChunkLoadRecoveryEventTarget,
  GlobalErrorLikeEvent,
  PromiseRejectionLikeEvent,
  VitePreloadErrorEvent,
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
    const error = errorEvent.error ?? errorEvent.message;
    if (!shouldPromptChunkLoadRecovery('global-error', error)) return;

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

import { shouldPromptChunkLoadRecovery } from './chunkLoadRecovery';

type ChunkLoadRecoveryListener = (event: Event) => void;

interface ChunkLoadRecoveryEventTarget {
  addEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
  removeEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
}

interface VitePreloadErrorEvent extends Event {
  payload?: unknown;
}

interface PromiseRejectionLikeEvent extends Event {
  reason?: unknown;
}

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

    promptRefreshOnce();
  };

  const handleUnhandledRejection = (event: Event) => {
    const rejectionEvent = event as PromiseRejectionLikeEvent;
    if (!shouldPromptChunkLoadRecovery('promise-rejection', rejectionEvent.reason)) return;

    event.preventDefault();
    promptRefreshOnce();
  };

  target.addEventListener('vite:preloadError', handlePreloadError);
  target.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    target.removeEventListener('vite:preloadError', handlePreloadError);
    target.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
};

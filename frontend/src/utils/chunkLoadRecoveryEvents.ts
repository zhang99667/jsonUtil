import { createChunkLoadRecoveryHandlers } from './chunkLoadRecoveryEventHandlers';
import {
  CHUNK_LOAD_RECOVERY_EVENT,
  type ChunkLoadRecoveryListener,
  type ChunkLoadRecoveryEventTarget,
} from './chunkLoadRecoveryEventTypes';

const RECOVERY_LISTENER_TYPES = {
  vitePreload: 'vite:preloadError',
  unhandledRejection: 'unhandledrejection',
  globalError: 'error',
  manualRecovery: CHUNK_LOAD_RECOVERY_EVENT,
} as const;

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

  const handlers = createChunkLoadRecoveryHandlers(promptRefreshOnce);
  const listeners: Array<[string, ChunkLoadRecoveryListener]> = [
    [RECOVERY_LISTENER_TYPES.vitePreload, handlers.handlePreloadError],
    [RECOVERY_LISTENER_TYPES.unhandledRejection, handlers.handleUnhandledRejection],
    [RECOVERY_LISTENER_TYPES.globalError, handlers.handleGlobalError],
    [RECOVERY_LISTENER_TYPES.manualRecovery, handlers.handleManualRecovery],
  ];

  listeners.forEach(([type, listener]) => target.addEventListener(type, listener));

  return () => {
    listeners.forEach(([type, listener]) => target.removeEventListener(type, listener));
  };
};

import { shouldPromptChunkLoadRecovery, type ChunkLoadRecoverySource } from './chunkLoadRecovery';
import { getGlobalErrorPayload, getManualRecoveryPayload } from './chunkLoadRecoveryEventPayloads';
import type {
  GlobalErrorLikeEvent,
  ManualChunkLoadRecoveryEvent,
  PromiseRejectionLikeEvent,
  VitePreloadErrorEvent,
} from './chunkLoadRecoveryEventTypes';

interface ChunkLoadRecoveryHandlers {
  handlePreloadError: (event: Event) => void;
  handleUnhandledRejection: (event: Event) => void;
  handleGlobalError: (event: Event) => void;
  handleManualRecovery: (event: Event) => void;
}

const promptIfRecoverable = (
  event: Event,
  source: ChunkLoadRecoverySource,
  payload: unknown,
  promptRefreshOnce: () => void
) => {
  if (!shouldPromptChunkLoadRecovery(source, payload)) return;

  event.preventDefault();
  promptRefreshOnce();
};

export const createChunkLoadRecoveryHandlers = (
  promptRefreshOnce: () => void
): ChunkLoadRecoveryHandlers => ({
  handlePreloadError: (event: Event) => {
    const preloadEvent = event as VitePreloadErrorEvent;
    promptIfRecoverable(event, 'vite-preload', preloadEvent.payload, promptRefreshOnce);
  },

  handleUnhandledRejection: (event: Event) => {
    const rejectionEvent = event as PromiseRejectionLikeEvent;
    promptIfRecoverable(event, 'promise-rejection', rejectionEvent.reason, promptRefreshOnce);
  },

  handleGlobalError: (event: Event) => {
    const errorEvent = event as GlobalErrorLikeEvent;
    promptIfRecoverable(event, 'global-error', getGlobalErrorPayload(errorEvent), promptRefreshOnce);
  },

  handleManualRecovery: (event: Event) => {
    const recoveryEvent = event as ManualChunkLoadRecoveryEvent;
    promptIfRecoverable(event, 'manual-catch', getManualRecoveryPayload(recoveryEvent), promptRefreshOnce);
  },
});

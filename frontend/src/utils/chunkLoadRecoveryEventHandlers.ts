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

const createRecoveryHandler = <TEvent extends Event>(
  source: ChunkLoadRecoverySource,
  readPayload: (event: TEvent) => unknown,
  promptRefreshOnce: () => void
) => (event: Event) => {
  promptIfRecoverable(event, source, readPayload(event as TEvent), promptRefreshOnce);
};

export const createChunkLoadRecoveryHandlers = (
  promptRefreshOnce: () => void
): ChunkLoadRecoveryHandlers => ({
  handlePreloadError: createRecoveryHandler<VitePreloadErrorEvent>('vite-preload', event => event.payload, promptRefreshOnce),
  handleUnhandledRejection: createRecoveryHandler<PromiseRejectionLikeEvent>('promise-rejection', event => event.reason, promptRefreshOnce),
  handleGlobalError: createRecoveryHandler<GlobalErrorLikeEvent>('global-error', getGlobalErrorPayload, promptRefreshOnce),
  handleManualRecovery: createRecoveryHandler<ManualChunkLoadRecoveryEvent>('manual-catch', getManualRecoveryPayload, promptRefreshOnce),
});

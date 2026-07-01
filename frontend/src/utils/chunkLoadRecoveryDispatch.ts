import { isDynamicImportLoadError } from './chunkLoadRecovery';
import {
  CHUNK_LOAD_RECOVERY_EVENT,
  type ChunkLoadRecoveryDispatchTarget,
  type ManualChunkLoadRecoveryEvent,
} from './chunkLoadRecoveryEventTypes';

const getDefaultDispatchTarget = (): ChunkLoadRecoveryDispatchTarget | undefined => (
  typeof window === 'undefined' ? undefined : window
);

const createChunkLoadRecoveryEvent = (error: unknown): ManualChunkLoadRecoveryEvent => {
  const event = new Event(CHUNK_LOAD_RECOVERY_EVENT, { cancelable: true }) as ManualChunkLoadRecoveryEvent;
  Object.defineProperty(event, 'payload', { value: error });
  return event;
};

export const dispatchChunkLoadRecoveryEvent = (
  error: unknown,
  target = getDefaultDispatchTarget(),
): boolean => {
  if (!target || !isDynamicImportLoadError(error)) return false;

  const event = createChunkLoadRecoveryEvent(error);
  const wasNotCancelled = target.dispatchEvent(event);
  return !wasNotCancelled || event.defaultPrevented;
};

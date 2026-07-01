import {
  CHUNK_LOAD_RECOVERY_EVENT,
  type ManualChunkLoadRecoveryEvent,
} from './chunkLoadRecoveryEventTypes';

export const createChunkLoadRecoveryEvent = (error: unknown): ManualChunkLoadRecoveryEvent => {
  const event = new Event(CHUNK_LOAD_RECOVERY_EVENT, { cancelable: true }) as ManualChunkLoadRecoveryEvent;
  Object.defineProperty(event, 'payload', { value: error });
  return event;
};

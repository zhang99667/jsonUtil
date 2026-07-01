import { isDynamicImportLoadError } from './chunkLoadRecovery';
import { createChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatchEvent';
import {
  getDefaultChunkLoadRecoveryDispatchTarget,
  type ChunkLoadRecoveryDispatchTarget,
} from './chunkLoadRecoveryDispatchTarget';

export const dispatchChunkLoadRecoveryEvent = (
  error: unknown,
  target = getDefaultChunkLoadRecoveryDispatchTarget(),
): boolean => {
  if (!target || !isDynamicImportLoadError(error)) return false;

  const event = createChunkLoadRecoveryEvent(error);
  const wasNotCancelled = target.dispatchEvent(event);
  return !wasNotCancelled || event.defaultPrevented;
};

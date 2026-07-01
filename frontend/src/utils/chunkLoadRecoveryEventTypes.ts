export type ChunkLoadRecoveryListener = (event: Event) => void;

export const CHUNK_LOAD_RECOVERY_EVENT = 'jsonutils:chunk-load-recovery';

export interface ChunkLoadRecoveryEventTarget {
  addEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
  removeEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
}

export interface ChunkLoadRecoveryDispatchTarget {
  dispatchEvent(event: Event): boolean;
}

export interface VitePreloadErrorEvent extends Event {
  payload?: unknown;
}

export interface PromiseRejectionLikeEvent extends Event {
  reason?: unknown;
}

export interface GlobalErrorLikeEvent extends Event {
  message?: unknown;
  error?: unknown;
}

export interface ManualChunkLoadRecoveryEvent extends Event {
  payload?: unknown;
  detail?: unknown;
}

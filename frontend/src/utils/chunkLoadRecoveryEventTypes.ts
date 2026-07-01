export type ChunkLoadRecoveryListener = (event: Event) => void;

export interface ChunkLoadRecoveryEventTarget {
  addEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
  removeEventListener(type: string, listener: ChunkLoadRecoveryListener): void;
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

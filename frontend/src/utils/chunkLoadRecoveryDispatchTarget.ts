export interface ChunkLoadRecoveryDispatchTarget {
  dispatchEvent(event: Event): boolean;
}

export const getDefaultChunkLoadRecoveryDispatchTarget = (): ChunkLoadRecoveryDispatchTarget | undefined => (
  typeof window === 'undefined' ? undefined : window
);

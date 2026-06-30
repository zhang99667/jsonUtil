const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'failed to load module script',
  'unable to preload css',
  'loading chunk',
  'chunkloaderror',
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : '';
  }
  return '';
};

export const isDynamicImportLoadError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

export type ChunkLoadRecoverySource = 'vite-preload' | 'promise-rejection';

export const shouldPromptChunkLoadRecovery = (
  source: ChunkLoadRecoverySource,
  error: unknown
): boolean => {
  if (source === 'vite-preload' && error === undefined) return true;
  return isDynamicImportLoadError(error);
};

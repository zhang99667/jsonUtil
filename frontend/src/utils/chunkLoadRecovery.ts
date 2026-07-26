import { someChunkLoadErrorMessage } from './chunkLoadRecoveryMessages';

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'failed to load module script',
  'unable to preload css',
  'loading chunk',
  'chunkloaderror',
];

export const isDynamicImportLoadError = (error: unknown): boolean => {
  return someChunkLoadErrorMessage(error, message => {
    const normalizedMessage = message.toLowerCase();
    return DYNAMIC_IMPORT_ERROR_PATTERNS.some(pattern => normalizedMessage.includes(pattern));
  });
};

export type ChunkLoadRecoverySource = 'vite-preload' | 'promise-rejection' | 'global-error' | 'manual-catch';

export const shouldPromptChunkLoadRecovery = (
  source: ChunkLoadRecoverySource,
  error: unknown
): boolean => {
  if (source === 'vite-preload' && error === undefined) return true;
  return isDynamicImportLoadError(error);
};

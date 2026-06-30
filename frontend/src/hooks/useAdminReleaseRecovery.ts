import { useAppChunkLoadRecovery } from './useAppChunkLoadRecovery';
import { useAppUpdateCheck } from './useAppUpdateCheck';

export const useAdminReleaseRecovery = () => {
  useAppUpdateCheck();
  useAppChunkLoadRecovery();
};

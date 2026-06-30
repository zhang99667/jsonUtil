import { describe, expect, it, vi } from 'vitest';
import { useAdminReleaseRecovery } from './useAdminReleaseRecovery';
import { useAppChunkLoadRecovery } from './useAppChunkLoadRecovery';
import { useAppUpdateCheck } from './useAppUpdateCheck';

vi.mock('./useAppChunkLoadRecovery', () => ({
  useAppChunkLoadRecovery: vi.fn(),
}));

vi.mock('./useAppUpdateCheck', () => ({
  useAppUpdateCheck: vi.fn(),
}));

describe('useAdminReleaseRecovery', () => {
  it('后台同时接入主动版本检测和动态 chunk 失效恢复', () => {
    useAdminReleaseRecovery();

    expect(useAppUpdateCheck).toHaveBeenCalledTimes(1);
    expect(useAppChunkLoadRecovery).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { runAppUpdateCheckOnce } from './appUpdateCheckRunner';

const newerManifest = {
  name: 'JSONUtils',
  version: '1.8.255',
};

describe('appUpdateCheckRunner', () => {
  it('发现未提示过的新版本时记录版本并通知', async () => {
    const onNotify = vi.fn();
    const onNotifiedVersionChange = vi.fn();

    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: null,
      fetchManifest: async () => newerManifest,
      getIsActive: () => true,
      getVisibilityState: () => 'visible',
      onNotify,
      onNotifiedVersionChange,
    });

    expect(onNotifiedVersionChange).toHaveBeenCalledWith('1.8.255');
    expect(onNotify).toHaveBeenCalledWith(expect.objectContaining({
      version: '1.8.255',
      versionLabel: 'v1.8.255',
    }));
  });

  it('请求返回后页面已失活时不再弹更新提示', async () => {
    const onNotify = vi.fn();
    let isActive = true;

    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: null,
      fetchManifest: async () => {
        isActive = false;
        return newerManifest;
      },
      getIsActive: () => isActive,
      getVisibilityState: () => 'visible',
      onNotify,
      onNotifiedVersionChange: vi.fn(),
    });

    expect(onNotify).not.toHaveBeenCalled();
  });

  it('隐藏页、重复版本、无效 manifest 和请求异常都保持静默', async () => {
    const onNotify = vi.fn();

    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: null,
      fetchManifest: async () => newerManifest,
      getIsActive: () => true,
      getVisibilityState: () => 'hidden',
      onNotify,
      onNotifiedVersionChange: vi.fn(),
    });
    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: '1.8.255',
      fetchManifest: async () => newerManifest,
      getIsActive: () => true,
      getVisibilityState: () => 'visible',
      onNotify,
      onNotifiedVersionChange: vi.fn(),
    });
    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: null,
      fetchManifest: async () => ({}),
      getIsActive: () => true,
      getVisibilityState: () => 'visible',
      onNotify,
      onNotifiedVersionChange: vi.fn(),
    });
    await runAppUpdateCheckOnce({
      currentVersion: '1.8.254',
      notifiedVersion: null,
      fetchManifest: async () => {
        throw new Error('network error');
      },
      getIsActive: () => true,
      getVisibilityState: () => 'visible',
      onNotify,
      onNotifiedVersionChange: vi.fn(),
    });

    expect(onNotify).not.toHaveBeenCalled();
  });
});

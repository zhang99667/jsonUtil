import { describe, expect, it } from 'vitest';
import {
  shouldNotifyAppUpdate,
  shouldRunAppUpdateCheck,
} from './appUpdateCheckDecision';

describe('appUpdateCheckDecision', () => {
  it('仅在页面活跃且可见时检查版本 manifest', () => {
    expect(shouldRunAppUpdateCheck({
      isActive: true,
      visibilityState: 'visible',
    })).toBe(true);

    expect(shouldRunAppUpdateCheck({
      isActive: false,
      visibilityState: 'visible',
    })).toBe(false);

    expect(shouldRunAppUpdateCheck({
      isActive: true,
      visibilityState: 'hidden',
    })).toBe(false);
  });

  it('只对未提示过的新远端版本弹出更新提示', () => {
    const manifest = {
      name: 'JSONUtils' as const,
      version: '1.8.255',
      versionLabel: 'v1.8.255',
    };

    expect(shouldNotifyAppUpdate({
      currentVersion: '1.8.254',
      manifest,
      notifiedVersion: null,
    })).toBe(true);

    expect(shouldNotifyAppUpdate({
      currentVersion: '1.8.254',
      manifest,
      notifiedVersion: '1.8.255',
    })).toBe(false);

    expect(shouldNotifyAppUpdate({
      currentVersion: '1.8.255',
      manifest,
      notifiedVersion: null,
    })).toBe(false);

    expect(shouldNotifyAppUpdate({
      currentVersion: '1.8.254',
      manifest: null,
      notifiedVersion: null,
    })).toBe(false);
  });
});

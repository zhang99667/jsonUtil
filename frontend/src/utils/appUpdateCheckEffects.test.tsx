import { describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { AppUpdateToastContent } from '../components/AppUpdateToastContent';
import {
  APP_UPDATE_TOAST_ID,
  fetchAppVersionManifest,
  showAppUpdateToast,
} from './appUpdateCheckEffects';
import { VERSION_MANIFEST_PATH } from './appVersion';

vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('../components/AppUpdateToastContent', () => ({
  AppUpdateToastContent: vi.fn(() => null),
}));

const manifest = {
  name: 'JSONUtils' as const,
  version: '1.8.451',
  versionLabel: 'v1.8.451',
};

describe('appUpdateCheckEffects', () => {
  it('展示固定 id 的更新提示并装配按钮副作用', () => {
    showAppUpdateToast(manifest);

    expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), {
      id: APP_UPDATE_TOAST_ID,
      duration: Infinity,
      position: 'top-center',
    });

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    const toastElement = renderToast({
      id: 'toast-1',
      visible: true,
      type: 'custom',
      ariaProps: {},
      message: '',
    });
    expect(toastElement).toMatchObject({
      type: AppUpdateToastContent,
      props: expect.objectContaining({
        manifest,
        toastId: 'toast-1',
        onDismiss: expect.any(Function),
        onOpenChangelog: expect.any(Function),
        onReload: expect.any(Function),
      }),
    });
  });

  it('以 no-store 请求版本 manifest，失败状态返回空结果', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => manifest })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAppVersionManifest()).resolves.toEqual(manifest);
    await expect(fetchAppVersionManifest()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(VERSION_MANIFEST_PATH), {
      cache: 'no-store',
    });

    vi.unstubAllGlobals();
  });
});

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  APP_VERSION,
  getAppVersionManifestUrl,
  isRemoteAppVersionNewer,
  parseAppVersionManifest,
} from '../utils/appVersion';

const APP_UPDATE_TOAST_ID = 'json-helper-app-update';
const UPDATE_CHECK_INITIAL_DELAY_MS = 30_000;
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export const useAppUpdateCheck = () => {
  const notifiedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    let isActive = true;

    const showUpdateToast = (versionLabel: string) => {
      toast.custom((toastItem) => (
        <div
          data-tour="app-update-toast"
          className="flex max-w-sm items-center gap-3 rounded-lg border border-brand-primary/60 bg-editor-sidebar px-4 py-3 text-sm text-white shadow-2xl"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold">发现新版本 {versionLabel}</div>
            <div className="mt-0.5 text-xs text-gray-300">刷新后即可使用最新功能和修复</div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            onClick={() => window.location.reload()}
          >
            刷新
          </button>
          <button
            type="button"
            className="shrink-0 rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => toast.dismiss(toastItem.id)}
          >
            稍后
          </button>
        </div>
      ), {
        id: APP_UPDATE_TOAST_ID,
        duration: Infinity,
        position: 'top-center',
      });
    };

    const checkForUpdate = async () => {
      if (!isActive || document.visibilityState === 'hidden') return;

      try {
        const response = await fetch(getAppVersionManifestUrl(), { cache: 'no-store' });
        if (!response.ok) return;

        const manifest = parseAppVersionManifest(await response.json());
        if (!manifest || !isRemoteAppVersionNewer(APP_VERSION, manifest.version)) return;
        if (notifiedVersionRef.current === manifest.version) return;

        notifiedVersionRef.current = manifest.version;
        showUpdateToast(manifest.versionLabel);
      } catch {
        // 版本检查失败不影响主流程，下一轮可自动重试。
      }
    };

    const initialTimer = window.setTimeout(checkForUpdate, UPDATE_CHECK_INITIAL_DELAY_MS);
    const intervalTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

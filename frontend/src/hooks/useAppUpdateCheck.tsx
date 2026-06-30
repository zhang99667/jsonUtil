import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AppUpdateToastContent } from '../components/AppUpdateToastContent';
import {
  getAppVersionManifestUrl,
  type AppVersionManifest,
} from '../utils/appVersion';
import { openAppChangelog } from '../utils/appEvents';
import {
  APP_UPDATE_CHECK_INITIAL_DELAY_MS,
  APP_UPDATE_CHECK_INTERVAL_MS,
} from '../utils/appUpdatePolicy';
import { runAppUpdateCheckOnce } from '../utils/appUpdateCheckRunner';

const APP_UPDATE_TOAST_ID = 'json-helper-app-update';

export const useAppUpdateCheck = () => {
  const notifiedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    let isActive = true;

    const showUpdateToast = (manifest: AppVersionManifest) => {
      toast.custom((toastItem) => (
        <AppUpdateToastContent
          manifest={manifest}
          toastId={toastItem.id}
          onOpenChangelog={openAppChangelog}
          onReload={() => window.location.reload()}
          onDismiss={(toastId) => toast.dismiss(toastId)}
        />
      ), {
        id: APP_UPDATE_TOAST_ID,
        duration: Infinity,
        position: 'top-center',
      });
    };

    const checkForUpdate = async () => {
      await runAppUpdateCheckOnce({
        notifiedVersion: notifiedVersionRef.current,
        getIsActive: () => isActive,
        getVisibilityState: () => document.visibilityState,
        onNotify: showUpdateToast,
        onNotifiedVersionChange: (version) => {
          notifiedVersionRef.current = version;
        },
        fetchManifest: async () => {
          const response = await fetch(getAppVersionManifestUrl(), { cache: 'no-store' });
          return response.ok ? response.json() : null;
        },
      });
    };

    const initialTimer = window.setTimeout(checkForUpdate, APP_UPDATE_CHECK_INITIAL_DELAY_MS);
    const intervalTimer = window.setInterval(checkForUpdate, APP_UPDATE_CHECK_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    };
    const handleFocus = () => {
      void checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
};

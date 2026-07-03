import { useEffect, useRef } from 'react';
import {
  APP_UPDATE_CHECK_INITIAL_DELAY_MS,
  APP_UPDATE_CHECK_INTERVAL_MS,
} from '../utils/appUpdatePolicy';
import { runAppUpdateCheckOnce } from '../utils/appUpdateCheckRunner';
import { installAppUpdateCheckSchedule } from '../utils/appUpdateCheckSchedule';
import {
  fetchAppVersionManifest,
  showAppUpdateToast,
} from '../utils/appUpdateCheckEffects';

export const useAppUpdateCheck = () => {
  const notifiedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    let isActive = true;

    const checkForUpdate = async () => {
      await runAppUpdateCheckOnce({
        notifiedVersion: notifiedVersionRef.current,
        getIsActive: () => isActive,
        getVisibilityState: () => document.visibilityState,
        onNotify: showAppUpdateToast,
        onNotifiedVersionChange: (version) => {
          notifiedVersionRef.current = version;
        },
        fetchManifest: fetchAppVersionManifest,
      });
    };

    const cleanupSchedule = installAppUpdateCheckSchedule({
      checkForUpdate,
      windowTarget: window,
      documentTarget: document,
      initialDelayMs: APP_UPDATE_CHECK_INITIAL_DELAY_MS,
      intervalMs: APP_UPDATE_CHECK_INTERVAL_MS,
    });

    return () => {
      isActive = false;
      cleanupSchedule();
    };
  }, []);
};

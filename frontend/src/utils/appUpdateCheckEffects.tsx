import toast from 'react-hot-toast';
import { AppUpdateToastContent } from '../components/AppUpdateToastContent';
import {
  getAppVersionManifestUrl,
  type AppVersionManifest,
} from './appVersion';
import { openAppChangelog } from './appEvents';

export const APP_UPDATE_TOAST_ID = 'json-helper-app-update';

export const showAppUpdateToast = (manifest: AppVersionManifest) => {
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

export const fetchAppVersionManifest = async (): Promise<unknown | null> => {
  try {
    const response = await fetch(getAppVersionManifestUrl(), { cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

import type { InstallAppUpdateCheckScheduleInput } from './appUpdateCheckScheduleTypes';

export type { InstallAppUpdateCheckScheduleInput } from './appUpdateCheckScheduleTypes';

export const installAppUpdateCheckSchedule = ({
  checkForUpdate,
  windowTarget,
  documentTarget,
  initialDelayMs,
  intervalMs,
}: InstallAppUpdateCheckScheduleInput): (() => void) => {
  const initialTimer = windowTarget.setTimeout(checkForUpdate, initialDelayMs);
  const intervalTimer = windowTarget.setInterval(checkForUpdate, intervalMs);
  const handleVisibilityChange = () => {
    if (documentTarget.visibilityState === 'visible') {
      void checkForUpdate();
    }
  };
  const handleFocus = () => {
    void checkForUpdate();
  };

  documentTarget.addEventListener('visibilitychange', handleVisibilityChange);
  windowTarget.addEventListener('focus', handleFocus);

  return () => {
    windowTarget.clearTimeout(initialTimer);
    windowTarget.clearInterval(intervalTimer);
    documentTarget.removeEventListener('visibilitychange', handleVisibilityChange);
    windowTarget.removeEventListener('focus', handleFocus);
  };
};

type AppUpdateCheckCallback = () => void | Promise<void>;

interface AppUpdateCheckWindowTarget {
  setTimeout(callback: AppUpdateCheckCallback, delayMs: number): number;
  clearTimeout(timer: number): void;
  setInterval(callback: AppUpdateCheckCallback, delayMs: number): number;
  clearInterval(timer: number): void;
  addEventListener(type: 'focus', listener: () => void): void;
  removeEventListener(type: 'focus', listener: () => void): void;
}

interface AppUpdateCheckDocumentTarget {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

interface InstallAppUpdateCheckScheduleInput {
  checkForUpdate: AppUpdateCheckCallback;
  windowTarget: AppUpdateCheckWindowTarget;
  documentTarget: AppUpdateCheckDocumentTarget;
  initialDelayMs: number;
  intervalMs: number;
}

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

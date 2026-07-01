export type AppUpdateCheckCallback = () => void | Promise<void>;

export interface AppUpdateCheckWindowTarget {
  setTimeout(callback: AppUpdateCheckCallback, delayMs: number): number;
  clearTimeout(timer: number): void;
  setInterval(callback: AppUpdateCheckCallback, delayMs: number): number;
  clearInterval(timer: number): void;
  addEventListener(type: 'focus', listener: () => void): void;
  removeEventListener(type: 'focus', listener: () => void): void;
}

export interface AppUpdateCheckDocumentTarget {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export interface InstallAppUpdateCheckScheduleInput {
  checkForUpdate: AppUpdateCheckCallback;
  windowTarget: AppUpdateCheckWindowTarget;
  documentTarget: AppUpdateCheckDocumentTarget;
  initialDelayMs: number;
  intervalMs: number;
}

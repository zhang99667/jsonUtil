import type { InstallAppUpdateCheckScheduleInput } from './appUpdateCheckScheduleTypes';

export type { InstallAppUpdateCheckScheduleInput } from './appUpdateCheckScheduleTypes';

export const installAppUpdateCheckSchedule = ({
  checkForUpdate,
  windowTarget,
  documentTarget,
  initialDelayMs,
  intervalMs,
}: InstallAppUpdateCheckScheduleInput): (() => void) => {
  // 所有触发源共享单飞门闩，避免旧请求倒序覆盖已提示版本。
  let checkInFlight = false;
  const finishCheck = () => {
    checkInFlight = false;
  };
  const triggerCheck = () => {
    if (checkInFlight) return;
    checkInFlight = true;
    try {
      const result = checkForUpdate();
      if (result) void result.then(finishCheck, finishCheck);
      else finishCheck();
    } catch {
      finishCheck();
    }
  };

  const initialTimer = windowTarget.setTimeout(triggerCheck, initialDelayMs);
  const intervalTimer = windowTarget.setInterval(triggerCheck, intervalMs);
  const handleVisibilityChange = () => {
    if (documentTarget.visibilityState === 'visible') triggerCheck();
  };
  const handleFocus = triggerCheck;
  const cleanupSteps = [
    () => windowTarget.clearTimeout(initialTimer),
    () => windowTarget.clearInterval(intervalTimer),
    () => documentTarget.removeEventListener('visibilitychange', handleVisibilityChange),
    () => windowTarget.removeEventListener('focus', handleFocus),
  ];
  const cleanup = () => {
    const cleanupErrors: unknown[] = [];
    for (const step of cleanupSteps) {
      try {
        step();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length) throw cleanupErrors[0];
  };
  try {
    documentTarget.addEventListener('visibilitychange', handleVisibilityChange);
    windowTarget.addEventListener('focus', handleFocus);
  } catch (error) {
    try {
      cleanup();
    } catch {
      // 清理异常不能覆盖原始安装异常。
    }
    throw error;
  }

  return cleanup;
};

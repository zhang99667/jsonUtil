export const appRecoveryUpdateScheduleMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appUpdateCheckSchedule.ts',
    maxLines: 60,
    reason: '新版本检测调度 helper 应只负责定时器、焦点和可见态监听装配，不夹带 manifest 判断',
  },
];

export const appRecoveryUpdateScheduleMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appUpdateCheckSchedule.ts',
    maxLines: 45,
    reason: '新版本检测调度 helper 应只负责定时器、焦点和可见态监听装配，不夹带 manifest 判断',
  },
  {
    file: 'frontend/src/utils/appUpdateCheckScheduleTypes.ts',
    maxLines: 35,
    reason: '新版本检测调度 target 契约应独立维护，避免调度实现被类型声明撑大',
  },
];

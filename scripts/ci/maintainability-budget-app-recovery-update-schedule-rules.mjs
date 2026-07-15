export const appRecoveryUpdateScheduleMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appUpdateCheckSchedule.ts',
    maxLines: 55,
    reason: '新版本检测调度 helper 只负责定时器、焦点、可见态和单飞装配，不夹带 manifest 判断',
  },
  {
    file: 'frontend/src/utils/appUpdateCheckScheduleTypes.ts',
    maxLines: 35,
    reason: '新版本检测调度 target 契约应独立维护，避免调度实现被类型声明撑大',
  },
];

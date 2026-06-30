export const appRecoveryUpdateCoreMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appUpdatePolicy.ts',
    maxLines: 30,
    reason: '新版本检测策略应保持少量常量，便于单测锁定发布恢复窗口',
  },
  {
    file: 'frontend/src/hooks/useAppUpdateCheck.tsx',
    maxLines: 85,
    reason: '新版本检测 hook 应只负责 Toast、manifest 拉取和检查器装配，触发调度拆到独立 helper',
  },
  {
    file: 'frontend/src/hooks/useAdminReleaseRecovery.ts',
    maxLines: 25,
    reason: '后台发布恢复 hook 应只组合主动版本检测和动态 chunk 失效恢复',
  },
  {
    file: 'frontend/src/utils/appUpdateCheckDecision.ts',
    maxLines: 45,
    reason: '新版本检测决策应保持纯活跃态、版本和去重判断，不夹带 Hook 副作用',
  },
  {
    file: 'frontend/src/utils/appUpdateCheckRunner.ts',
    maxLines: 60,
    reason: '新版本单次检查执行器应保持请求、解析、二次活跃态检查和通知分发的薄编排',
  },
];
